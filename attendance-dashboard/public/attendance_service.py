import serial
import sqlite3
import time
import logging
import os
import sys
from supabase import create_client, Client
from serial.tools import list_ports

# ---------- CONFIGURATION ----------
# Use relative paths: all files go in the same folder as the script
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(BASE_DIR, 'attendance.db')
LOG_FILE = os.path.join(BASE_DIR, 'attendance_service.log')

SUPABASE_URL = "https://lgrwdvkdhybcqcbctoje.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  # your service_role key

# ---------- LOGGING SETUP ----------
logging.basicConfig(
    filename=LOG_FILE,
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
log = logging.getLogger()

# ---------- INIT SUPABASE ----------
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ---------- LOCAL DATABASE ----------
conn = sqlite3.connect(DB_FILE)
cursor = conn.cursor()
cursor.execute('''
    CREATE TABLE IF NOT EXISTS registrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT,
        mac TEXT UNIQUE,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
''')
conn.commit()

def is_blacklisted(mac):
    cursor.execute("SELECT 1 FROM registrations WHERE mac = ?", (mac,))
    return cursor.fetchone() is not None

def register_user(name, email, mac):
    try:
        cursor.execute("INSERT INTO registrations (name, email, mac) VALUES (?, ?, ?)",
                       (name, email, mac))
        conn.commit()
    except sqlite3.IntegrityError:
        return False  # duplicate MAC

    try:
        supabase.table("registrations").insert({
            "name": name,
            "email": email,
            "mac": mac
        }).execute()
        log.info(f"Synced to cloud: {name}, {email}, {mac}")
    except Exception as e:
        log.error(f"Supabase sync error: {e}")

    return True

def find_esp32_port():
    """Auto-detect the ESP32 USB serial port."""
    ports = list_ports.comports()
    for port in ports:
        # ESP32 usually has 'CP210x' or 'CH340' in its description
        if 'CP210x' in port.description or 'CH340' in port.description or 'USB Serial' in port.description:
            return port.device
    # fallback: return first available port (or let user set manually if none)
    if ports:
        return ports[0].device
    return None

def process_serial():
    while True:
        port = find_esp32_port()
        if not port:
            log.warning("No serial port found. Retrying in 5 seconds...")
            time.sleep(5)
            continue

        try:
            log.info(f"Attempting to open {port}...")
            ser = serial.Serial(port, 115200, timeout=1)
            log.info(f"Connected to {port}. Waiting for ESP32 READY...")

            # Wait for READY signal
            start_time = time.time()
            while True:
                line = ser.readline().decode('utf-8', errors='ignore').strip()
                if line == "READY":
                    log.info("ESP32 is ready.")
                    break
                if time.time() - start_time > 10:
                    log.warning("ESP32 not sending READY, retrying...")
                    ser.close()
                    raise serial.SerialException("No READY received")

            while True:
                line = ser.readline().decode('utf-8', errors='ignore').strip()
                if not line:
                    continue
                log.debug(f"Received: {line}")

                if line.startswith("CHECK_MAC:"):
                    mac = line[len("CHECK_MAC:"):].strip().upper()
                    if is_blacklisted(mac):
                        ser.write(b"BLACKLISTED\n")
                        log.info(f"BLACKLISTED: {mac}")
                    else:
                        ser.write(b"ALLOW\n")
                        log.info(f"ALLOW: {mac}")

                elif line.startswith("REGISTER:"):
                    data = line[len("REGISTER:"):]
                    parts = data.split(',')
                    if len(parts) < 3:
                        ser.write(b"ERROR\n")
                        continue
                    name = ','.join(parts[:-2])
                    email = parts[-2].strip()
                    mac = parts[-1].strip().upper()

                    if register_user(name, email, mac):
                        ser.write(b"REGISTERED\n")
                        log.info(f"Registered: {name}, {email}, {mac}")
                    else:
                        ser.write(b"DUPLICATE\n")
                        log.warning(f"Duplicate MAC: {mac}")

        except serial.SerialException as e:
            log.warning(f"Serial error: {e}. Retrying in 5 seconds...")
            time.sleep(5)
        except Exception as e:
            log.error(f"Unexpected error: {e}. Retrying in 5 seconds...")
            time.sleep(5)
        finally:
            try:
                ser.close()
            except:
                pass

if __name__ == "__main__":
    log.info("Attendance service starting.")
    process_serial()