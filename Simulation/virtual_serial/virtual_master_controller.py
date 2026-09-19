import time
import math
import serial
import threading
import random
from pynput import keyboard
from PyQt6 import QtCore, QtGui, QtWidgets

MAX_RACK_NUMBER=6
MAX_TEMPERATURE=22
MIN_TEMPERATURE=20
MAX_HUMIDITY=80
MIN_HUMIDITY=40

RACK_MOVEMENT_SPEED = 4.0
RACK_MAX_MOVEMENT_SPEED = 15
RACK_WEIGHT = 80.0
RACK_MAX_DISPLACEMENT = 64.0

ENV_DATA_SEND_INTERVAL = 5    # Gửi dữ liệu môi trường để cập nhật trạng thái group gần realtime
OPR_DATA_SEND_INTERVAL = 1    # Dữ liệu vận hành vẫn gửi mỗi 1 giây

MASTER_CONTROLLER_IDLE_STATE = 'master_controller_idle_state'
MASTER_CONTROLLER_ENV_STATE = 'master_controller_env_state'
MASTER_CONTROLLER_OPR_STATE = 'master_controller_operation_state'
MASTER_CONTROLLER_BRKDOWN_STATE = 'master_controller_breakDown_state'

# Quản lý giao tiếp với RACK SYS qua cổng COM
class MasterCom:
    # Khởi tạo đối tượng
    def __init__(self, rack_group_id=0, port='COM3', baudrate=9600, timeout=None):
        self.rack_group_id = rack_group_id
        # Cấu hình cho kết nối
        self.ser = None
        self.port = port
        self.baudrate = baudrate
        self.timeout = timeout

        # Đặt tên biến trạng thái ban đầu khi chưa thực thi câu lệnh
        self.is_run = False
        self.is_rack_operation = False
        self.is_error = False
        self.is_reading = False

        self.state = MASTER_CONTROLLER_IDLE_STATE
        self.rack_group_state = -1
        self.listen = keyboard.Listener
        self.current_keys = []
        self.error_racks = [[] for i in range(MAX_RACK_NUMBER)]
        self.ventilating_racks_status = [[0.0, 0.0] for i in range(MAX_RACK_NUMBER)]

        self.ventilating_racks = []
        self.opening_racks = []
        self.closing_racks = []
        self.env_messages = ['0|0|0|0|0|0']
        self.opr_messages = ['0|0|0|0|0|0|-1']
        self.brk_messages = ['0|0|0|0|0']

    # Kết nối Serial
    def start(self):
        # Khởi động Serial nếu chưa có
        if self.ser is None:
            self.ser = serial.Serial(timeout=self.timeout)
        # Đóng và Mở lại Serial nếu đã có
        if self.ser.is_open:
            self.ser.close()
        # Thiết lập các thuộc tính cho Serial
        self.ser.baudrate = self.baudrate
        self.ser.port = self.port   # khởi tạo và nhận dữ liệu tại cùng cổng COM
        # COM1 nhận dữ liệu
        self.ser.port = 'COM1'
        self.ser.open()

        self.is_run = True
        self.is_reading = True

    def run_masterControllerEnvState(self, sleep_time):
        while self.is_run:
            # Đặt trạng thái 
            self.state = MASTER_CONTROLLER_ENV_STATE
            print(f'State: {self.state}')
            # Gọi Hàm tạo dữ liệu
            self.create_environmentStatusData(rack_group_id = self.rack_group_id)
            # The is_run flag to break while loop (run_masterControllerEnvState thread)
            if not self.is_run:
                break
            time.sleep(ENV_DATA_SEND_INTERVAL)  # Gửi dữ liệu môi trường cứ 2 phút
            self.state = MASTER_CONTROLLER_IDLE_STATE

            # Thoát vòng lặp nếu is_run = False (Khi khởi động Serial đã đặt là True)
            if not self.is_run:
                break

    # Tạo dữ liệu trạng thái Môi trường cho các RACK_GROUP
    def create_environmentStatusData(self, rack_group_id = 0):
        # rack_group_id của def này là biến [index] của file main.py
        # Tạo danh sách trống
        self.env_messages = []
        print('\n[PORT]', self.port)
        # Tạo dữ liệu 
        for rack_id in range(rack_group_id * 6, rack_group_id * 6 + MAX_RACK_NUMBER):
            random_parameter = random.random()
            temperature = round(random_parameter * (MAX_TEMPERATURE - MIN_TEMPERATURE) + MIN_TEMPERATURE, 2)
            humidity = round(random_parameter * (MAX_HUMIDITY - MIN_HUMIDITY) + MIN_HUMIDITY, 2)
            # weight = random_parameter * 1.8 * math.pow(-1, math.floor(random_parameter * 10)) + RACK_WEIGHT
            weight = round(random_parameter * 1.8 * -1 + RACK_WEIGHT, 2)
            smoke = 0
            message = 'ENVSTT|'+str(rack_id+1) + '|' + str(temperature) + '|' + str(humidity) + '|' + str(weight) + '|' + str(smoke)
            print('Thông số ID '+str(rack_id+1) +  ': \n' + message )

            # Gửi dữ liệu lên simulator qua kết nối Serial
            self.env_messages.append(message)
            self.ser.write((message + '\n').encode('utf-8'))

    # Tính toán tốc độ di chuyển (random)
    def create_movement_speed_number(self, rack_id, random_parameter, settling_time = 1.5) -> float:
        porportional_parameter = RACK_MAX_MOVEMENT_SPEED / settling_time
        time_interval = 1
        if self.ventilating_racks_status[rack_id - self.rack_group_id * MAX_RACK_NUMBER][0] <= 3.2:
            movement_speed = round(random_parameter * math.pow(-0.4, round(random_parameter * 10)) + porportional_parameter * time_interval / 3, 2)
            return movement_speed
        elif self.ventilating_racks_status[rack_id - self.rack_group_id * MAX_RACK_NUMBER][0] < 15:
            movement_speed = round(random_parameter * math.pow(-0.4, round(random_parameter * 10)) + porportional_parameter * 0.4 + 0.6 * RACK_MAX_MOVEMENT_SPEED, 2)
            return movement_speed
        elif self.ventilating_racks_status[rack_id - self.rack_group_id * MAX_RACK_NUMBER][0] < 47:
            movement_speed = round(random_parameter * math.pow(-0.4, round(random_parameter * 10)) + RACK_MAX_MOVEMENT_SPEED, 2)
            return movement_speed
        elif self.ventilating_racks_status[rack_id - self.rack_group_id * MAX_RACK_NUMBER][0] < 59.4:
            movement_speed = round(random_parameter * math.pow(-0.4, round(random_parameter * 10)) + porportional_parameter * (-1) * 0.25 + RACK_MAX_MOVEMENT_SPEED, 2)
            return movement_speed
        movement_speed = round(random_parameter * math.pow(-0.4, round(random_parameter * 10)) + porportional_parameter * (-1) * time_interval + RACK_MAX_MOVEMENT_SPEED, 2)
        return movement_speed

    # Tạo dữ liệu Trạng thái Vận hành thông gió
    def create_operation_ventilateStatusData(self, rack_id):
        self.opr_messages = []
        operation_message = 'OPRSTT|' + str(rack_id+1)
        random_parameter = random.random()
        movement_speed = self.create_movement_speed_number(rack_id=rack_id, random_parameter=random_parameter)
        is_hard_locked = 0
        displacement = round(self.ventilating_racks_status[rack_id - self.rack_group_id * MAX_RACK_NUMBER][0] + movement_speed * 1, 2)
        is_endpoint = 0

        if self.rack_group_state == -1 and self.ventilating_racks_status[rack_id - self.rack_group_id * MAX_RACK_NUMBER][1] == 1:
            print("[DIRECTION]", self.ventilating_racks_status[rack_id - self.rack_group_id * MAX_RACK_NUMBER][1])
            self.ventilating_racks.remove(rack_id + 1)
            self.ventilating_racks_status[rack_id - self.rack_group_id * MAX_RACK_NUMBER][1] = 0
            displacement = 0
            movement_speed = 0

            if not self.ventilating_racks:
                # set the is_rack_operation flag to False
                self.is_rack_operation = False

        if displacement > 2 and displacement < 50 and self.rack_group_state == -1:
            self.rack_group_state = 3

        if self.ventilating_racks_status[rack_id - self.rack_group_id * MAX_RACK_NUMBER][1] == 1:
            displacement = round(self.ventilating_racks_status[rack_id - self.rack_group_id * MAX_RACK_NUMBER][0] - movement_speed * 1, 2)
        
        if displacement > RACK_MAX_DISPLACEMENT:
            displacement = RACK_MAX_DISPLACEMENT
            self.ventilating_racks_status[rack_id - self.rack_group_id * MAX_RACK_NUMBER][1] = 1
        if displacement <= 0:
            is_endpoint = 1
            displacement = 0.0
            self.rack_group_state = -1

        self.ventilating_racks_status[rack_id - self.rack_group_id * MAX_RACK_NUMBER][0] = displacement
        
        operation_message += '|' + str(movement_speed) + '|' + str(displacement) + '|' + str(is_hard_locked) + '|' + str(is_endpoint) + '|' + str(self.rack_group_state)
        self.opr_messages.append(operation_message)

        return operation_message

    # Tạo dữ liệu Trạng thái Vận hành Open
    def create_operation_open_rack_statusData(self, rack_id):
        # Tạo messages với thông số ngẫu nhiên
        self.opr_messages = []
        operation_message = 'OPRSTT|' + str(rack_id+1)
        random_parameter = random.random()
        print('[RANDOM PARAMS]', random_parameter)
        # Tính toán tốc độ di chuyển và dịch chuyển
        movement_speed = self.create_movement_speed_number(rack_id=rack_id, random_parameter=random_parameter)
        is_hard_locked = 0
        displacement = round(self.ventilating_racks_status[rack_id - self.rack_group_id * MAX_RACK_NUMBER][0] + movement_speed * 1, 2)
        is_endpoint = 0

        if displacement > 0 and displacement < 50 and self.rack_group_state == -1:
            self.rack_group_state = 1

        if self.rack_group_state == -1 and displacement > 50:
            self.opening_racks.remove(rack_id + 1)
            movement_speed = 0

            if not self.opening_racks:
                # set the is_rack_operation flag to False
                self.is_rack_operation = False
        
        # Cập nhật trạng thái và thông báo nếu giá đỡ đã tới Endpoint
        if displacement > RACK_MAX_DISPLACEMENT:
            displacement = RACK_MAX_DISPLACEMENT
            self.ventilating_racks_status[rack_id - self.rack_group_id * MAX_RACK_NUMBER][1] = 1
            is_endpoint = 1
            self.rack_group_state = -1

        self.ventilating_racks_status[rack_id - self.rack_group_id * MAX_RACK_NUMBER][0] = displacement

        operation_message += '|' + str(movement_speed) + '|' + str(displacement) + '|' + str(is_hard_locked) + '|' + str(is_endpoint) + '|' + str(self.rack_group_state)
        self.opr_messages.append(operation_message)

        return operation_message

    # Tạo dữ liệu Trạng thái Vận hành Close
    def create_operation_close_rack_statusData(self, rack_id):
        self.opr_messages = []
        operation_message = 'OPRSTT|' + str(rack_id+1)
        random_parameter = random.random()
        movement_speed = self.create_movement_speed_number(rack_id=rack_id, random_parameter=random_parameter)
        is_hard_locked = 0
        is_endpoint = 0
        displacement = round(self.ventilating_racks_status[rack_id - self.rack_group_id * MAX_RACK_NUMBER][0] - movement_speed * 1, 2)

        if displacement > 0 and displacement < 62 and self.rack_group_state == -1:
            self.rack_group_state = 2

        if self.rack_group_state == -1 and displacement < 1:
            self.closing_racks.remove(rack_id + 1)
            movement_speed = 0

            if not self.closing_racks:
                self.is_rack_operation = False
        
        if displacement <= 0:
            self.ventilating_racks_status[rack_id - self.rack_group_id * MAX_RACK_NUMBER][1] = 0
            is_endpoint = 1
            displacement = 0.0
            self.rack_group_state = -1

        self.ventilating_racks_status[rack_id - self.rack_group_id * MAX_RACK_NUMBER][0] = displacement
        
        operation_message += '|' + str(movement_speed) + '|' + str(displacement) + '|' + str(is_hard_locked) + '|' + str(is_endpoint) + '|' + str(self.rack_group_state)
        self.opr_messages.append(operation_message)

        return operation_message

    # Tạo dữ liệu Error
    def create_breakdownStatusData(self, error_numbers, rack_id):
        # Tạo Error Messages với mỗi mã lỗi tương ứng
        error_message = 'BRKSTT|' + str(rack_id+1)
        self.brk_messages = []
        for number in range(1,4):
            if number in error_numbers:
                error_message += '|1'
            else:
                error_message += '|0'
        self.brk_messages.append(error_message)
        return error_message

    # Đọc dữ liệu từ kết nối Serial (từ IPC)
    def read_line_from_computerIPC(self):
        # Đọc và giải mã dữ liệu từ kết nối Serial
        while self.is_reading:
            print("Bắt đầu đọc data từ Serial ")
            # Xác định và xử lý thông tin hoạt động dựa trên Messages nhận được
            line = self.ser.readline().decode('utf-8').replace('\n', '')
            print("\nMessage from IPC:... ",line)
            if line:
                print('[SERIAL IPC]', line)

                if len(line) > 4 :
                    # print(line[-1])
                    # Khởi động luồng điều khiển nếu có lỗi
                    if line[-1] != "0":
                        # print(line[-1])
                        # print("Lỗi rùiii")
                        self.determine_operationInformation(line)
                        self.is_rack_operation = True
                        opr_thread = threading.Thread(target=self.run_masterControllerOperationState, args=(1,))
                        opr_thread.start()

            if not self.is_reading:
                print("Ngừng đọc data từ Serial")
                break

    # def update_status_image(self, operation_type, rack_id=None):
    #     if rack_id is not None:
    #         image_path = f'Image/RackGroup/{operation_type}_rack_{rack_id}.png'
    #     else:
    #         image_path = 'Image/Default.png'

    #     pixmap = QtGui.QPixmap(image_path)
    #     self.rackGroupImage.setPixmap(pixmap)

    # Chạy Trạng thái Vận hành
    def run_masterControllerOperationState(self, sleep_time):
        while self.is_rack_operation:
            # Thiết lập trạng thái (Thông gió, Mở, Đóng)
            # Gửi dữ liệu qua kết nối Serial
            self.state = MASTER_CONTROLLER_OPR_STATE
            print(f'State: {self.state}')

            for idx in self.ventilating_racks:
                message = ''
                message += self.create_operation_ventilateStatusData(idx-1)
                print(message)
                print('[VENTILATING RACKS]', self.ventilating_racks)
                self.ser.write((message + '\n').encode('utf-8'))
                # self.update_status_image('ventilating')

            for idx in self.opening_racks:
                message = ''
                message += self.create_operation_open_rack_statusData(idx-1)
                print(message)
                print('[OPENING RACKS]', self.opening_racks)
                self.ser.write((message + '\n').encode('utf-8'))
                # self.update_status_image('opening', idx)  # Thêm rack_id vào đây

            for idx in self.closing_racks:
                message = ''
                message += self.create_operation_close_rack_statusData(idx-1)
                print(message)
                print('[CLOSING RACKS]', self.closing_racks)
                self.ser.write((message + '\n').encode('utf-8'))
                # self.update_status_image('closing', idx)
            # The is_rack_operation flag to break run_masterControllerOperationState thread
            if not self.is_rack_operation:
                break
            time.sleep(OPR_DATA_SEND_INTERVAL)  # Dữ liệu vận hành gửi mỗi 1 giây
            self.state = MASTER_CONTROLLER_IDLE_STATE

            # Thoát khỏi vòng lặp nếu RACK không hoạt động
            if not self.is_rack_operation:
                break
        
    # Chạy trạng thái Error
    def run_masterControllerBreakdownState(self, sleep_time, rack_id = 1, error_numbers = [1]):
        while self.is_error:
            self.state = MASTER_CONTROLLER_BRKDOWN_STATE
            print(f'State: {self.state}')
            for error_number in error_numbers:
                self.error_racks[rack_id-1-self.rack_group_id * MAX_RACK_NUMBER].append(error_number)
            for idx, elements in enumerate(self.error_racks):
                message = ''
                if elements:
                    message += self.create_breakdownStatusData(elements, idx+self.rack_group_id * MAX_RACK_NUMBER)
                    print(message)
                    self.ser.write((message + '\n').encode('utf-8'))
            # The is_error flag to break run_masterControllerBreakdownState thread
            if not self.is_error:
                self.error_racks[rack_id-1-self.rack_group_id * MAX_RACK_NUMBER].clear()
                break
            time.sleep(sleep_time)
            self.state = MASTER_CONTROLLER_IDLE_STATE

            # Thoát vòng lặp nếu không còn lỗi
            if not self.is_error:
                self.error_racks[rack_id-1-self.rack_group_id * MAX_RACK_NUMBER].clear()
                break

    # Xác định thông tin Error
    def determine_errorInformation(self):
        # Kiểm tra mã hợp lệ
        if len(self.current_keys) == 3 and self.current_keys[0] == 69:
            # Thêm mã Error vào danh sách lỗi của RACK tương ứng
            self.error_racks[self.current_keys[1] - 49].append(self.current_keys[2] - 48)
            print(self.error_racks)
            self.current_keys = []

    # Kiểm tra xem có đúng mẫu tin nhắn điều khiển không và lấy số rack cần điều khiển trong rack group

    def determine_operationInformation(self, message):
        opr_message_list = []

        if len(message) > 4 and message[0] == "0" and message[-1]=="1":
            print( message)
            opr_message_list = message.split('|')
            self.opening_racks.append(int(opr_message_list[1]))
            # print('[OPENING RACKS]', self.opening_racks)
        if len(message) > 4 and message[0] == "0" and message[-1]=="2":
            print(message)
            opr_message_list = message.split('|')
            self.closing_racks.append(int(opr_message_list[1]))
            # print('[CLOSING RACKS]', self.closing_racks)
        if len(message) > 4 and message[0] == "0" and message[-1] == "3":
            print(message)
            opr_message_list = message.split('|')
            self.ventilating_racks.append(int(opr_message_list[1]))
            # print('[VENTILATING RACKS]', self.ventilating_racks)

    # Dừng toàn bộ hoạt động và đóng kết nối Serial
    def execute_stopRunning(self):
        print('Stop running')
        self.is_run = False
        self.is_error = False
        self.is_reading = False
        self.ser.close()

