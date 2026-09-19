from PyQt6.QtWidgets import QApplication
import sys
from frontpage import MySideBar

app = QApplication(sys.argv)

window = MySideBar()

window.show()
app.exec()