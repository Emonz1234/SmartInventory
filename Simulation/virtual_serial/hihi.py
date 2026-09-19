from virtual_ipc import ComputerIPC

def main():
    HihiController = ComputerIPC(timeout=1)
    HihiController.run_computerIPC()

if __name__ == '__main__':
    main()
