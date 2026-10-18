# School Database Design & Architecture

This document provides an overview of the table structures, relational design, indexing strategy, and database model selection for the school management system.

---

## 1. Table Descriptions & Entities

- **`students`**: Represents individual students registered in the system. Stores essential details including `id`, `name`, and a unique `email`.
- **`courses`**: Represents academic courses offered. Stores the course `id` and `title`.
- **`enrolments`**: Serves as a bridge/junction table capturing student registrations in specific courses along with their corresponding `grade`.

---

## 2. Database Relationships & Join Table Explanation

- **Students to Enrolments:** **One-to-Many (`1:N`)** — One student can have multiple enrolment records, but each enrolment record belongs to exactly one student.
- **Courses to Enrolments:** **One-to-Many (`1:N`)** — One course can have multiple enrolment records, but each enrolment record references exactly one course.
- **Students to Courses:** **Many-to-Many (`M:N`)** — A student can enrol in multiple courses, and a course can be taken by multiple students.

### Why a Join Table is Needed
Relational databases cannot directly link two tables in a many-to-many relationship without creating massive data redundancy or data integrity issues. The `enrolments` join table breaks down the `M:N` relationship into two manageable `1:N` relationships using foreign keys (`student_id` and `course_id`), allowing additional context (such as `grade`) to be stored per enrolment.

---

## 3. Database Indexing

- **Index Candidate:** `CREATE INDEX idx_enrolments_student_id ON enrolments(student_id);`
- **Reason:** Queries filtering or joining by student identity (such as looking up all courses taken by a specific student) frequently search the `student_id` column in `enrolments`. Adding an index speeds up table joins and lookup performance significantly as the enrolment dataset scales.

---

## 4. SQL vs. NoSQL Comparison

For this school administration system, **SQL (Relational Database)** is the ideal choice. 

**Reasons:**
1. **Relational Integrity:** The system relies heavily on structured entity relationships between students, courses, and grades. SQL natively enforces foreign key constraints and prevents orphan records.
2. **ACID Compliance & Consistency:** Grade assignments and course enrollments require strict transactional consistency to prevent double-enrolments or invalid state updates.
3. **Complex Querying Capabilities:** Reporting operations (such as aggregate student counts, filtering un-enrolled students, or cross-referencing grades across subjects) are easily handled via standard SQL `JOIN` and `GROUP BY` operations.