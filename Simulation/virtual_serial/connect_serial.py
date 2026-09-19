import serial

class SerialCom:
    def __init__(self, port, baudrate=9600, timeout=None):
        self.ser = None
        self.port = port
        self.baudrate = baudrate
        self.timeout = timeout

    def __init_serial(self):
        if self.ser is None:
            self.ser = serial.Serial(port=self.port, baudrate=self.baudrate, timeout=self.timeout)
        if self.ser.is_open:
            self.ser.close()

def write_serial(port, content):
    ser = serial.Serial(port)
    ser.write(content.encode('utf-8'))
    ser.close

def read_serial(port):
    with serial.Serial(port, timeout=10) as ser:
        line = ser.readline()
        return line

if __name__ == '__main__':
    