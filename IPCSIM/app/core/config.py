from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "IPCSIM"

    DB_PATH: str = "data/ipc.db"

    SERIAL_PORT: str = "COM2"

    SERIAL_BAUDRATE: int = 9600

    class Config:
        env_file = ".env"


settings = Settings()