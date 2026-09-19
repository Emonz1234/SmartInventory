import mysql.connector

db = mysql.connector.connect(
        host="localhost",
        user="root",
        passwd="",
        database="computeripc_noforeign"
        )

database_cursor = db.cursor()

#database_cursor.execute("CREATE TABLE environmentstatus (env_id int PRIMARY KEY AUTO_INCREMENT, rack_id int, temperature float(10,7), humidity float(10, 7), weight float(10, 7), smoke float(10, 7), created_at DATETIME DEFAULT CURRENT_TIMESTAMP)")
#database_cursor.execute("CREATE TABLE operationstatus (opr_id int PRIMARY KEY AUTO_INCREMENT, rack_id int, movement_speed float(10,7), displacement float(10, 7),  is_hard_locked boolean not null default 0, is_end_point boolean not null, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)")
#database_cursor.execute("CREATE TABLE breakdownstatus (brkdown_id int PRIMARY KEY AUTO_INCREMENT, rack_id int, is_obstructed boolean, is_skewed boolean,  is_overload_motor boolean, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)")

