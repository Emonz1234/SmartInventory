import asyncio

from app.serial import serial_manager

from app.serial.protocol.parser import ProtocolParser

from app.serial.handlers.telemetry_handler import TelemetryHandler
from app.serial.handlers.event_handler import EventHandler
from app.serial.handlers.ack_handler import AckHandler
import traceback


class SerialListener:

    def __init__(self):

        self.telemetry_handler = TelemetryHandler()

        self.event_handler = EventHandler()

        self.ack_handler = AckHandler()

    async def start(self):

        print("Serial Listener Started")

        while True:

            raw = serial_manager.read()

            if raw:

                print("RX:", raw)

                await self.process(raw)

            await asyncio.sleep(0.01)

    async def process(self, raw: str):
        try:
            message = ProtocolParser.parse(raw)
        except Exception as e:
            print(f"[PARSE ERROR] raw={raw} error={e}")
            traceback.print_exc()
            return

        # Log parsed message for debugging
        try:
            print(f"PARSED msg_type={message.msg_type} payload={message.payload}")
        except Exception:
            print("PARSED: unable to stringify message")

        try:
            if message.msg_type == "telemetry":
                await self.telemetry_handler.handle(message.payload)

            elif message.msg_type == "event":
                await self.event_handler.handle(message.payload)

            elif message.msg_type == "ack":
                await self.ack_handler.handle(message.payload)
            else:
                # unknown message types are ignored but logged
                print(f"Unhandled message type: {message.msg_type}")
        except Exception as e:
            print(f"[HANDLER ERROR] type={message.msg_type} error={e}")
            traceback.print_exc()