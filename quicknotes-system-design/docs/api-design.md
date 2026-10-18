# QuickNotes REST API Specification

This document details the production REST API specification designed for the scalable backend implementation of QuickNotes.

---

## REST Endpoints Overview

| Method | Endpoint Path | Description | Success Status |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/notes` | Retrieves a paginated list of notes belonging to the authenticated user. | `200 OK` |
| `GET` | `/api/v1/notes/:id` | Retrieves complete details for a specific note by ID. | `200 OK` |
| `POST` | `/api/v1/notes` | Creates a new note for the authenticated user. | `201 Created` |
| `PUT` | `/api/v1/notes/:id` | Replaces an existing note's entire content. | `200 OK` |
| `DELETE` | `/api/v1/notes/:id` | Permanently deletes a specific note. | `200 OK` / `204 No Content` |
| `GET` | `/api/v1/notes/search?q={query}` | Searches notes by matching text queries against title and body. | `200 OK` |

---

## Request & Response JSON Examples

### 1. Create a Note (`POST /api/v1/notes`)

**Request Headers:**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json

Request Body:
{
  "title": "System Design Deliverables",
  "body": "Finalize database indexing strategies and Redis caching layers.",
  "tagIds": [1, 3]
}

Response Body (201 Created):
{
  "id": 1052,
  "userId": 42,
  "title": "System Design Deliverables",
  "body": "Finalize database indexing strategies and Redis caching layers.",
  "tags": [
    { "id": 1, "name": "Work" },
    { "id": 3, "name": "Architecture" }
  ],
  "createdAt": "2026-10-18T18:00:00Z",
  "updatedAt": "2026-10-18T18:00:00Z"
}
2. List Notes (GET /api/v1/notes?page=1&limit=2)
Response Body (200 OK):
{
  "page": 1,
  "limit": 2,
  "total": 45,
  "data": [
    {
      "id": 1052,
      "title": "System Design Deliverables",
      "body": "Finalize database indexing strategies and Redis caching layers.",
      "createdAt": "2026-10-18T18:00:00Z"
    },
    {
      "id": 1051,
      "title": "Grocery List",
      "body": "Milk, eggs, oats, and coffee.",
      "createdAt": "2026-10-17T12:30:00Z"
    }
  ]
}

** HTTP Error Codes & Payload Standard **

All error responses return a standardized JSON structure across all API routes:

400 Bad Request: Sent when validation fails (e.g., missing title or title > 100 characters).

401 Unauthorized: Sent when request lacks a valid JWT authentication token.

403 Forbidden: Sent when a user attempts to access or delete another user's private note.

404 Not Found: Sent when requesting a note ID that does not exist in the system.

500 Internal Server Error: Sent when an unhandled server or database exception occurs.

Example Error Response (400 Bad Request)
{
  "error": {
    "code": "VALIDATION_FAILED",
    "status": 400,
    "message": "Invalid request payload provided.",
    "details": [
      {
        "field": "title",
        "issue": "Title is required and must not exceed 100 characters."
      }
    ],
    "timestamp": "2026-10-18T18:05:00Z"
  }
}