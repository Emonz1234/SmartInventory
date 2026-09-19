from serial_client.esp32_serial import ESP32SerialClient
import time
import os


def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')


def print_rack_states(client):
    print("\n===== RACK STATES =====")

    racks = client.rack_manager.racks

    if not racks:
        print("No data received yet...")
        return

    for rack_id, rack in racks.items():
        print(f"""
Rack {rack_id}:
Temperature: {rack.temperature}
Humidity   : {rack.humidity}
Gas        : {rack.gas}
Last update: {rack.last_update}
""")


if __name__ == "__main__":
    client = None
    try:
        client = ESP32SerialClient()
        client.connect()

        time.sleep(2)

        client.send_command(1, "open")

        try:
            while True:
                # clear_screen()
                print_rack_states(client)
                time.sleep(2)
        except KeyboardInterrupt:
            print("\n[INFO] Shutting down...")
    except Exception as e:
        print(f"[FATAL] Failed to initialize: {e}")
    finally:
        if client:
            client.disconnect()