CREATE DATABASE IF NOT EXISTS astra_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE astra_db;

CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    firstname VARCHAR(100) NOT NULL,
    lastname VARCHAR(100) NOT NULL,
    phone VARCHAR(30) NOT NULL,

    email VARCHAR(254) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,

    role ENUM('user', 'admin')
        NOT NULL DEFAULT 'user',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);

create TABLE user_health_diagnostics (
    id BIGINT UNSIGNED ,
    health_dignostic ENUM('radiation_level','Bone_Density'),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

);



