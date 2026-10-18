-- Disable foreign key constraints during table drops if re-running
PRAGMA foreign_keys = ON;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS enrolments;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS students;

-- 1. CREATE TABLE STATEMENTS

-- Students Table
CREATE TABLE students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
);

-- Courses Table
CREATE TABLE courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL
);

-- Enrolments Table (Join Table)
CREATE TABLE enrolments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    grade TEXT,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE (student_id, course_id) -- Prevents duplicate course enrolment for the same student
);


-- 2. SAMPLE DATA INSERTIONS

-- Insert 3 Students (plus 1 extra to demonstrate "students with no enrolments")
INSERT INTO students (name, email) VALUES
('John Doe', 'john.doe@example.com'),
('Jane Smith', 'jane.smith@example.com'),
('Alice Johnson', 'alice.johnson@example.com'),
('Bob Williams', 'bob.williams@example.com'); -- Has no enrolments

-- Insert 3 Courses
INSERT INTO courses (title) VALUES
('Web Development Foundations'),
('Database Architecture'),
('System Analysis & Design');

-- Insert 5 Enrolments
INSERT INTO enrolments (student_id, course_id, grade) VALUES
(1, 1, 'A'), -- John Doe -> Web Dev
(1, 2, 'B'), -- John Doe -> Database Architecture
(2, 1, 'A'), -- Jane Smith -> Web Dev
(2, 3, 'A'), -- Jane Smith -> System Analysis
(3, 2, 'C'); -- Alice Johnson -> Database Architecture


-- 3. THE 5 REQUIRED QUERIES

-- Query 1: All courses for one student (by name: 'John Doe')
SELECT c.title, e.grade
FROM courses c
JOIN enrolments e ON c.id = e.course_id
JOIN students s ON e.student_id = s.id
WHERE s.name = 'John Doe';

-- Query 2: All students on one course (by course title: 'Web Development Foundations')
SELECT s.name, s.email, e.grade
FROM students s
JOIN enrolments e ON s.id = e.student_id
JOIN courses c ON e.course_id = c.id
WHERE c.title = 'Web Development Foundations';

-- Query 3: The number of students per course
SELECT c.title, COUNT(e.student_id) AS student_count
FROM courses c
LEFT JOIN enrolments e ON c.id = e.course_id
GROUP BY c.id, c.title;

-- Query 4: Students who have no enrolments
SELECT s.name, s.email
FROM students s
LEFT JOIN enrolments e ON s.id = e.student_id
WHERE e.id IS NULL;

-- Query 5: Update of one enrolment's grade
UPDATE enrolments
SET grade = 'A+'
WHERE student_id = 3 AND course_id = 2;