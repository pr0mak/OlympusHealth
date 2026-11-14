CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    gender ENUM('male', 'female') NOT NULL,
    age TINYINT UNSIGNED NOT NULL,

    CONSTRAINT chk_user_age
        CHECK (age BETWEEN 18 AND 120)
);


CREATE TABLE generic_health (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,

    avg_heart_rate SMALLINT UNSIGNED,
    oxygen_saturation DECIMAL(5,2),
    body_temperature DECIMAL(4,2),
    sleep_duration DECIMAL(4,2),

    recorded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_generic_health_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_oxygen_saturation
        CHECK (oxygen_saturation BETWEEN 0 AND 100),

    CONSTRAINT chk_sleep_duration
        CHECK (sleep_duration BETWEEN 0 AND 24),

    INDEX idx_generic_health_user_date (user_id, recorded_at)
);


CREATE TABLE muscle_health (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,

    muscle_atrophy DECIMAL(6,2),
    muscle_fiber_type_i DECIMAL(5,2),
    muscle_fiber_type_ii DECIMAL(5,2),
    neuromuscular_coordination DECIMAL(7,2),

    recorded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_muscle_health_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_muscle_atrophy
        CHECK (muscle_atrophy BETWEEN 0 AND 100),

    CONSTRAINT chk_fiber_type_i
        CHECK (muscle_fiber_type_i BETWEEN 0 AND 100),

    CONSTRAINT chk_fiber_type_ii
        CHECK (muscle_fiber_type_ii BETWEEN 0 AND 100),

    CONSTRAINT chk_fiber_distribution
        CHECK (
            muscle_fiber_type_i IS NULL
            OR muscle_fiber_type_ii IS NULL
            OR muscle_fiber_type_i + muscle_fiber_type_ii
                BETWEEN 99.5 AND 100.5
        ),

    CONSTRAINT chk_neuromuscular_coordination
        CHECK (neuromuscular_coordination > 0),

    INDEX idx_muscle_health_user_date (user_id, recorded_at)
);


CREATE TABLE bone_health (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,

    bone_density DECIMAL(5,3),
    bone_quality DECIMAL(4,2),
    bone_metabolism_p1np DECIMAL(7,2),
    bone_metabolism_ctx DECIMAL(8,2),

    recorded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_bone_health_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_bone_density
        CHECK (bone_density > 0),

    CONSTRAINT chk_bone_quality
        CHECK (bone_quality > 0),

    CONSTRAINT chk_bone_p1np
        CHECK (bone_metabolism_p1np >= 0),

    CONSTRAINT chk_bone_ctx
        CHECK (bone_metabolism_ctx >= 0),

    INDEX idx_bone_health_user_date (user_id, recorded_at)
);


CREATE TABLE organ_health (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,

    arrhythmia BOOLEAN,
    kidney_stones_risk DECIMAL(5,2),
    oxygen_status DECIMAL(5,2),

    recorded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_organ_health_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_arrhythmia
        CHECK (arrhythmia IN (0, 1)),

    CONSTRAINT chk_kidney_stones_risk
        CHECK (kidney_stones_risk BETWEEN 0 AND 100),

    CONSTRAINT chk_oxygen_status
        CHECK (oxygen_status BETWEEN 0 AND 100),

    INDEX idx_organ_health_user_date (user_id, recorded_at)
);


CREATE TABLE space_radiation (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,

    daily_radiation_dose DECIMAL(9,4),
    cumulative_mission_dose DECIMAL(10,3),
    radiation_dose_rate DECIMAL(10,4),
    radiation_event BOOLEAN NOT NULL DEFAULT FALSE,

    recorded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_space_radiation_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_daily_radiation_dose
        CHECK (daily_radiation_dose >= 0),

    CONSTRAINT chk_cumulative_mission_dose
        CHECK (cumulative_mission_dose >= 0),

    CONSTRAINT chk_radiation_dose_rate
        CHECK (radiation_dose_rate >= 0),

    INDEX idx_space_radiation_user_date (user_id, recorded_at)
);
