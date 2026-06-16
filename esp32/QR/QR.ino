#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <WiFi.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <esp_wifi.h>

extern "C" {
  #include "qrcodegen.h"
}

// ---------- OLED ----------
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET    -1
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// ---------- Access Point ----------
const char* ssid     = "AttendanceCheck";
const char* password = "12345678";      // change this
IPAddress apIP(192, 168, 4, 1);
IPAddress netMask(255, 255, 255, 0);

WebServer server(80);
DNSServer dnsServer;
const byte DNS_PORT = 53;

// ---------- QR buffers ----------
#define QR_VERSION 3
static uint8_t qrcode[qrcodegen_BUFFER_LEN_FOR_VERSION(QR_VERSION)];
static uint8_t tempBuffer[qrcodegen_BUFFER_LEN_FOR_VERSION(QR_VERSION)];

// ---------- IP → MAC table (built from Wi‑Fi events) ----------
#define MAX_STATIONS 10
struct IPMacPair {
  IPAddress ip;
  uint8_t mac[6];
  bool used = false;
} stationIPMac[MAX_STATIONS];

void addIPMac(const uint8_t* mac, IPAddress ip) {
  for (int i = 0; i < MAX_STATIONS; i++) {
    if (!stationIPMac[i].used) {
      stationIPMac[i].ip = ip;
      memcpy(stationIPMac[i].mac, mac, 6);
      stationIPMac[i].used = true;
      return;
    }
  }
}

void removeIPMac(const uint8_t* mac) {
  for (int i = 0; i < MAX_STATIONS; i++) {
    if (stationIPMac[i].used && memcmp(stationIPMac[i].mac, mac, 6) == 0) {
      stationIPMac[i].used = false;
      return;
    }
  }
}

const uint8_t* getMACFromIP(IPAddress ip) {
  for (int i = 0; i < MAX_STATIONS; i++) {
    if (stationIPMac[i].used && stationIPMac[i].ip == ip) {
      return stationIPMac[i].mac;
    }
  }
  return nullptr;
}

