CREATE TABLE `users` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `username` varchar(50) UNIQUE NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(100),
  `employee_code` varchar(50),
  `is_active` boolean DEFAULT true,
  `created_at` datetime,
  `updated_at` datetime
);

CREATE TABLE `roles` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `code` varchar(50) UNIQUE,
  `name` varchar(100),
  `description` text
);

CREATE TABLE `permissions` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `code` varchar(100) UNIQUE,
  `name` varchar(150),
  `description` text
);

CREATE TABLE `user_roles` (
  `user_id` integer,
  `role_id` integer,
  PRIMARY KEY (`user_id`, `role_id`)
);

CREATE TABLE `role_permissions` (
  `role_id` integer,
  `permission_id` integer,
  PRIMARY KEY (`role_id`, `permission_id`)
);

CREATE TABLE `access_logs` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `user_id` integer,
  `action` varchar(100),
  `description` text,
  `created_at` datetime
);

CREATE TABLE `cabinets` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `cabinet_code` varchar(50) UNIQUE,
  `cabinet_name` varchar(100),
  `status` varchar(30),
  `created_at` datetime
);

CREATE TABLE `racks` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `cabinet_id` integer,
  `rack_code` varchar(50),
  `rack_name` varchar(100),
  `total_shelves` integer,
  `created_at` datetime
);

CREATE TABLE `shelves` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `rack_id` integer,
  `shelf_code` varchar(50),
  `shelf_name` varchar(100),
  `level_no` integer,
  `created_at` datetime
);

CREATE TABLE `bins` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `shelf_id` integer,
  `bin_code` varchar(50),
  `bin_name` varchar(100),
  `capacity` integer,
  `created_at` datetime
);

CREATE TABLE `items` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `item_code` varchar(100) UNIQUE,
  `item_name` varchar(255),
  `unit` varchar(50),
  `min_qty` integer,
  `max_qty` integer,
  `created_at` datetime
);

CREATE TABLE `item_locations` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `item_id` integer,
  `bin_id` integer,
  `quantity` integer,
  `updated_at` datetime
);

CREATE TABLE `inventory_transactions` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `item_id` integer,
  `transaction_type` varchar(30),
  `quantity` integer,
  `reference_no` varchar(100),
  `user_id` integer,
  `created_at` datetime
);

CREATE TABLE `devices` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `device_code` varchar(50) UNIQUE,
  `device_name` varchar(100),
  `firmware_version` varchar(50),
  `serial_port` varchar(50),
  `status` varchar(30),
  `last_seen` datetime,
  `created_at` datetime
);

CREATE TABLE `device_heartbeats` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `device_id` integer,
  `status` varchar(30),
  `heartbeat_at` datetime
);

CREATE TABLE `environment_snapshots` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `cabinet_id` integer,
  `temperature` decimal(5,2),
  `humidity` decimal(5,2),
  `weight` decimal(10,2),
  `smoke_detected` boolean,
  `created_at` datetime
);

CREATE TABLE `sensors` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `device_id` integer,
  `sensor_code` varchar(50),
  `sensor_type` varchar(50),
  `unit` varchar(20),
  `created_at` datetime
);

CREATE TABLE `sensor_readings` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `sensor_id` integer,
  `value` decimal(12,4),
  `created_at` datetime
);

CREATE TABLE `rack_runtime` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `rack_id` integer UNIQUE,
  `current_position` decimal(10,2),
  `target_position` decimal(10,2),
  `movement_speed` decimal(10,2),
  `displacement` decimal(10,2),
  `is_moving` boolean,
  `is_endpoint` boolean,
  `is_locked` boolean,
  `updated_at` datetime
);

CREATE TABLE `motor_runtime` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `rack_id` integer,
  `motor_status` varchar(30),
  `motor_current` decimal(10,2),
  `motor_voltage` decimal(10,2),
  `temperature` decimal(5,2),
  `updated_at` datetime
);

CREATE TABLE `door_runtime` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `cabinet_id` integer UNIQUE,
  `door_status` varchar(20),
  `is_locked` boolean,
  `updated_at` datetime
);

CREATE TABLE `operation_status` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `operation_code` varchar(100) UNIQUE,
  `operation_type` varchar(50),
  `rack_id` integer,
  `status` varchar(30),
  `progress_percent` decimal(5,2),
  `started_at` datetime,
  `completed_at` datetime,
  `updated_at` datetime
);

CREATE TABLE `ipc_commands` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `command_type` varchar(100),
  `payload_json` text,
  `source` varchar(50),
  `status` varchar(30),
  `sent_at` datetime,
  `ack_at` datetime,
  `created_at` datetime
);

CREATE TABLE `serial_messages` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `direction` varchar(10),
  `payload` text,
  `created_at` datetime
);

CREATE TABLE `device_events` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `event_type` varchar(100),
  `source` varchar(100),
  `payload_json` text,
  `created_at` datetime
);

CREATE TABLE `operation_queue` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `operation_type` varchar(100),
  `payload_json` text,
  `status` varchar(30),
  `retry_count` integer,
  `created_at` datetime,
  `completed_at` datetime
);

CREATE TABLE `sync_queue` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `entity_type` varchar(100),
  `entity_id` integer,
  `action` varchar(30),
  `payload_json` text,
  `sync_status` varchar(30),
  `created_at` datetime,
  `synced_at` datetime
);

CREATE TABLE `system_configs` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `config_key` varchar(100) UNIQUE,
  `config_value` text,
  `updated_at` datetime
);

ALTER TABLE `user_roles` ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

ALTER TABLE `user_roles` ADD FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`);

ALTER TABLE `role_permissions` ADD FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`);

ALTER TABLE `role_permissions` ADD FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`);

ALTER TABLE `access_logs` ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

ALTER TABLE `racks` ADD FOREIGN KEY (`cabinet_id`) REFERENCES `cabinets` (`id`);

ALTER TABLE `shelves` ADD FOREIGN KEY (`rack_id`) REFERENCES `racks` (`id`);

ALTER TABLE `bins` ADD FOREIGN KEY (`shelf_id`) REFERENCES `shelves` (`id`);

ALTER TABLE `item_locations` ADD FOREIGN KEY (`item_id`) REFERENCES `items` (`id`);

ALTER TABLE `item_locations` ADD FOREIGN KEY (`bin_id`) REFERENCES `bins` (`id`);

ALTER TABLE `inventory_transactions` ADD FOREIGN KEY (`item_id`) REFERENCES `items` (`id`);

ALTER TABLE `inventory_transactions` ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

ALTER TABLE `device_heartbeats` ADD FOREIGN KEY (`device_id`) REFERENCES `devices` (`id`);

ALTER TABLE `environment_snapshots` ADD FOREIGN KEY (`cabinet_id`) REFERENCES `cabinets` (`id`);

ALTER TABLE `sensors` ADD FOREIGN KEY (`device_id`) REFERENCES `devices` (`id`);

ALTER TABLE `sensor_readings` ADD FOREIGN KEY (`sensor_id`) REFERENCES `sensors` (`id`);

ALTER TABLE `rack_runtime` ADD FOREIGN KEY (`rack_id`) REFERENCES `racks` (`id`);

ALTER TABLE `motor_runtime` ADD FOREIGN KEY (`rack_id`) REFERENCES `racks` (`id`);

ALTER TABLE `door_runtime` ADD FOREIGN KEY (`cabinet_id`) REFERENCES `cabinets` (`id`);

ALTER TABLE `operation_status` ADD FOREIGN KEY (`rack_id`) REFERENCES `racks` (`id`);
