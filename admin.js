
-- Enverga Judging System - Full Schema (MySQL/MariaDB)
-- Compatible with MariaDB 10.4+ and MySQL 8.0+
-- NOTE: This keeps plaintext passwords to match the existing server.js behavior.
--       For production, switch to hashed passwords.

DROP DATABASE IF EXISTS enverga_judging_system;
CREATE DATABASE enverga_judging_system
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE enverga_judging_system;

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";
SET NAMES utf8mb4;

-- =============================
-- Tables
-- =============================
CREATE TABLE users (
  user_id INT(11) NOT NULL AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin','staff','judge') NOT NULL,
  full_name VARCHAR(100) DEFAULT NULL,
  email VARCHAR(100) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_active TINYINT(1) DEFAULT 1,
  PRIMARY KEY (user_id),
  UNIQUE KEY uk_username (username),
  KEY idx_username (username),
  KEY idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE event_types (
  event_type_id INT(11) NOT NULL AUTO_INCREMENT,
  type_name VARCHAR(100) NOT NULL,
  description TEXT DEFAULT NULL,
  is_pageant TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_active TINYINT(1) DEFAULT 1,
  PRIMARY KEY (event_type_id),
  UNIQUE KEY uk_type_name (type_name),
  KEY idx_type_name (type_name),
  KEY idx_is_pageant (is_pageant)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE competitions (
  competition_id INT(11) NOT NULL AUTO_INCREMENT,
  competition_name VARCHAR(200) NOT NULL,
  event_type_id INT(11) NOT NULL,
  competition_date DATE NOT NULL,
  competition_time TIME DEFAULT NULL,
  venue VARCHAR(200) DEFAULT NULL,
  event_description TEXT DEFAULT NULL,
  status ENUM('draft','active','completed','cancelled') DEFAULT 'active',
  max_participants INT(11) DEFAULT NULL,
  registration_deadline DATE DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (competition_id),
  KEY idx_competition_date (competition_date),
  KEY idx_status (status),
  KEY idx_event_type (event_type_id),
  CONSTRAINT competitions_ibfk_1 FOREIGN KEY (event_type_id) REFERENCES event_types (event_type_id) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE judges (
  judge_id INT(11) NOT NULL AUTO_INCREMENT,
  user_id INT(11) NOT NULL,
  judge_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  expertise VARCHAR(200) NOT NULL,
  experience_years INT(11) DEFAULT 0,
  credentials TEXT DEFAULT NULL,
  bio TEXT DEFAULT NULL,
  competition_id INT(11) DEFAULT NULL,
  is_available TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (judge_id),
  UNIQUE KEY uk_user_id (user_id),
  KEY idx_judge_name (judge_name),
  KEY idx_email (email),
  KEY idx_competition (competition_id),
  CONSTRAINT judges_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT judges_ibfk_2 FOREIGN KEY (competition_id) REFERENCES competitions (competition_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE participants (
  participant_id INT(11) NOT NULL AUTO_INCREMENT,
  participant_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  age INT(11) NOT NULL,
  gender ENUM('male','female','other') NOT NULL,
  school_organization VARCHAR(200) DEFAULT NULL,
  performance_title VARCHAR(200) DEFAULT NULL,
  performance_description TEXT DEFAULT NULL,
  competition_id INT(11) NOT NULL,
  status ENUM('pending','paid','waived','cancelled') DEFAULT 'pending',
  registration_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  height VARCHAR(20) DEFAULT NULL,
  measurements VARCHAR(50) DEFAULT NULL,
  talents TEXT DEFAULT NULL,
  special_awards TEXT DEFAULT NULL,
  emergency_contact_name VARCHAR(100) DEFAULT NULL,
  emergency_contact_phone VARCHAR(20) DEFAULT NULL,
  medical_conditions TEXT DEFAULT NULL,
  dietary_restrictions TEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (participant_id),
  KEY idx_participant_name (participant_name),
  KEY idx_email (email),
  KEY idx_competition (competition_id),
  KEY idx_status (status),
  CONSTRAINT participants_ibfk_1 FOREIGN KEY (competition_id) REFERENCES competitions (competition_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE competition_criteria (
  criteria_id INT(11) NOT NULL AUTO_INCREMENT,
  competition_id INT(11) NOT NULL,
  criteria_name VARCHAR(100) NOT NULL,
  description TEXT DEFAULT NULL,
  percentage DECIMAL(5,2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  max_score INT(11) DEFAULT 100 CHECK (max_score > 0),
  order_number INT(11) DEFAULT 1,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (criteria_id),
  UNIQUE KEY uk_competition_criteria (competition_id, criteria_name),
  KEY idx_competition_order (competition_id, order_number),
  CONSTRAINT competition_criteria_ibfk_1 FOREIGN KEY (competition_id) REFERENCES competitions (competition_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE criteria_templates (
  template_id INT(11) NOT NULL AUTO_INCREMENT,
  template_name VARCHAR(100) NOT NULL,
  event_type_id INT(11) NOT NULL,
  description TEXT DEFAULT NULL,
  created_by INT(11) DEFAULT NULL,
  is_default TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (template_id),
  KEY created_by (created_by),
  KEY idx_template_name (template_name),
  KEY idx_event_type (event_type_id),
  CONSTRAINT criteria_templates_ibfk_1 FOREIGN KEY (event_type_id) REFERENCES event_types (event_type_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT criteria_templates_ibfk_2 FOREIGN KEY (created_by) REFERENCES users (user_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE template_criteria (
  template_criteria_id INT(11) NOT NULL AUTO_INCREMENT,
  template_id INT(11) NOT NULL,
  criteria_name VARCHAR(100) NOT NULL,
  description TEXT DEFAULT NULL,
  percentage DECIMAL(5,2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  max_score INT(11) DEFAULT 100 CHECK (max_score > 0),
  order_number INT(11) DEFAULT 1,
  PRIMARY KEY (template_criteria_id),
  KEY idx_template_order (template_id, order_number),
  CONSTRAINT template_criteria_ibfk_1 FOREIGN KEY (template_id) REFERENCES criteria_templates (template_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE overall_scores (
  score_id INT(11) NOT NULL AUTO_INCREMENT,
  judge_id INT(11) NOT NULL,
  participant_id INT(11) NOT NULL,
  competition_id INT(11) NOT NULL,
  total_score DECIMAL(6,2) NOT NULL CHECK (total_score >= 0),
  general_comments TEXT DEFAULT NULL,
  submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (score_id),
  UNIQUE KEY uk_judge_participant (judge_id, participant_id, competition_id),
  KEY idx_competition_scores (competition_id),
  KEY idx_participant_scores (participant_id),
  CONSTRAINT overall_scores_ibfk_1 FOREIGN KEY (judge_id) REFERENCES judges (judge_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT overall_scores_ibfk_2 FOREIGN KEY (participant_id) REFERENCES participants (participant_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT overall_scores_ibfk_3 FOREIGN KEY (competition_id) REFERENCES competitions (competition_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE detailed_scores (
  detailed_score_id INT(11) NOT NULL AUTO_INCREMENT,
  judge_id INT(11) NOT NULL,
  participant_id INT(11) NOT NULL,
  competition_id INT(11) NOT NULL,
  criteria_id INT(11) NOT NULL,
  score DECIMAL(6,2) NOT NULL CHECK (score >= 0),
  weighted_score DECIMAL(6,2) NOT NULL CHECK (weighted_score >= 0),
  comments TEXT DEFAULT NULL,
  submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (detailed_score_id),
  UNIQUE KEY uk_judge_participant_criteria (judge_id, participant_id, criteria_id, competition_id),
  KEY idx_criteria (criteria_id),
  KEY idx_competition_detailed (competition_id),
  KEY idx_participant_detailed (participant_id),
  CONSTRAINT detailed_scores_ibfk_1 FOREIGN KEY (judge_id) REFERENCES judges (judge_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT detailed_scores_ibfk_2 FOREIGN KEY (participant_id) REFERENCES participants (participant_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT detailed_scores_ibfk_3 FOREIGN KEY (competition_id) REFERENCES competitions (competition_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT detailed_scores_ibfk_4 FOREIGN KEY (criteria_id) REFERENCES competition_criteria (criteria_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE pageant_segments (
  segment_id INT(11) NOT NULL AUTO_INCREMENT,
  competition_id INT(11) NOT NULL,
  segment_name VARCHAR(100) NOT NULL,
  segment_date DATE NOT NULL,
  segment_time TIME DEFAULT NULL,
  description TEXT DEFAULT NULL,
  order_number INT(11) DEFAULT 1,
  day_number INT(11) DEFAULT 1,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (segment_id),
  KEY idx_competition_segments (competition_id),
  KEY idx_segment_date (segment_date),
  CONSTRAINT pageant_segments_ibfk_1 FOREIGN KEY (competition_id) REFERENCES competitions (competition_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE pageant_segment_scores (
  segment_score_id INT(11) NOT NULL AUTO_INCREMENT,
  judge_id INT(11) NOT NULL,
  participant_id INT(11) NOT NULL,
  segment_id INT(11) NOT NULL,
  criteria_id INT(11) NOT NULL,
  score DECIMAL(6,2) NOT NULL CHECK (score >= 0),
  weighted_score DECIMAL(6,2) NOT NULL CHECK (weighted_score >= 0),
  comments TEXT DEFAULT NULL,
  submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (segment_score_id),
  UNIQUE KEY uk_judge_participant_segment_criteria (judge_id, participant_id, segment_id, criteria_id),
  KEY idx_participant (participant_id),
  KEY idx_criteria (criteria_id),
  KEY idx_segment_scores (segment_id),
  CONSTRAINT pageant_segment_scores_ibfk_1 FOREIGN KEY (judge_id) REFERENCES judges (judge_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT pageant_segment_scores_ibfk_2 FOREIGN KEY (participant_id) REFERENCES participants (participant_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT pageant_segment_scores_ibfk_3 FOREIGN KEY (segment_id) REFERENCES pageant_segments (segment_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT pageant_segment_scores_ibfk_4 FOREIGN KEY (criteria_id) REFERENCES competition_criteria (criteria_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE audit_log (
  log_id INT(11) NOT NULL AUTO_INCREMENT,
  table_name VARCHAR(50) NOT NULL,
  record_id INT(11) NOT NULL,
  action ENUM('INSERT','UPDATE','DELETE') NOT NULL,
  user_id INT(11) DEFAULT NULL,
  old_values LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (JSON_VALID(old_values)),
  new_values LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (JSON_VALID(new_values)),
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45) DEFAULT NULL,
  PRIMARY KEY (log_id),
  KEY idx_table_record (table_name, record_id),
  KEY idx_timestamp (timestamp),
  KEY idx_user (user_id),
  CONSTRAINT audit_log_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================
-- Views
-- =============================
CREATE OR REPLACE VIEW competition_overview AS
SELECT c.competition_id,
       c.competition_name,
       c.competition_date,
       c.status,
       et.type_name,
       et.is_pageant,
       COUNT(DISTINCT p.participant_id) AS participant_count,
       COUNT(DISTINCT j.judge_id)       AS judge_count,
       COUNT(DISTINCT cc.criteria_id)    AS criteria_count
FROM competitions c
LEFT JOIN event_types et ON c.event_type_id = et.event_type_id
LEFT JOIN participants p ON c.competition_id = p.competition_id AND p.status <> 'cancelled'
LEFT JOIN judges j ON c.competition_id = j.competition_id
LEFT JOIN competition_criteria cc ON c.competition_id = cc.competition_id AND cc.is_active = 1
GROUP BY c.competition_id;

CREATE OR REPLACE VIEW judge_workload_summary AS
SELECT j.judge_id,
       j.judge_name,
       j.competition_id,
       c.competition_name,
       COUNT(DISTINCT p.participant_id)                            AS total_participants,
       COUNT(DISTINCT os.score_id)                                 AS participants_scored,
       ROUND(
           COUNT(DISTINCT os.score_id) / NULLIF(COUNT(DISTINCT p.participant_id),0) * 100, 2
       ) AS completion_percentage
FROM judges j
LEFT JOIN competitions c ON j.competition_id = c.competition_id
LEFT JOIN participants p ON c.competition_id = p.competition_id AND p.status <> 'cancelled'
LEFT JOIN overall_scores os ON j.judge_id = os.judge_id AND p.participant_id = os.participant_id
GROUP BY j.judge_id;

CREATE OR REPLACE VIEW participant_scores_summary AS
SELECT p.participant_id,
       p.participant_name,
       p.competition_id,
       c.competition_name,
       AVG(os.total_score) AS average_score,
       COUNT(os.score_id)  AS judges_scored,
       MAX(os.submitted_at) AS last_scored
FROM participants p
LEFT JOIN competitions c ON p.competition_id = c.competition_id
LEFT JOIN overall_scores os ON p.participant_id = os.participant_id
WHERE p.status <> 'cancelled'
GROUP BY p.participant_id;

-- =============================
-- Stored Procedures
-- =============================
DELIMITER $$
CREATE OR REPLACE DEFINER=`root`@`localhost` PROCEDURE CalculateRankings (IN comp_id INT)
BEGIN
    SELECT 
        p.participant_id,
        p.participant_name,
        AVG(os.total_score) AS final_score,
        RANK() OVER (ORDER BY AVG(os.total_score) DESC) AS ranking,
        COUNT(os.score_id) AS judges_count
    FROM participants p
    LEFT JOIN overall_scores os 
      ON p.participant_id = os.participant_id AND os.competition_id = comp_id
    WHERE p.competition_id = comp_id AND p.status <> 'cancelled'
    GROUP BY p.participant_id
    HAVING judges_count > 0
    ORDER BY final_score DESC;
END$$

CREATE OR REPLACE DEFINER=`root`@`localhost` PROCEDURE GetDetailedScores (IN comp_id INT, IN part_id INT)
BEGIN
    SELECT 
        cc.criteria_name,
        cc.percentage,
        ds.score,
        ds.weighted_score,
        ds.comments,
        j.judge_name
    FROM detailed_scores ds
    JOIN competition_criteria cc ON ds.criteria_id = cc.criteria_id
    JOIN judges j ON ds.judge_id = j.judge_id
    WHERE ds.competition_id = comp_id AND ds.participant_id = part_id
    ORDER BY cc.order_number, j.judge_name;
END$$
DELIMITER ;

-- =============================
-- Seed Data
-- =============================
INSERT INTO users (user_id, username, password, role, full_name, email, is_active)
VALUES
(1, 'admin', 'admin123', 'admin', 'System Administrator', 'admin@school.edu', 1),
(2, 'cj279', 's35klF2g', 'judge', 'cj', NULL, 1),
(3, 'staff1', 'staff123', 'staff', 'Staff Member', NULL, 1);

INSERT INTO event_types (event_type_id, type_name, description, is_pageant, is_active)
VALUES
(1, 'Beauty Pageant', 'Traditional beauty pageant with multiple segments', 1, 1),
(2, 'Talent Show', 'Performance-based talent competition', 0, 1),
(3, 'Dance Competition', 'Dance performance and choreography contest', 0, 1),
(4, 'Music Competition', 'Musical performance and skill assessment', 0, 1),
(6, 'Debate Competition', 'Academic debate and argumentation contest', 0, 1),
(7, 'Team building', 'diff course', 0, 1);

INSERT INTO competitions (competition_id, competition_name, event_type_id, competition_date, event_description, status)
VALUES (1, 'sack race', 7, '2025-09-14', 'larong pinoy', 'active');

INSERT INTO competition_criteria (criteria_id, competition_id, criteria_name, description, percentage, max_score, order_number, is_active)
VALUES
(1, 1, 'fast', 'soper', 30.00, 30, 1, 1),
(2, 1, 'goods', 'goods', 70.00, 70, 2, 1);

INSERT INTO judges (judge_id, user_id, judge_name, email, phone, expertise, experience_years, credentials, competition_id, is_available)
VALUES (1, 2, 'cj', 'cj@gmail.com', '', 'Genralist', 6, 'best teacher', 1, 1);
