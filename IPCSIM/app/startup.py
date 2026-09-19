from app.database.database import Base
from app.database.database import engine

# import models
from app.database.models.auth import User
from app.database.models.system import Device
from app.database.models.environment import EnvironmentSnapshot
from app.database.models.runtime import OperationSnapshot, BreakdownSnapshot

import asyncio

from app.serial import serial_manager
from app.serial.listener import SerialListener


def initialize_database():
    from app.database.database import ensure_schema

    ensure_schema()


listener = SerialListener()


async def start_serial():

    serial_manager.connect()

    asyncio.create_task(
        listener.start()
    )