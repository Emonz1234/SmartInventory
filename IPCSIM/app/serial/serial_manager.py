import serial

from ..core.config import settings


class SerialManager:

    def __init__(self):

        self.serial = None

    def connect(self):

        print(
            f"Connecting serial: "
            f"{settings.SERIAL_PORT} "
            f"@ {settings.SERIAL_BAUDRATE}"
        )

        self.serial = serial.Serial(
            port=settings.SERIAL_PORT,
            baudrate=settings.SERIAL_BAUDRATE,
            timeout=1
        )

        print("Serial Connected")

    def disconnect(self):

        if self.serial:
            self.serial.close()

    def send(self, message: str):

        if not self.serial or not self.serial.is_open:
            print("[ERROR] Serial connection not open")
            return

        self.serial.write(
            (message + "\n").encode("utf-8")
        )
        self.serial.flush()

    def read(self):

        if not self.serial:
            return None

        line = self.serial.readline()

        if not line:
            return None

        return line.decode().strip()