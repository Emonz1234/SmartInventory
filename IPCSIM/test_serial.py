#!/usr/bin/env python3
"""
Test script untuk verifikasi IPCSIM Serial Connection
Gunakan untuk test konfigurasi COM port sebelum chạy production
"""

import serial
import time
from pathlib import Path
import sys

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.core.config import settings
from app.serial.protocol.parser import ProtocolParser


def test_serial_connection():
    """Test koneksi serial ke cổng COM"""
    print(f"[TEST] Menghubung ke {settings.SERIAL_PORT} @ {settings.SERIAL_BAUDRATE}...")
    
    try:
        ser = serial.Serial(
            port=settings.SERIAL_PORT,
            baudrate=settings.SERIAL_BAUDRATE,
            timeout=2
        )
        print("[✓] Kết nối thành công!")
        return ser
    except Exception as e:
        print(f"[✗] Lỗi kết nối: {e}")
        return None


def test_protocol_parser():
    """Test protocol parser với dữ liệu mẫu"""
    print("\n[TEST] Kiểm tra Protocol Parser...")
    
    test_cases = [
        "ENVSTT|1|22.5|65.3|80.2|0",
        "OPRSTT|1|5.2|25.4|0|0|1",
        "BRKSTT|1|0|0|1",
    ]
    
    for test_data in test_cases:
        try:
            msg = ProtocolParser.parse(test_data)
            print(f"[✓] Parsed: {test_data[:30]}...")
            print(f"    Type: {msg.msg_type}, Payload keys: {list(msg.payload.keys())}")
        except Exception as e:
            print(f"[✗] Error parsing {test_data}: {e}")


def test_read_serial(ser):
    """Test baca data dari serial port"""
    print(f"\n[TEST] Menunggu data dari {settings.SERIAL_PORT} (timeout 10s)...")
    print("Kirim test data dari Simulation atau sesuatu devices...")
    
    ser.flushInput()
    start_time = time.time()
    
    while time.time() - start_time < 10:
        try:
            line = ser.readline()
            if line:
                data = line.decode().strip()
                print(f"[✓] Data diterima: {data}")
                msg = ProtocolParser.parse(data)
                print(f"    Parsed type: {msg.msg_type}")
                return True
        except Exception as e:
            print(f"[✗] Error: {e}")
    
    print("[✗] Timeout - tidak ada data diterima")
    return False


def test_database():
    """Test database connection"""
    print("\n[TEST] Kiểm tra Database...")
    
    try:
        from app.database.database import SessionLocal, Base, engine
        from app.database.models.environment import EnvironmentSnapshot
        from app.database.models.runtime import OperationSnapshot, BreakdownSnapshot
        
        # Create tables
        Base.metadata.create_all(bind=engine)
        print("[✓] Database initialized")
        
        # Test session
        db = SessionLocal()
        env_count = db.query(EnvironmentSnapshot).count()
        opr_count = db.query(OperationSnapshot).count()
        brk_count = db.query(BreakdownSnapshot).count()
        db.close()
        
        print(f"[✓] Tables exist:")
        print(f"    - environment_snapshots: {env_count} records")
        print(f"    - operation_snapshots: {opr_count} records")
        print(f"    - breakdown_snapshots: {brk_count} records")
        return True
    except Exception as e:
        print(f"[✗] Database error: {e}")
        return False


def main():
    """Main test function"""
    print("=" * 60)
    print("IPCSIM Serial Connection Test")
    print("=" * 60)
    print(f"Config: {settings.SERIAL_PORT} @ {settings.SERIAL_BAUDRATE}")
    print(f"Database: {settings.DB_PATH}")
    print()
    
    # Test 1: Database
    if not test_database():
        print("\n[STOP] Database test failed!")
        return False
    
    # Test 2: Protocol Parser
    test_protocol_parser()
    
    # Test 3: Serial Connection
    ser = test_serial_connection()
    if not ser:
        print("\n[STOP] Serial connection failed!")
        print("Pastikan:")
        print("1. COM port di .env sudah benar")
        print("2. Virtual COM pair sudah dibuat")
        print("3. Simulation sudah mulai")
        return False
    
    # Test 4: Read Serial Data
    result = test_read_serial(ser)
    ser.close()
    
    print("\n" + "=" * 60)
    if result:
        print("[✓] Semua test berhasil!")
        print("IPCSIM siap menerima data dari Simulation")
    else:
        print("[!] Beberapa test gagal")
        print("Periksa logs untuk detail")
    print("=" * 60)
    
    return result


if __name__ == "__main__":
    main()
