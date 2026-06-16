import serial
import sqlite3
import re
import sys

# ---------- Configuration ----------
SERIAL_PORT = 'COM3'      # Windows example: COM3; on Linux/Mac: /dev/ttyUSB0
BAUD_RATE = 115200
DB_FILE = 'attendance.db'

# ---------- Database setup ----------
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
    """Return True if MAC already exists in DB."""
    cursor.execute("SELECT 1 FROM registrations WHERE mac = ?", (mac,))
    return cursor.fetchone() is not None

def register_user(name, email, mac):
    """Insert a new registration. Returns True if successful, False if duplicate."""
    try:
        cursor.execute("INSERT INTO registrations (name, email, mac) VALUES (?, ?, ?)",
                       (name, email, mac))
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False  # duplicate MAC

# ---------- Serial communication ----------
try:
    ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
    print(f"Connected to {SERIAL_PORT}. Waiting for ESP32...")
except Exception as e:
    print(f"Serial error: {e}")
    sys.exit(1)

# Wait for ESP32 ready signal
while True:
    line = ser.readline().decode('utf-8', errors='ignore').strip()
    if line == "READY":
        print("ESP32 is ready.")
        break
    # could print other debug lines if needed

print("Listening for commands...")

try:
    while True:
        line = ser.readline().decode('utf-8', errors='ignore').strip()
        if not line:
            continue
        print(f"Received: {line}")

        # Format: CHECK_MAC:AA:BB:CC:DD:EE:FF
        if line.startswith("CHECK_MAC:"):
            mac = line[len("CHECK_MAC:"):].strip().upper()
            if is_blacklisted(mac):
                ser.write(b"BLACKLISTED\n")
                print(f"  -> BLACKLISTED")
            else:
                ser.write(b"ALLOW\n")
                print(f"  -> ALLOW")

        # Format: REGISTER:name,email,MAC
        elif line.startswith("REGISTER:"):
            data = line[len("REGISTER:"):]
            try:
                # split by commas, but be careful with commas in name/email (unlikely)
                parts = data.split(',')
                if len(parts) < 3:
                    ser.write(b"ERROR\n")
                    continue
                name = ','.join(parts[:-2])  # in case name contains commas
                email = parts[-2].strip()
                mac = parts[-1].strip().upper()
                
                if register_user(name, email, mac):
                    ser.write(b"REGISTERED\n")
                    print(f"  -> Registered: {name}, {email}, {mac}")
                else:
                    ser.write(b"DUPLICATE\n")
                    print(f"  -> Duplicate MAC: {mac}")
            except Exception as e:
                ser.write(b"ERROR\n")
                print(f"  -> Parse error: {e}")

        # Ignore any other lines (debug prints from ESP32)
except KeyboardInterrupt:
    print("Shutting down.")
finally:
    ser.close()
    conn.close()