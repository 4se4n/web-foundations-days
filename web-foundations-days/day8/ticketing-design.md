# TicketHub System Design Document

TicketHub is an event ticketing platform designed for handling high-concurrency ticket sales for concerts and major events without double-booking seats.

---

## 1. System Requirements

### Functional Requirements
- **Browse & Search:** Users can view listed events, search by title/category, and view detailed seat maps.
- **Hold Seats:** Users can hold selected seats for 10 minutes while checking out.
- **Payment & Order Processing:** Users can complete payments to confirm ticket purchases.
- **Ticket Retrieval:** Users can view purchased digital tickets and order history.

### Non-Functional Requirements
- **Speed (Low Latency):** Event browsing and seat map rendering must load in under 100ms.
- **Correctness (Data Integrity):** Zero double-booking allowed. Two users must never be sold the exact same seat.
- **Fairness:** High-demand sales operate on a strict first-come, first-served basis using queues to prevent bot exploitation.
- **High Availability:** The browsing experience remains available even during traffic spikes.

---

## 2. Capacity & Load Estimations

### Given Baseline Facts
- Registered Users: **2,000,000**
- Normal Daily Visitors: **50,000 visitors/day** (10 page views each)
- Normal Daily Sales: **5,000 tickets/day**
- High-Demand Concert Traffic: **200,000 buyers** trying for **20,000 seats** within the **first 10 minutes**

---

### A. Normal Day Traffic Estimates
- **Total Daily Page Views:** 
  $$50,000 \times 10 = 500,000 \text{ views/day}$$
- **Average Read QPS:**
  $$\frac{500,000}{86,400 \text{ seconds}} \approx 5.79 \text{ QPS}$$
- **Average Ticket Sales QPS:**
  $$\frac{5,000}{86,400 \text{ seconds}} \approx 0.058 \text{ QPS}$$

---

### B. "Big Sale" Peak Traffic Estimates (10-Minute Spike)
- **Time Window:** 10 minutes = $10 \times 60 = 600 \text{ seconds}$
- **Active Traffic:** 200,000 buyers making requests concurrently
- **Peak Write / Hold Request QPS:**
  $$\frac{200,000 \text{ buyers}}{600 \text{ seconds}} \approx 333.33 \text{ requests/sec}$$
- **Peak Read / Page View QPS (Assuming 5 views per buyer during sale):**
  $$\frac{200,000 \times 5}{600 \text{ seconds}} \approx 1,666.67 \text{ QPS}$$

---

### C. Traffic Comparison Summary

| Metric | Normal Day Traffic | "Big Sale" Peak Traffic | Scale Increase Factor |
| :--- | :--- | :--- | :--- |
| Read Load | ~5.79 QPS | ~1,666.67 QPS | **~288x Increase** |
| Write / Hold Load | ~0.058 QPS | ~333.33 QPS | **~5,747x Increase** |

---

## 3. API Design

### 1. List Events
- **Method:** `GET`
- **Path:** `/api/v1/events`
- **Description:** Returns paginated list of upcoming events.
- **Success Status:** `200 OK`

### 2. View Seat Map
- **Method:** `GET`
- **Path:** `/api/v1/events/:id/seats`
- **Description:** Returns current availability state for all seats of a specific event.
- **Success Status:** `200 OK`

