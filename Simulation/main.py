from PyQt6 import QtCore, QtGui
from PyQt6.QtWidgets import QApplication, QMainWindow
from PyQt6.QtCore import pyqtSignal
import time
from simulation_scroll import Ui_MainWindow
from virtual_serial.virtual_master_controller import *
from functools import partial
from pathlib import Path
import sys

# =======================================================
# LỚP CHÍNH
# =======================================================
class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.uic = Ui_MainWindow(1, 10, 0)
        self.uic.setupUi(self)
        self.rack_group = {}
        self.environment_data = {}
        self.operation_data = {}

        # Kết nối các nút bấm với hàm xử lý
        for i in range(21):  # Duyệt qua 21 GROUP
            self.environment_data[i] = {}
            self.operation_data[i] = {}
            self.uic.rackGroupList[i].runButton.clicked.connect(partial(self.start_master_controller, i))
            self.uic.rackGroupList[i].stopButton.clicked.connect(partial(self.stop_master_controller, i))
            self.uic.rackGroupList[i].simulatorErrorButton.clicked.connect(partial(self.start_simulate_error, i))
            for rack_button in self.uic.rackGroupList[i].rackButtons:
                rack_button.clicked.connect(partial(self.select_rack, i, rack_button))

    # Khởi động một luồng điều khiển mới cho mỗi GROUP
    # [index] tương ứng [rack_group_id] trong file 'virtual_master_controller.py'
    def start_master_controller(self, index):
        self.rack_group[index] = ThreadClass(index=index)  # Tạo đối tượng ThreadClass
        self.rack_group[index].start()  # Bắt đầu luồng xử lý
        self.uic.rackGroupList[index].rackGroupStateLineEdit.setText("Ready!!!")  # Cập nhật trạng thái
        
        # Kết nối tín hiệu từ luồng với UI
        self.rack_group[index].env_signal.connect(self.display_environment_status)
        self.rack_group[index].opr_signal.connect(self.display_operation_status)
        
        # Cập nhật trạng thái các nút bấm
        self.uic.rackGroupList[index].runButton.setEnabled(False)
        self.uic.rackGroupList[index].stopButton.setEnabled(True)

    def select_rack(self, group_index, selected_button):
        rack_group = self.uic.rackGroupList[group_index]
        rack_group.selected_rack_id = int(selected_button.text())
        for rack_button in rack_group.rackButtons:
            rack_button.setChecked(rack_button is selected_button)
        self.display_selected_rack(group_index, reset_operation_graph=True)

    # Dừng hoạt động
    def stop_master_controller(self, index):
        self.rack_group[index].stop()
        self.uic.rackGroupList[index].stopButton.setEnabled(False)
        self.uic.rackGroupList[index].runButton.setEnabled(True)

    # Mô phỏng lỗi cho nhóm giá đỡ
    def start_simulate_error(self, index):
        err_numbers = []
        # Kiểm tra các lỗi được chọn trong UI
        if self.uic.rackGroupList[index].ObstructCheckBox.isChecked():
            err_numbers.append(1)
        if self.uic.rackGroupList[index].SkewCheckBox.isChecked():
            err_numbers.append(2)
        if self.uic.rackGroupList[index].OverloadMotorCheckBox.isChecked():
            err_numbers.append(3)
        # Gửi tín hiệu nếu có lỗi được chọn
        if err_numbers:
            self.rack_group[index].err_numbers = err_numbers
            self.rack_group[index].rack_id = self.uic.rackGroupList[index].selected_rack_id
            self.rack_group[index].run_error()
            self.rack_group[index].brk_signal.connect(self.display_breakdown_status)
        else:
            self.uic.rackGroupList[index].rackGroupErrorLineEdit.setText("")
            self.rack_group[index].brk_signal.disconnect(self.display_breakdown_status)
            self.rack_group[index].stop_error()

    # Hàm hiển thị trạng thái
    def handle_environment_status(self, message):
        env_list = message.split('|')
        rack_id = int(env_list[1])
        temperature, humidity, weight, smoke = float(env_list[2]), float(env_list[3]), float(env_list[4]), int(env_list[5])
        return rack_id, temperature, humidity, weight, smoke

    def handle_operation_status(self, message):
        opr_list = message.split('|')
        rack_id, movement_speed, displacement, is_hard_locked, is_endpoint, rack_group_state = int(opr_list[1]), float(opr_list[2]), float(opr_list[3]), int(opr_list[4]), int(opr_list[5]), int(opr_list[6])
        return rack_id, movement_speed, displacement, is_hard_locked, is_endpoint, rack_group_state

    def update_rack_group_image(self, group_index, rack_id, displacement, rack_group_state):
        rack_group = self.uic.rackGroupList[group_index]
        if rack_id != rack_group.selected_rack_id:
            return

        image_directory = Path(__file__).resolve().parent / "Image" / "RackGroup"
        if displacement <= 0 and rack_group_state == -1:
            image_path = image_directory / "Default.png"
        else:
            local_rack_id = ((rack_id - 1) % MAX_RACK_NUMBER) + 1
            opened_images = {
                1: "Group1_2_opened.png",
                2: "Group1_2_opened.png",
                3: "Group3_opened.png",
                4: "Group4_opened.png",
                5: "Group5_opened.png",
                6: "Group6_opened.png"
            }
            image_path = image_directory / opened_images[local_rack_id]

        rack_group.rackGroupImage.setPixmap(QtGui.QPixmap(str(image_path)))

    def handle_breakdown_status(self, message):
        brk_list = message.split('|')
        rack_id, is_obstructed, is_skewed, is_overload_motor = int(brk_list[1]), int(brk_list[2]), int(brk_list[3]), int(brk_list[4])
        return rack_id, is_obstructed, is_skewed, is_overload_motor

    # Hiển thị trạng thái vận hành mỗi GROUP
    def display_rack_group_state(self, rack_id, rack_group_id, rack_group_state):
        if rack_group_state == 0:
            self.uic.rackGroupList[rack_group_id].rackGroupStateLineEdit.setText(f'Rack {rack_id}: Guiding Light...')
        elif rack_group_state == 1:
            self.uic.rackGroupList[rack_group_id].rackGroupStateLineEdit.setText(f'Rack {rack_id}: Opening...')
        elif rack_group_state == 2:
            self.uic.rackGroupList[rack_group_id].rackGroupStateLineEdit.setText(f'Rack {rack_id}: Closing...')
        elif rack_group_state == 3:
            self.uic.rackGroupList[rack_group_id].rackGroupStateLineEdit.setText(f'Rack {rack_id}: Ventilating...')
        elif rack_group_state == -1:
            self.uic.rackGroupList[rack_group_id].rackGroupStateLineEdit.setText('Ready!!!')

    def display_environment_status(self, message: str):
        index = self.sender().index 
        print("\n[SIMULATION] GROUP", index+1)
        print("Display ENV")
        if index != -1:
            rack_id, temperature, humidity, weight, smoke = self.handle_environment_status(message)
            self.environment_data[index][rack_id] = (temperature, humidity, weight, smoke)
            self.display_selected_rack(index)

    def display_selected_rack(self, group_index, selected_rack_text=None, reset_operation_graph=False):
        rack_group = self.uic.rackGroupList[group_index]
        selected_rack_id = rack_group.selected_rack_id if selected_rack_text is None else int(selected_rack_text)
        if not selected_rack_id:
            return

        rack_id = selected_rack_id
        environment_values = self.environment_data[group_index].get(rack_id)
        if environment_values:
            temperature, humidity, weight, smoke = environment_values
            rack_group.temperature.display('{:.02f}'.format(temperature))
            rack_group.humidity.display('{:.02f}'.format(humidity))
            rack_group.weight.display('{:.02f}'.format(weight))
            rack_group.smoke.display(smoke)

        operation_values = self.operation_data[group_index].get(rack_id)
        if operation_values:
            movement_speed, displacement, is_hard_locked, is_endpoint, rack_group_state = operation_values
            rack_group.movementSpeed.display('{:.02f}'.format(movement_speed))
            rack_group.displacement.display('{:.02f}'.format(displacement))
            if reset_operation_graph:
                rack_group.speedGraph.clear_data()
                rack_group.speedGraph.set_speed(movement_speed)
            rack_group.isHardLock.display(is_hard_locked)
            self.update_rack_group_image(group_index, rack_id, displacement, rack_group_state)

    def display_operation_status(self, message: str):
        index = self.sender().index
        print("Display OPR")
        if index != -1:
            rack_id, movement_speed, displacement, is_hard_locked, is_endpoint, rack_group_state = self.handle_operation_status(message)
            self.operation_data[index][rack_id] = (movement_speed, displacement, is_hard_locked, is_endpoint, rack_group_state)
            selected_rack_id = self.uic.rackGroupList[index].selected_rack_id
            if rack_id == selected_rack_id:
                self.uic.rackGroupList[index].movementSpeed.display('{:.02f}'.format(movement_speed))
                self.uic.rackGroupList[index].displacement.display('{:.02f}'.format(displacement))
                self.uic.rackGroupList[index].speedGraph.set_speed(movement_speed)
                self.uic.rackGroupList[index].isHardLock.display(is_hard_locked)
                self.update_rack_group_image(index, rack_id, displacement, rack_group_state)
            # self.uic.rackGroupList[index].isEndpoint.display(is_endpoint)
            self.display_rack_group_state(rack_id, index, rack_group_state)

    def display_breakdown_status(self, message: str):
        index = self.sender().index
        print("Display ERROR")
        if index != -1:
            rack_id, is_obstructed, is_skewed, is_overload_motor = self.handle_breakdown_status(message)
            message = "Rack " + str(rack_id) + ": "
            if is_obstructed == 1:
                message += "Obstructed | "
            if is_skewed == 1:
                message += "Skewed | "
            if is_overload_motor == 1:
                message += "Overload Motor"
            self.uic.rackGroupList[index].rackGroupErrorLineEdit.setText(message)

