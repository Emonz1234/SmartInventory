from contextlib import asynccontextmanager
from fastapi import FastAPI

from app.startup import initialize_database
from app.startup import start_serial

from app.serial import serial_manager
from app.api import telemetry
from app.api import cabinet
from app.api import inventory
from app.api import dashboard
from app.api import bins

@asynccontextmanager
async def lifespan(app: FastAPI):

    print("Initializing database...")
    initialize_database()

    print("Starting serial service...")
    await start_serial()

    print("IPCSIM Started")

    yield

    print("IPCSIM Stopped")


app = FastAPI(
    title="IPCSIM",
    lifespan=lifespan
)

app.include_router(telemetry.router)
app.include_router(cabinet.router)
app.include_router(inventory.router)
app.include_router(bins.router)
app.include_router(dashboard.router)


@app.get("/")
def root():
    return {
        "app": "IPCSIM",
        "status": "running"
    }
    
@app.get("/serial/status")
def serial_status():

    connected = (
        serial_manager.serial is not None
        and serial_manager.serial.is_open
    )

    return {
        "connected": connected,
        "port": (
            serial_manager.serial.port
            if connected else None
        )
    }


@app.get("/api/serial/status")
def api_serial_status():
    return serial_status()


@app.get("/api/system/health")
def system_health():
    connected = (
        serial_manager.serial is not None
        and serial_manager.serial.is_open
    )
    return {
        "serial_connected": connected,
        "simulation_online": connected,
        "database_healthy": True,
        "server_synced": True
    }
