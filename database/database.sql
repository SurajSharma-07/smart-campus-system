CREATE DATABASE IF NOT EXISTS smart_campus;
USE smart_campus;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS complaint_updates;
DROP TABLE IF EXISTS complaints;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_salt VARCHAR(64) NOT NULL,
  password_hash VARCHAR(64) NOT NULL,
  role ENUM('student','admin') NOT NULL DEFAULT 'student',
  department_id INT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE departments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255),
  is_active TINYINT(1) NOT NULL DEFAULT 1
);

ALTER TABLE users
  ADD CONSTRAINT fk_users_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;

CREATE TABLE categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255),
  department_id INT NOT NULL,
  default_priority ENUM('Low','Medium','High','Critical') NOT NULL DEFAULT 'Medium',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  CONSTRAINT fk_categories_department FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE sessions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  token CHAR(36) NOT NULL UNIQUE,
  user_id INT NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_sessions_token (token),
  INDEX idx_sessions_expiry (expires_at)
);

CREATE TABLE complaints (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ticket_code VARCHAR(30) UNIQUE,
  student_id INT NOT NULL,
  category_id INT NOT NULL,
  department_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  location VARCHAR(150) NOT NULL,
  image_url LONGTEXT NULL,
  priority ENUM('Low','Medium','High','Critical') NOT NULL DEFAULT 'Medium',
  status ENUM('Submitted','In Review','Assigned','In Progress','Resolved','Rejected') NOT NULL DEFAULT 'Submitted',
  due_at DATETIME NULL,
  upvotes_count INT NOT NULL DEFAULT 0,
  rating INT NULL,
  rating_feedback TEXT NULL,
  assigned_by INT NULL,
  resolved_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_complaints_student FOREIGN KEY (student_id) REFERENCES users(id),
  CONSTRAINT fk_complaints_category FOREIGN KEY (category_id) REFERENCES categories(id),
  CONSTRAINT fk_complaints_department FOREIGN KEY (department_id) REFERENCES departments(id),
  CONSTRAINT fk_complaints_assigned_by FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_complaints_status (status),
  INDEX idx_complaints_priority (priority),
  INDEX idx_complaints_department (department_id),
  INDEX idx_complaints_student (student_id),
  INDEX idx_complaints_created (created_at)
);

