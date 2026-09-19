import socket

HEADER = 64
PORT = 5052
FORMAT = 'utf-8'
DISCONNECT_MESSAGE = "DISCONNECT"
SERVER = "192.168.1.7"

ADDRESS = (SERVER, PORT)
message = '0|1|1'

class Client():
    def __init__(self):
        self.client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        print(ADDRESS)
        self.client.connect(ADDRESS)

    def send_message(self, message):
        message = message.encode(FORMAT)
        message_length = len(message)
        send_length = str(message_length).encode(FORMAT)
        send_length += b' ' * (HEADER - len(send_length))
        self.client.send(send_length)
        self.client.send(message)

if __name__ == '__main__':
    ClientIPC = Client()
    ClientIPC.send_message(message)
