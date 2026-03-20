-- KJSIT Student Connect Database Schema
CREATE DATABASE IF NOT EXISTS kjsit_connect;
USE kjsit_connect;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('student', 'faculty', 'alumni') DEFAULT 'student',
  department ENUM('AIDS', 'COMPS', 'IT', 'EXTC') NOT NULL,
  year_of_study ENUM('FE', 'SE', 'TE', 'BE', 'graduated', 'NA') DEFAULT 'FE',
  avatar_url VARCHAR(500) DEFAULT NULL,
  bio TEXT DEFAULT NULL,
  linkedin_url VARCHAR(500) DEFAULT NULL,
  github_url VARCHAR(500) DEFAULT NULL,
  is_online BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Notes table
CREATE TABLE IF NOT EXISTS notes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  subject VARCHAR(200) NOT NULL,
  department ENUM('AIDS', 'COMPS', 'IT', 'EXTC') NOT NULL,
  year ENUM('FE', 'SE', 'TE', 'BE') NOT NULL,
  semester INT NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INT DEFAULT 0,
  upload_by INT NOT NULL,
  download_count INT DEFAULT 0,
  rating_sum INT DEFAULT 0,
  rating_count INT DEFAULT 0,
  note_type ENUM('notes', 'pyq', 'assignment', 'other') DEFAULT 'notes',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (upload_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Note ratings table
CREATE TABLE IF NOT EXISTS note_ratings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  note_id INT NOT NULL,
  user_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_rating (note_id, user_id),
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Chat messages table (department-wise)
CREATE TABLE IF NOT EXISTS chat_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  department ENUM('AIDS', 'COMPS', 'IT', 'EXTC') NOT NULL,
  user_id INT NOT NULL,
  message TEXT NOT NULL,
  message_type ENUM('text', 'image', 'file') DEFAULT 'text',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Connections table (student-faculty-alumni connections)
CREATE TABLE IF NOT EXISTS connections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  requester_id INT NOT NULL,
  receiver_id INT NOT NULL,
  status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_connection (requester_id, receiver_id),
  FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Direct messages table
CREATE TABLE IF NOT EXISTS direct_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Events / Announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  department ENUM('AIDS', 'COMPS', 'IT', 'EXTC', 'ALL') DEFAULT 'ALL',
  posted_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (posted_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert sample data
INSERT INTO users (first_name, last_name, email, password, role, department, year_of_study, bio) VALUES
('Admin', 'User', 'admin@kjsit.somaiya.edu', '$2a$10$example_hash', 'faculty', 'COMPS', 'NA', 'Administrator of KJSIT Connect platform');