# =======================================================
# LỚP THREAD (LUỒNG) XỬ LÝ CHO MỖI GROUP
# =======================================================

class ThreadClass(QtCore.QThread):
    # Tạo tín hiệu
    env_signal = pyqtSignal(str)
    opr_signal = pyqtSignal(str)
    brk_signal = pyqtSignal(str)

    def __init__(self, index=-1, rack_id=1, opr_number = -1, err_numbers = [1]):
        super().__init__()
        self.index = index
        self.master_controller = MasterCom(rack_group_id=self.index, port='COM' + str(3 + self.index * 2))
        self.rack_id = rack_id
        self.opr_number = opr_number
        self.err_numbers = err_numbers

    def run(self):
        print('Starting master controller...', self.index)
        print('Starting simulate normal...', self.index)
        self.master_controller.start()

        # Tạo các luồng con để xử lý trạng thái môi trường và dữ liệu từ IPC
        env_thread = threading.Thread(target=self.master_controller.run_masterControllerEnvState, daemon=True,args=(5,)) # Khoảng delay
        env_thread.start()
        read_computerIPC_thread = threading.Thread(target=self.master_controller.read_line_from_computerIPC, daemon=True)
        read_computerIPC_thread.start()

        # Gửi tín hiệu tới UI
        while True:
            time.sleep(1)
            if self.master_controller.env_messages:
                for environment_message in list(self.master_controller.env_messages):
                    self.env_signal.emit(environment_message)
            if self.master_controller.opr_messages:
                self.opr_signal.emit(self.master_controller.opr_messages[0])
            if self.master_controller.brk_messages:
                self.brk_signal.emit(self.master_controller.brk_messages[0])

    def stop(self):
        print('Stopping master controller...', self.index+1)
        self.master_controller.execute_stopRunning()
        self.terminate()

    # Operation 
    def run_normal(self):
        self.master_controller.is_run = True
        
        if self.master_controller.ventilating_racks or self.master_controller.closing_racks or self.master_controller.opening_racks:
            self.master_controller.is_rack_operation = True
            opr_thread = threading.Thread(target=self.master_controller.run_masterControllerOperationState, args=(1,))
            opr_thread.start()
            print("Operation hihi")

        env_thread = threading.Thread(target=self.master_controller.run_masterControllerEnvState, daemon=True, args=(5,))
        env_thread.start()
    
    def stop_normal(self):
        self.master_controller.is_run = False
        self.master_controller.is_rack_operation = False

    # Mô phỏng Error
    def run_error(self):
        print('Starting simulate error...', self.index+1)
        self.stop_normal() # Ngưng vận hành khi có lỗi
        self.master_controller.is_error = True
        brkdown_thread = threading.Thread(target=self.master_controller.run_masterControllerBreakdownState, daemon=True, args=(6, self.rack_id, self.err_numbers))
        brkdown_thread.start()

    def stop_error(self):
        self.master_controller.is_error = False
        self.run_normal()

# =======================================================
# CHẠY CHƯƠNG TRÌNH
# =======================================================
if __name__ == '__main__':
    app = QApplication(sys.argv)
    main_win = MainWindow()
    main_win.show()
    sys.exit(app.exec())

