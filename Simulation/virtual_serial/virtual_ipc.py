from pickle import ADDITEMS
import serial
import threading
import socket
from pynput import keyboard
import datetime
from simulator_database import database_cursor, db

HEADER = 64
PORT = 5052
SERVER = socket.gethostbyname(socket.gethostname())
ADDRESS = (SERVER, PORT)
FORMAT_STRING = 'utf-8'
DISCONNECT_MESSAGE = "DISCONNECT"

class ComputerIPC:
    def __init__(self, port='COM2', baudrate=9600, timeout=None, port_socket=5052):
        self.ser = None
        self.server = None
        self.port = port
        self.port_socket = port_socket
        self.address_socket = (SERVER, self.port_socket)
        self.baudrate = baudrate
        self.timeout = timeout
        self.is_running_server = False
        self.is_run = False
        self.current_keys=[]
        self.listen = keyboard.Listener

    def __init_server(self):
        if self.server is None:
            print("hihi server")
            self.server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.server.bind(self.address_socket)
            self.server.listen()
            print(ADDRESS)

    def __init_serial(self):
        if self.ser is None:
            print("hihi server")
            self.ser = serial.Serial(timeout=self.timeout)
        if self.ser.is_open:
            self.ser.close()
        self.ser.baudrate = self.baudrate
        self.ser.port = self.port
        self.ser.open()

    # Nhận lệnh từ Backend (định dạng message) -> Gửi dữ liệu sang virtual_master_controller qua Serial -> Hiển thị thông số lên phần mềm mô phỏng
    #                                                                                                   -> Gửi các thông số ngược về Virtual_ipc để đẩy lên CSDL
    def handle_client_message(self, conn, address):
        print(f"[CLIENT] {address} connected")

        msg_length = conn.recv(HEADER).decode(FORMAT_STRING)
        print(msg_length)
        if msg_length:
            msg_length = int(msg_length)
            message = conn.recv(msg_length).decode(FORMAT_STRING)
            self.ser.write((message + '\n').encode(FORMAT_STRING))
            if message == DISCONNECT_MESSAGE:
                print(DISCONNECT_MESSAGE)
            print(f"[{address}] {message}")

        conn.close()
    
    # Vòng lặp liên tục nhận các kết nối từ Server. Xử lý kết nối bằng handle_client_message
    def server_listening(self):
        while self.is_running_server:
            conn, address = self.server.accept()
            self.handle_client_message(conn, address)
            if not self.is_running_server:
                break
        self.listen.stop()

    def start(self):
        self.__init_serial()
        self.__init_server()
        self.is_running_server = True
        self.is_run = True
        threading.Thread(target=self.server_listening, daemon=True).start()


    # Insert dữ liệu vào Database
    def insert_environment_status_table(self, rack_id: int, temperature: float, humidity: float, weight: float, smoke: float,
                                        active=True):
        created_at = datetime.datetime.now()
        database_cursor.execute("INSERT INTO api_environmentstatus (rack_id, temperature, humidity, weight, smoke,created_at,active) VALUES (%s, %s, %s, %s, %s,%s,%s)", (rack_id, temperature, humidity, weight, smoke,created_at,active))
        db.commit()
        print('[DATABASE] Insert into environmentstatus successfully')

    def insert_operation_status_table(self, rack_id: int, movement_speed: float, displacement: float,
                                      is_hard_locked: bool, is_endpoint: bool,active = True):
        created_at = datetime.datetime.now()
        number_users = 0
        database_cursor.execute(
            "INSERT INTO api_operationstatus (rack_id, movement_speed, displacement, is_hard_locked, is_endpoint, created_at, number_users, active) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
            (rack_id, movement_speed, displacement, is_hard_locked, is_endpoint, created_at, number_users, active))
        db.commit()
        print('[DATABASE] Insert into operationstatus successfully')

    def insert_breakdown_status_table(self, rack_id: int, is_obstructed, is_skewed, is_overload_motor,active = True):
        current_time = datetime.datetime.now()
        database_cursor.execute(
            "INSERT INTO api_breakdownstatus (rack_id, is_obstructed, is_skewed, is_overload_motor, created_at, updated_at, active) VALUES (%s, %s, %s, %s, %s, %s, %s)",
            (rack_id, is_obstructed, is_skewed, is_overload_motor, current_time, current_time, active))
        db.commit()
        print('[DATABASE] Insert into breakdownstatus successfully')

    # Xử lý thông tin gửi từ Serial (ENVSTT,OPRSTT,BRKSTT)
    def handle_message_from_serial(self, message):
        env_list = []
        opr_list = []
        brkdown_list = []

        if 'ENVSTT' in message:
            print(message)
            env_list = message.split('|')[1:]
            rack_id, temperature, humidity, weight, smoke = int(env_list[0]), round(float(env_list[1]), 3), round(float(env_list[2]),3), round(float(env_list[3]), 3), round(float(env_list[4]), 3)

            self.insert_environment_status_table(rack_id=rack_id, temperature=temperature, humidity=humidity, weight=weight, smoke=smoke)
            return

        elif 'OPRSTT' in message:
            print(message)
            opr_list = message.split('|')[1:]
            rack_id, movement_speed, displacement, is_hard_locked, is_endpoint = int(opr_list[0]), round(float(opr_list[1]), 3), round(float(opr_list[2]),3), int(opr_list[3]), int(opr_list[4])

            self.insert_operation_status_table(rack_id=rack_id, movement_speed=movement_speed, displacement=displacement, is_hard_locked=is_hard_locked, is_endpoint=is_endpoint)
            return

        elif 'BRKSTT' in message:
            print(message)
            brkdown_list = message.split('|')[1:]
            rack_id, is_obstructed, is_skewed, is_overload_motor = int(brkdown_list[0]), int(brkdown_list[1]), int(brkdown_list[2]), int(brkdown_list[3])

            self.insert_breakdown_status_table(rack_id=rack_id, is_obstructed=is_obstructed, is_skewed=is_skewed, is_overload_motor=is_overload_motor)
            return
 
    # Vòng lặp liên tục đọc dữ liệu gửi từ Serial (COM). Xử lý bằng handle_message_from_serial
    # Đọc từ file master_controller (Env,Opr,Error)
    def read_serial(self):
        while self.is_run:
            line = self.ser.readline().decode('utf-8').replace('\n','')
            if line:
                print('[SERIAL]   Receive serial message successfully')
                self.handle_message_from_serial(line)

            if not self.is_run:
                break
        self.listen.stop()

    def execute_stopRunning(self):
        print('Stop running')
        self.is_run = False
        self.is_running_server = False

    # Phần xử lý dưới đây tương đương với phần nhận lệnh từ Server
    # Thay vì nhận lệnh từ Server thì sẽ nhận lệnh trực tiếp bằng cách nhập từ bàn phím (nhằm minh họa trước khi build Server)
    def send_operationMessage(self):
        if self.current_keys[0] == 79 and len(self.current_keys) > 1:
            if self.current_keys[1] < 58 and len(self.current_keys) == 3:
                message = '0|' + str(self.current_keys[1] - 48) + '|' + str(self.current_keys[2] - 48)
                self.ser.write((message + '\n').encode(FORMAT_STRING))
                print('[SENT MESSAGE]', message)
                self.current_keys = []

    # Gán mã Vietkey(vk) cho phím nhập liệu
    def determine_shortcuts(self, vk):
        if vk == 27:
            self.execute_stopRunning()
            return

        elif self.current_keys[0] == 79:
            self.send_operationMessage()
        else:
            self.current_keys = []

    def on_press(self, key):
        vk = key.vk if hasattr(key, 'vk') else key.value.vk
        print('vk: ', vk)
        self.current_keys.append(vk)
        print('keys: ', self.current_keys)
        if vk == None:
            return
        self.determine_shortcuts(vk)

    def run_computerIPC(self):
        self.start()
        print('Start computer successfully!!')

        if self.server:
            self.server.listen()
            print("[LISTENING] Server is listening")

        # Server listening thread (server)
        server_listening_thread = threading.Thread(target=self.server_listening, args=(), daemon=True)
        server_listening_thread.start()
        print("Đã đọc từ Sever")
        # Read serial thread (master_controller)
        read_serial_thread = threading.Thread(target=self.read_serial, args=(), daemon=True)
        read_serial_thread.start()
        print("Đã đọc từ master_controller")

        # With keyboard.Listener(on_press=self.on_press) as listener:
        self.listen = keyboard.Listener(on_press=self.on_press)
        self.listen.start()
        self.listen.join()

if __name__ == '__main__':
    HihiController = ComputerIPC(timeout=1)
    HihiController.run_computerIPC()