CREATE TABLE complaint_upvotes (
  complaint_id INT NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (complaint_id, user_id),
  CONSTRAINT fk_upvotes_complaint FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
  CONSTRAINT fk_upvotes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE settings (
  key_name VARCHAR(50) PRIMARY KEY,
  key_value LONGTEXT
);

INSERT INTO settings (key_name, key_value) VALUES
('institution_name', 'Smart Campus Institute'),
('institution_logo', '');


CREATE TABLE complaint_updates (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  complaint_id INT NOT NULL,
  actor_user_id INT NOT NULL,
  update_type VARCHAR(40) NOT NULL,
  old_status VARCHAR(30),
  new_status VARCHAR(30),
  old_priority VARCHAR(20),
  new_priority VARCHAR(20),
  comment TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_updates_complaint FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
  CONSTRAINT fk_updates_actor FOREIGN KEY (actor_user_id) REFERENCES users(id),
  INDEX idx_updates_complaint (complaint_id)
);

CREATE TABLE notifications (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  complaint_id INT NULL,
  title VARCHAR(150) NOT NULL,
  message VARCHAR(500) NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_notifications_complaint FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
  INDEX idx_notifications_user_read (user_id, is_read),
  INDEX idx_notifications_created (created_at)
);

INSERT INTO departments (name, description) VALUES
('Facilities & Maintenance', 'Classrooms, furniture, buildings, plumbing, and general maintenance.'),
('IT Services', 'Wi-Fi, network, computers, smart classroom systems, and software access.'),
('Electrical Services', 'Lighting, power outlets, fans, electrical safety, and related equipment.'),
('Housekeeping', 'Washrooms, cleanliness, waste collection, and hygiene.'),
('Campus Security', 'Safety, access control, security infrastructure, and incidents.');

-- Demo password policy for this academic project:
-- password_hash = SHA-256(password_salt + ':' + password)
INSERT INTO users (name, email, password_salt, password_hash, role, department_id) VALUES
('Aarav Student', 'student@campus.edu', 'student-salt-2026', 'c9a4390b0fc667241bf9f118c47fab7bb5d847d8fde5e40042e10ccb3adc8dbd', 'student', NULL),
('Riya Sharma', 'riya@campus.edu', 'student-salt-2026', 'c9a4390b0fc667241bf9f118c47fab7bb5d847d8fde5e40042e10ccb3adc8dbd', 'student', NULL),
('Vikram Patel', 'vikram@campus.edu', 'student-salt-2026', 'c9a4390b0fc667241bf9f118c47fab7bb5d847d8fde5e40042e10ccb3adc8dbd', 'student', NULL),
('Ananya Gupta', 'ananya@campus.edu', 'student-salt-2026', 'c9a4390b0fc667241bf9f118c47fab7bb5d847d8fde5e40042e10ccb3adc8dbd', 'student', NULL),
('Campus Administrator', 'admin@campus.edu', 'admin-salt-2026', 'b77aea7d5b4e7b6917948cdfd8691f980a7d15f9304e1ec04f814494c36161e3', 'admin', 1);

INSERT INTO categories (name, description, department_id, default_priority) VALUES
('Classroom / Furniture', 'Broken benches, desks, doors, boards, or classroom infrastructure.', 1, 'Medium'),
('Laboratory Equipment', 'Faulty or missing lab equipment and lab infrastructure issues.', 1, 'High'),
('Wi-Fi / Network', 'Connectivity, Wi-Fi coverage, router, or campus network problems.', 2, 'High'),
('Computer / Smart Classroom', 'Projector, display, classroom computer, or smart classroom problems.', 2, 'High'),
('Electricity / Lighting', 'Power outlets, fans, lights, switches, and electrical issues.', 3, 'High'),
('Washroom / Hygiene', 'Cleaning, water, plumbing, and washroom hygiene complaints.', 4, 'High'),
('Housekeeping / Cleanliness', 'Garbage, corridor cleaning, classroom cleaning, or sanitation.', 4, 'Medium'),
('Security / Safety', 'Access, security equipment, unsafe areas, or safety concerns.', 5, 'Critical'),
('Other Campus Issue', 'Issues that do not fit the listed categories.', 1, 'Medium');

INSERT INTO complaints
(ticket_code, student_id, category_id, department_id, title, description, location, priority, status, due_at, assigned_by, resolved_at, created_at)
VALUES
('CMP-2026-0001', 1, 3, 2, 'Wi-Fi drops near Library Floor 2',
 'The Wi-Fi disconnects repeatedly near the north reading area. It becomes difficult to access course material during peak hours.',
 'Central Library - Floor 2', 'High', 'In Progress', DATE_ADD(NOW(), INTERVAL 2 DAY), 2, NULL, DATE_SUB(NOW(), INTERVAL 2 DAY)),
('CMP-2026-0002', 1, 5, 3, 'Ceiling lights not working in Room B-204',
 'Two ceiling lights have stopped working. The room is visibly darker after 5 PM and the issue affects evening practical sessions.',
 'Academic Block B - Room 204', 'Medium', 'Resolved', DATE_SUB(NOW(), INTERVAL 1 DAY), 2, DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_SUB(NOW(), INTERVAL 6 DAY)),
('CMP-2026-0003', 1, 6, 4, 'Washroom water tap leaking',
 'A tap beside the second wash basin is continuously leaking and the floor remains wet.',
 'Main Building - Ground Floor Washroom', 'High', 'Submitted', DATE_ADD(NOW(), INTERVAL 3 DAY), NULL, NULL, DATE_SUB(NOW(), INTERVAL 4 HOUR)),
('CMP-2026-0004', 1, 8, 5, 'Loose railing near stairway',
 'The railing at the first-floor staircase feels loose and may become a safety issue for students.',
 'Academic Block A - Staircase 1', 'Critical', 'In Review', DATE_ADD(NOW(), INTERVAL 12 HOUR), 2, NULL, DATE_SUB(NOW(), INTERVAL 8 HOUR));

INSERT INTO complaint_updates (complaint_id, actor_user_id, update_type, old_status, new_status, old_priority, new_priority, comment)
VALUES
(1, 1, 'Status Change', NULL, 'Submitted', NULL, 'High', 'Complaint submitted by student.'),
(1, 2, 'Admin Update', 'Submitted', 'In Progress', 'High', 'High', 'Assigned to IT Services for network diagnostics.'),
(2, 1, 'Status Change', NULL, 'Submitted', NULL, 'Medium', 'Complaint submitted by student.'),
(2, 2, 'Admin Update', 'Submitted', 'Resolved', 'Medium', 'Medium', 'Replacement lights installed and the room was checked.'),
(3, 1, 'Status Change', NULL, 'Submitted', NULL, 'High', 'Complaint submitted by student.'),
(4, 1, 'Status Change', NULL, 'Submitted', NULL, 'Critical', 'Complaint submitted by student.'),
(4, 2, 'Admin Update', 'Submitted', 'In Review', 'Critical', 'Critical', 'Safety complaint escalated for physical inspection.');

INSERT INTO notifications (user_id, complaint_id, title, message, is_read) VALUES
(1, 2, 'Complaint CMP-2026-0002 resolved', 'Replacement lights installed and the room was checked.', 0),
(1, 1, 'Complaint CMP-2026-0001 updated', 'Assigned to IT Services for network diagnostics.', 1),
(1, 4, 'Complaint CMP-2026-0004 under review', 'Safety complaint escalated for physical inspection.', 0),
(2, 3, 'New complaint CMP-2026-0003', 'Aarav Student submitted a high priority complaint: Washroom water tap leaking', 1),
(2, 4, 'New critical complaint CMP-2026-0004', 'Aarav Student submitted a critical priority complaint: Loose railing near stairway', 0);

