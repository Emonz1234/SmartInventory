import sys
from PyQt6.QtCore import Qt
from PyQt6.QtWidgets import QMainWindow, QMenu, QWidget
from PyQt6.QtGui import QAction
from group_menu import Ui_MainWindow

class MySideBar(QMainWindow, Ui_MainWindow):
    def __init__(self):
        super().__init__()
        self.setupUi(self)
        self.setWindowTitle('MainWindow')

        self.group_dropdown_2.setHidden(True)
        self.group1_2.clicked.connect(self.switch_to_group1_page)
        self.group2_2.clicked.connect(self.switch_to_group2_page)
        self.group3_2.clicked.connect(self.switch_to_group3_page)

    def switch_to_group1_page(self):
        self.stackedWidget.setCurrentIndex(0)

    def switch_to_group2_page(self):
        self.stackedWidget.setCurrentIndex(1)

    def switch_to_group3_page(self):
        self.stackedWidget.setCurrentIndex(2)
