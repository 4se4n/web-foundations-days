# Library API Design (`/books`)

This document details the REST API specification for managing the **books** resource in a library system.

---

## API Endpoints

### 1. List All Books
- **Method:** `GET`
- **Path:** `/books`
- **Description:** Retrieves a list of all books available in the library database.
- **Success Status Code:** `200 OK`

### 2. Get Single Book
- **Method:** `GET`
- **Path:** `/books/:id`
- **Description:** Retrieves detailed information for a single book by its unique ID.
- **Success Status Code:** `200 OK`

### 3. Create a Book
- **Method:** `POST`
- **Path:** `/books`
- **Description:** Adds a new book to the library collection.
- **Request Body Example:**
  ```json
  {
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "publishedYear": 1925,
    "genre": "Fiction"
  }