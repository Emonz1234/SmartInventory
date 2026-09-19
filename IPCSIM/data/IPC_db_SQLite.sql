PRAGMA foreign_keys = ON;

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username varchar(50) UNIQUE NOT NULL,
  password_hash varchar(255) NOT NULL,
  full_name varchar(100),
  employee_code varchar(50),
  is_active INTEGER DEFAULT 1,
  created_at datetime,
  updated_at datetime
);

CREATE TABLE roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code varchar(50) UNIQUE,
  name varchar(100),
  description text
);

CREATE TABLE permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code varchar(100) UNIQUE,
  name varchar(150),
  description text
);

CREATE TABLE user_roles (
  user_id integer,
  role_id integer,
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE role_permissions (
  role_id integer,
  permission_id integer,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id),
  FOREIGN KEY (permission_id) REFERENCES permissions(id)
);

CREATE TABLE access_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id integer,
  action varchar(100),
  description text,
  created_at datetime,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE cabinets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cabinet_code varchar(50) UNIQUE,
  cabinet_name varchar(100),
  status varchar(30),
  created_at datetime
);

CREATE TABLE racks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cabinet_id integer,
  rack_code varchar(50),
  rack_name varchar(100),
  total_shelves integer,
  created_at datetime,
  FOREIGN KEY (cabinet_id) REFERENCES cabinets(id)
);

CREATE TABLE shelves (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rack_id integer,
  shelf_code varchar(50),
  shelf_name varchar(100),
  level_no integer,
  created_at datetime,
  FOREIGN KEY (rack_id) REFERENCES racks(id)
);

CREATE TABLE bins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shelf_id integer,
  bin_code varchar(50),
  bin_name varchar(100),
  capacity integer,
  created_at datetime,
  FOREIGN KEY (shelf_id) REFERENCES shelves(id)
);

CREATE TABLE items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_code varchar(100) UNIQUE,
  item_name varchar(255),
  unit varchar(50),
  min_qty integer,
  max_qty integer,
  created_at datetime
);

CREATE TABLE item_locations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id integer,
  bin_id integer,
  quantity integer,
  updated_at datetime,
  FOREIGN KEY (item_id) REFERENCES items(id),
  FOREIGN KEY (bin_id) REFERENCES bins(id)
);

CREATE TABLE inventory_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id integer,
  transaction_type varchar(30),
  quantity integer,
  reference_no varchar(100),
  user_id integer,
  created_at datetime,
  FOREIGN KEY (item_id) REFERENCES items(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE devices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_code varchar(50) UNIQUE,
  device_name varchar(100),
  firmware_version varchar(50),
  serial_port varchar(50),
  status varchar(30),
  last_seen datetime,
  created_at datetime
);

CREATE TABLE device_heartbeats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id integer,
  status varchar(30),
  heartbeat_at datetime,
  FOREIGN KEY (device_id) REFERENCES devices(id)
);

CREATE TABLE environment_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cabinet_id integer,
  temperature decimal(5,2),
  humidity decimal(5,2),
  weight decimal(10,2),
  smoke_detected INTEGER,
  created_at datetime,
  FOREIGN KEY (cabinet_id) REFERENCES cabinets(id)
);

CREATE TABLE sensors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id integer,
  sensor_code varchar(50),
  sensor_type varchar(50),
  unit varchar(20),
  created_at datetime,
  FOREIGN KEY (device_id) REFERENCES devices(id)
);

CREATE TABLE sensor_readings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sensor_id integer,
  value decimal(12,4),
  created_at datetime,
  FOREIGN KEY (sensor_id) REFERENCES sensors(id)
);

CREATE TABLE rack_runtime (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rack_id integer UNIQUE,
  current_position decimal(10,2),
  target_position decimal(10,2),
  movement_speed decimal(10,2),
  displacement decimal(10,2),
  is_moving INTEGER,
  is_endpoint INTEGER,
  is_locked INTEGER,
  updated_at datetime,
  FOREIGN KEY (rack_id) REFERENCES racks(id)
);

CREATE TABLE motor_runtime (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rack_id integer,
  motor_status varchar(30),
  motor_current decimal(10,2),
  motor_voltage decimal(10,2),
  temperature decimal(5,2),
  updated_at datetime,
  FOREIGN KEY (rack_id) REFERENCES racks(id)
);

CREATE TABLE door_runtime (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cabinet_id integer UNIQUE,
  door_status varchar(20),
  is_locked INTEGER,
  updated_at datetime,
  FOREIGN KEY (cabinet_id) REFERENCES cabinets(id)
);

CREATE TABLE operation_status (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  operation_code varchar(100) UNIQUE,
  operation_type varchar(50),
  rack_id integer,
  status varchar(30),
  progress_percent decimal(5,2),
  started_at datetime,
  completed_at datetime,
  updated_at datetime,
  FOREIGN KEY (rack_id) REFERENCES racks(id)
);

CREATE TABLE ipc_commands (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  command_type varchar(100),
  payload_json text,
  source varchar(50),
  status varchar(30),
  sent_at datetime,
  ack_at datetime,
  created_at datetime
);

CREATE TABLE serial_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  direction varchar(10),
  payload text,
  created_at datetime
);

CREATE TABLE device_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type varchar(100),
  source varchar(100),
  payload_json text,
  created_at datetime
);

CREATE TABLE operation_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  operation_type varchar(100),
  payload_json text,
  status varchar(30),
  retry_count integer,
  created_at datetime,
  completed_at datetime
);

CREATE TABLE sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type varchar(100),
  entity_id integer,
  action varchar(30),
  payload_json text,
  sync_status varchar(30),
  created_at datetime,
  synced_at datetime
);

CREATE TABLE system_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  config_key varchar(100) UNIQUE,
  config_value text,
  updated_at datetime
);
