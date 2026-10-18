### 5. `docs/data-model.md`

```markdown
# QuickNotes Data Model & Database Architecture

This document specifies the relational database schema, entities, query patterns, and database engine selection for QuickNotes.

---

## Entity-Relationship Specifications

1. **`users`**: Stores user identity, authentication credentials, and timestamps.
2. **`notes`**: Stores note title, main body text, ownership reference, and timestamps.
3. **`tags`**: Stores reusable category labels created by users.
4. **`note_tags`**: Junction table bridging `notes` and `tags` in a Many-to-Many relationship.

### Relationships
- **Users to Notes:** **One-to-Many (`1:N`)** — One user can create many notes, but each note belongs strictly to one user.
- **Notes to Tags:** **Many-to-Many (`M:N`)** — A note can have multiple tags, and a tag can be applied across multiple notes. Handled via `note_tags`.

---

## SQL Schema (CREATE TABLE Statements)

```sql
-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notes Table
CREATE TABLE notes (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    body TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tags Table
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(30) NOT NULL UNIQUE
);

-- Note_Tags Junction Table
CREATE TABLE note_tags (
    note_id INT NOT NULL,
    tag_id INT NOT NULL,
    PRIMARY KEY (note_id, tag_id),
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

Example SQL Queries
1. Fetch all notes with their tags for a specific user (JOIN)
SELECT 
    n.id AS note_id,
    n.title,
    n.body,
    n.created_at,
    STRING_AGG(t.name, ', ') AS assigned_tags
FROM notes n
LEFT JOIN note_tags nt ON n.id = nt.note_id
LEFT JOIN tags t ON nt.tag_id = t.id
WHERE n.user_id = 42
GROUP BY n.id
ORDER BY n.created_at DESC;
2. Search notes matching keyword in title or body
SELECT id, title, body, created_at
FROM notes
WHERE user_id = 42 
  AND (title ILIKE '%architecture%' OR body ILIKE '%architecture%')
ORDER BY created_at DESC;
3. Count total notes written per user
SELECT u.username, COUNT(n.id) AS total_notes
FROM users u
LEFT JOIN notes n ON u.id = n.user_id
GROUP BY u.id, u.username;
Database Indexing Strategy
CREATE INDEX idx_notes_user_id_created ON notes(user_id, created_at DESC);

##Index Justification
- The vast majority of query traffic involves fetching notes for a specific user ordered by creation time. Standard unindexed table scans require $O(N)$ operations across millions of records. 
- Creating a compound index on (user_id, created_at DESC) allows the database to instantly locate a user's subset of notes in $O(\log N)$ time and return them pre-sorted without triggering an expensive memory sort operation.

## SQL vs. NoSQL Decision Justification
- We selected a Relational SQL Database (PostgreSQL) for QuickNotes over NoSQL.

- Justification: QuickNotes requires strong transactional integrity, rigid user-ownership constraints, foreign key enforcement (ON DELETE CASCADE), and complex analytical joins (e.g., linking users, notes, and tags). SQL databases excel at ACID compliance and dynamic multi-table joining, ensuring note data remains perfectly consistent without orphan tag records or data corruption.