### 3. Hold Seat (10-Minute Lock)
- **Method:** `POST`
- **Path:** `/api/v1/holds`
- **Description:** Places a temporary 10-minute hold on a selected seat.
- **Request Body:**
  ```json
  {
    "eventId": 101,
    "seatId": 450,
    "userId": 8821
  }

  Success Status: 201 Created

  4. Process Payment & Complete Order
Method: POST

Path: /api/v1/orders

Description: Confirms held seats and converts them into a final ticket order.

Request Body:
{
  "holdId": "hld_99218",
  "paymentToken": "tok_visa_123"
}
Success Status: 201 Created

5. View User Tickets
Method: GET

Path: /api/v1/users/:id/tickets

Description: Fetches all purchased tickets for the logged-in user.

Success Status: 200 OK

4. Data Model & SQL Schema
Entities & Relationships
users: Stores user account details.

events: Stores concert details and total ticket capacities.

seats: Stores specific seat numbers, status (AVAILABLE, HELD, BOOKED), and hold timestamps.

orders: Stores completed transaction details linked to a user and seat.
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    venue VARCHAR(150) NOT NULL,
    event_date TIMESTAMP NOT NULL
);

CREATE TABLE seats (
    id SERIAL PRIMARY KEY,
    event_id INT NOT NULL,
    seat_number VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE', -- 'AVAILABLE', 'HELD', 'BOOKED'
    held_by_user_id INT,
    hold_expires_at TIMESTAMP,
    version INT NOT NULL DEFAULT 1, -- For Optimistic Locking
    FOREIGN KEY (event_id) REFERENCES events(id),
    FOREIGN KEY (held_by_user_id) REFERENCES users(id),
    UNIQUE (event_id, seat_number)
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    seat_id INT NOT NULL UNIQUE,
    amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (seat_id) REFERENCES seats(id)
);

5. Preventing Double Booking
Double booking is prevented using Database Transactions, Optimistic Locking, and Redis Distributed Locks.

1. Atomic Database Update with Optimistic Locking
When a user attempts to hold a seat, the system executes an atomic UPDATE statement checking both status and version number:
UPDATE seats
SET status = 'HELD',
    held_by_user_id = 8821,
    hold_expires_at = NOW() + INTERVAL '10 minutes',
    version = version + 1
WHERE id = 450
  AND (status = 'AVAILABLE' OR (status = 'HELD' AND hold_expires_at < NOW()))
  AND version = 1;

  How This Prevents Double Booking:
If two users click "Buy Seat 450" at the exact same millisecond, the database processes one UPDATE first.

The first user's transaction updates the status to HELD and increments version to 2.

The second user's concurrent transaction evaluates WHERE status = 'AVAILABLE' and version = 1, which now yields 0 rows updated.

The application detects 0 affected rows and returns an error to the second user stating the seat is no longer available.

6. Architecture Diagram & High-Sale Survival Strategy
+-------------------+
                               |    User Client    |
                               +-------------------+
                                         |
                                         v
                       +------------------------------------+
                       | Cloudflare CDN & DDoS Protection   |
                       +------------------------------------+
                                         |
                                         v
                            +--------------------------+
                            |   Nginx Load Balancer    |
                            +--------------------------+
                                         |
                  +----------------------+----------------------+
                  |                                             |
                  v                                             v
       +--------------------+                        +--------------------+
       | App Server Node 1  |                        | App Server Node 2  |
       +--------------------+                        +--------------------+
         |        |       |                            |        |       |
         |        |       +------------+  +------------+        |       |
         v        v                    v  v                     v       v
     +-------+ +-------+             +------+               +-------+ +-------+
     | Redis | | Queue |             |Primary|              | Redis | | Queue |
     | Cache | |  SQS  |             |  DB   |              | Cache | |  SQS  |
     +-------+ +-------+             +------+               +-------+ +-------+
                   |                     |                      |
                   v                     v                      v
         +-------------------+     +----------+       +-------------------+
         |   Worker Node 1   |     | Read DB  |       |   Worker Node 2   |
         +-------------------+     | Replica  |       +-------------------+
                                   +----------+
                       How the Architecture Survives the Big Sale:
Virtual Waiting Room Queue (SQS / Redis): Excess traffic (200,000 users) is held in an ordered queue before reaching the backend app servers, letting users in in controlled batches.

Redis In-Memory Inventory Check: Seat availability is checked in Redis before hitting the relational database, dropping 90%+ of invalid buy requests immediately.

Database Read/Write Separation: Read Replicas serve seat map views, keeping the Primary SQL database dedicated strictly to processing hold/purchase transactions.

7. Trade-offs Analysis
Trade-off 1: Virtual Waiting Room Queue vs. Direct Database Access
Decision: Place users in a waiting queue during big sales.

Trade-off: Protects core databases from collapsing under 200,000 concurrent requests; however, users must wait in a queue page before seeing seat maps.

Trade-off 2: Optimistic Locking vs. Pessimistic Row Locking
Decision: Use Optimistic Locking (versioning) instead of blocking database locks (SELECT ... FOR UPDATE).

Trade-off: Avoids database thread-locking bottlenecks during high concurrency; however, users whose transactions fail receive a retry error when contention is high.            