// ---------- Serial protocol helpers ----------
String macToString(const uint8_t* mac) {
  char buf[18];
  snprintf(buf, sizeof(buf), "%02X:%02X:%02X:%02X:%02X:%02X",
           mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
  return String(buf);
}

// Send a command to the laptop and wait for a response (blocking)
String sendCommand(String cmd, unsigned long timeout = 2000) {
  Serial.println(cmd);
  unsigned long start = millis();
  while (millis() - start < timeout) {
    if (Serial.available()) {
      String response = Serial.readStringUntil('\n');
      response.trim();
      return response;
    }
    delay(10);
  }
  return ""; // timeout
}

// Check with laptop if MAC is blacklisted
bool isMacBlacklisted(const uint8_t* mac) {
  String cmd = "CHECK_MAC:" + macToString(mac);
  String resp = sendCommand(cmd);
  return (resp == "BLACKLISTED");
}

// ---------- Wi‑Fi event handler ----------
void WiFiEvent(WiFiEvent_t event, WiFiEventInfo_t info) {
  switch (event) {
    case ARDUINO_EVENT_WIFI_AP_STAIPASSIGNED:
      {
        uint8_t* mac = info.wifi_ap_staipassigned.mac;
        IPAddress ip = IPAddress(info.wifi_ap_staipassigned.ip.addr);

        // Check with laptop if this MAC is already registered
        if (isMacBlacklisted(mac)) {
          Serial.printf("Blacklisted device %s tried to connect\n", ip.toString().c_str());
          // Find AID and deauth
          wifi_sta_list_t staList;
          if (esp_wifi_ap_get_sta_list(&staList) == ESP_OK) {
            for (int i = 0; i < staList.num; i++) {
              uint8_t* raw = ((uint8_t*)staList.sta) + i * sizeof(wifi_sta_info_t);
              if (memcmp(raw, mac, 6) == 0) {
                uint16_t aid = *(uint16_t*)(raw + 8);
                esp_wifi_deauth_sta(aid);
                break;
              }
            }
          }
          return;   // don't add to IP-Mac table
        }

        // Allowed – store
        addIPMac(mac, ip);
        Serial.printf("Station connected – IP: %s\n", ip.toString().c_str());
      }
      break;

    case ARDUINO_EVENT_WIFI_AP_STADISCONNECTED:
      {
        uint8_t* mac = info.wifi_ap_stadisconnected.mac;
        removeIPMac(mac);
      }
      break;

    default: break;
  }
}

// ---------- Function prototypes ----------
void drawQRCode(const char* text);
String generateRegistrationForm();
void deauthClientByIP(IPAddress ip);

// ========== WEB HANDLERS ==========

void handleCaptivePortal() {
  server.send(200, "text/html", generateRegistrationForm());
}

void handleRegisterSubmit() {
  if (server.method() == HTTP_POST) {
    String name = server.arg("name");
    String email = server.arg("email");
    IPAddress clientIP = server.client().remoteIP();

    // Get MAC from IP
    const uint8_t* mac = getMACFromIP(clientIP);
    String macStr = mac ? macToString(mac) : "UNKNOWN";

    Serial.printf("Registration attempt: %s, %s, MAC: %s\n", name.c_str(), email.c_str(), macStr.c_str());

    // Send registration to laptop
    String cmd = "REGISTER:" + name + "," + email + "," + macStr;
    String resp = sendCommand(cmd, 3000);
    if (resp == "REGISTERED") {
      String msg = "<h2>Registration successful!</h2><p>You may close this page.</p>";
      server.send(200, "text/html", msg);
      delay(100);
      deauthClientByIP(clientIP);
    } else {
      String msg = "<h2>Already registered!</h2><p>This device has already been used.</p>";
      server.send(200, "text/html", msg);
      delay(100);
      deauthClientByIP(clientIP);   // kick regardless
    }
  }
}

// ========== DEAUTH HELPER (no longer adds to local blacklist) ==========
void deauthClientByIP(IPAddress ip) {
  const uint8_t* targetMAC = getMACFromIP(ip);
  if (!targetMAC) return;

  wifi_sta_list_t staList;
  if (esp_wifi_ap_get_sta_list(&staList) != ESP_OK) return;

  for (int i = 0; i < staList.num; i++) {
    uint8_t* raw = ((uint8_t*)staList.sta) + i * sizeof(wifi_sta_info_t);
    if (memcmp(raw, targetMAC, 6) == 0) {
      uint16_t aid = *(uint16_t*)(raw + 8);
      esp_wifi_deauth_sta(aid);
      removeIPMac(targetMAC);
      return;
    }
  }
}

// ========== HTML FORM ==========
String generateRegistrationForm() {
  String html = "<!DOCTYPE html><html><head>";
  html += "<meta name='viewport' content='width=device-width, initial-scale=1'>";
  html += "<title>Event Registration</title>";
  html += "<style>body{font-family:Arial,sans-serif;margin:20px;text-align:center;}";
  html += "input{display:block;width:90%;padding:10px;margin:10px auto;font-size:16px;}";
  html += "button{padding:10px 20px;font-size:16px;}</style></head><body>";
  html += "<h2>Event Registration</h2>";
  html += "<form action='/submit' method='POST'>";
  html += "<input type='text' name='name' placeholder='Full Name' required>";
  html += "<input type='email' name='email' placeholder='Email Address' required>";
  html += "<button type='submit'>Register</button>";
  html += "</form></body></html>";
  return html;
}

// ========== QR CODE ==========
void drawQRCode(const char* text) {
  bool ok = qrcodegen_encodeText(text, tempBuffer, qrcode, qrcodegen_Ecc_LOW,
                                 QR_VERSION, QR_VERSION,
                                 qrcodegen_Mask_AUTO, true);
  if (!ok) {
    display.clearDisplay();
    display.setCursor(0,0);
    display.print("QR error");
    display.display();
    return;
  }
  int size = qrcodegen_getSize(qrcode);
  int scale = min(SCREEN_WIDTH / size, SCREEN_HEIGHT / size);
  scale = min(scale, 4);
  int xOffset = (SCREEN_WIDTH - size * scale) / 2;
  int yOffset = (SCREEN_HEIGHT - size * scale) / 2;
  
  display.clearDisplay();
  for (int y = 0; y < size; y++) {
    for (int x = 0; x < size; x++) {
      if (qrcodegen_getModule(qrcode, x, y)) {
        display.fillRect(xOffset + x * scale, yOffset + y * scale, scale, scale, SSD1306_WHITE);
      }
    }
  }
  display.display();
}

// ========== SETUP ==========
void setup() {
  Serial.begin(115200);
  delay(1000);  // let serial monitor / laptop script connect
  
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3D)) {
      Serial.println("OLED init failed");
      for(;;);
    }
  }
  display.clearDisplay();
  display.display();
  delay(100);
  
  WiFi.onEvent(WiFiEvent);
  
  WiFi.mode(WIFI_AP);
  WiFi.softAPConfig(apIP, apIP, netMask);
  WiFi.softAP(ssid, password);
  
  Serial.print("AP IP: ");
  Serial.println(WiFi.softAPIP());
  
  dnsServer.start(DNS_PORT, "*", apIP);
  
  server.on("/generate_204", handleCaptivePortal);
  server.on("/hotspot-detect.html", handleCaptivePortal);
  server.on("/library/test/success.html", handleCaptivePortal);
  server.on("/ncsi.txt", handleCaptivePortal);
  server.on("/success.txt", handleCaptivePortal);
  server.on("/connecttest.txt", handleCaptivePortal);
  server.on("/fwlink", handleCaptivePortal);
  server.on("/redirect", handleCaptivePortal);
  server.on("/", handleCaptivePortal);
  server.on("/index.html", handleCaptivePortal);
  server.on("/register", handleCaptivePortal);
  server.on("/submit", HTTP_POST, handleRegisterSubmit);
  server.onNotFound(handleCaptivePortal);
  
  server.begin();
  
  String wifiQR = "WIFI:T:WPA;S:AttendanceCheck;P:12345678;;";
  drawQRCode(wifiQR.c_str());
  
  Serial.println("READY");
}

void loop() {
  dnsServer.processNextRequest();
  server.handleClient();
  delay(2);
}