import serial
import sqlite3
import sys
from supabase import create_client, Client

# ---------- Configuration ----------
SERIAL_PORT = 'COM3'        # change as needed
BAUD_RATE = 115200
DB_FILE = 'attendance.db'

# Supabase credentials (replace with yours)
SUPABASE_URL = "https://lgrwdvkdhybcqcbctoje.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxncndkdmtkaHliY3FjYmN0b2plIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTY0NDcxNSwiZXhwIjoyMDk3MjIwNzE1fQ.Ur5i2zaoknpXdueRr9qMURqQ8lEKeSryRmfzFY5kJvc"  # anon key

# ---------- Init Supabase ----------
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ---------- Local database setup ----------
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
    # 1. Insert locally
    try:
        cursor.execute("INSERT INTO registrations (name, email, mac) VALUES (?, ?, ?)",
                       (name, email, mac))
        conn.commit()
    except sqlite3.IntegrityError:
        return False  # duplicate MAC

    # 2. Sync to Supabase
    try:
        supabase.table("registrations").insert({
            "name": name,
            "email": email,
            "mac": mac
        }).execute()
        print(f"  -> Synced to cloud: {name}, {email}, {mac}")
    except Exception as e:
        # Already exists or network error – log but continue
        print(f"  -> Supabase insert error: {e}")

    return True

# ---------- Serial communication ----------
try:
    ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
    print(f"Connected to {SERIAL_PORT}. Waiting for ESP32...")
except Exception as e:
    print(f"Serial error: {e}")
    sys.exit(1)

# Wait for ESP32 ready
while True:
    line = ser.readline().decode('utf-8', errors='ignore').strip()
    if line == "READY":
        print("ESP32 is ready.")
        break

print("Listening for commands...")

try:
    while True:
        line = ser.readline().decode('utf-8', errors='ignore').strip()
        if not line:
            continue
        print(f"Received: {line}")

        if line.startswith("CHECK_MAC:"):
            mac = line[len("CHECK_MAC:"):].strip().upper()
            if is_blacklisted(mac):
                ser.write(b"BLACKLISTED\n")
                print(f"  -> BLACKLISTED")
            else:
                ser.write(b"ALLOW\n")
                print(f"  -> ALLOW")

        elif line.startswith("REGISTER:"):
            data = line[len("REGISTER:"):]
            try:
                parts = data.split(',')
                if len(parts) < 3:
                    ser.write(b"ERROR\n")
                    continue
                name = ','.join(parts[:-2])
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

except KeyboardInterrupt:
    print("Shutting down.")
finally:
    ser.close()
    conn.close()