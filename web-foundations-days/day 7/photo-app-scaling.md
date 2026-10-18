# Scaling Plan for SnapShare

This document details the system design, capacity planning, back-of-the-envelope estimations, architecture diagram, component explanations, flow diagrams, and trade-offs for scaling **SnapShare**, a photo-sharing application.

---

## 1. Assumptions & Calculations

### Core Assumptions
- Total registered users: **10,000,000 (10 Million)**
- Daily Active Users (DAU): 10% of total users = **1,000,000 (1 Million DAU)**
- Upload activity: Each active user uploads **1 photo per day**
- Feed viewing activity: Each active user views **50 feed pages per day**
- Average original photo size: **2 MB**
- Thumbnail image size: **50 KB (0.05 MB)**
- Total size per photo stored: 2 MB + 0.05 MB = **2.05 MB**
- Peak load multiplier: **5x average load**
- Seconds in a day: $24 \times 60 \times 60 = 86,400\text{ seconds}$

---

### Back-of-the-Envelope Estimations

#### A. Uploads Per Second
- **Daily Uploads:** 1,000,000 photos/day
- **Average Uploads/sec:**
  $$\text{Average Uploads/sec} = \frac{1,000,000}{86,400} \approx 11.57 \text{ uploads/sec}$$
- **Peak Uploads/sec (5x):**
  $$\text{Peak Uploads/sec} = 11.57 \times 5 \approx 57.87 \text{ uploads/sec}$$

#### B. Feed Views Per Second
- **Daily Feed Views:** $1,000,000 \times 50 = 50,000,000 \text{ feed views/day}$
- **Average Feed Views/sec:**
  $$\text{Average Views/sec} = \frac{50,000,000}{86,400} \approx 578.7 \text{ views/sec}$$
- **Peak Feed Views/sec (5x):**
  $$\text{Peak Views/sec} = 578.7 \times 5 \approx 2,893.5 \text{ views/sec}$$

#### C. Photo Storage Per Year
- **Daily Photo Storage:**
  $$\text{Daily Storage} = 1,000,000 \text{ photos} \times 2.05 \text{ MB} = 2,050,000 \text{ MB} = 2.05 \text{ TB/day}$$
- **Yearly Photo Storage:**
  $$\text{Yearly Storage} = 2.05 \text{ TB/day} \times 365 \text{ days} \approx 748.25 \text{ TB/year}$$

---

## 2. Read-Heavy vs. Write-Heavy System Analysis

SnapShare is a **read-heavy system**. 

With approximately **578.7 average reads per second** compared to **11.57 average writes per second**, the read-to-write ratio is roughly **50:1**. 

### Design Implications
1. **Aggressive Caching Strategy:** Caching user feeds, profile metadata, and popular photos in memory (e.g., Redis) is essential to offload traffic from database instances.
2. **CDN Offloading:** Photo static assets (originals and thumbnails) must be served via a Content Delivery Network (CDN) to ensure low read latency globally and shield origin servers from bulk static requests.
3. **Database Read Replicas:** Primary database handles write operations, while multiple read replicas scale out feed metadata retrieval.

---

## 3. Storage Strategy: Object Storage vs. Database Blob

Photos **must never be stored directly inside relational databases** as binary large objects (BLOBs) because:
- Storing binary image data inflates database table sizes exponentially, leading to degraded indexing performance, slow backup/restoration cycles, and memory pressure on database cache pools.
- Relational databases are optimized for transactional structured queries, not bulk static file delivery.

### Recommended Solution
Photos belong in dedicated **Object Storage** (e.g., AWS S3, Cloudflare R2, or Google Cloud Storage). Object storage scales horizontally at low cost, provides high availability, and integrates directly with Content Delivery Networks (CDNs). The database stores only the structured metadata and the S3 image URLs (e.g., `https://cdn.snapshare.com/photos/abc123.jpg`).

---

## 4. Text-Based Architecture Diagram
                                +-------------------+
                                |    User Client    |
                                +-------------------+
                                          |
                                          v
                        +----------------------------------+
                        |  CDN (Content Delivery Network)  |
                        +----------------------------------+
                                          |
                                          v
                            +--------------------------+
                            |      Load Balancer       |
                            +--------------------------+
                                          |
                   +----------------------+----------------------+
                   |                                             |
                   v                                             v
        +--------------------+                        +--------------------+
        | App Server Node 1  |                        | App Server Node 2  |
        +--------------------+                        +--------------------+
          |         |      |                            |         |      |
          |         |      +------------+  +------------+         |      |
          v         v                   v  v                      v      v
      +-------+ +-------+             +------+                +-------+ +-------+
      | Cache | | Queue |             |  DB  |                | Cache | | Queue |
      | Redis | | SQS   |             | (SQL)|                | Redis | | SQS   |
      +-------+ +-------+             +------+                +-------+ +-------+
                    |                     ^                       |
                    v                     |                       v
          +-------------------+           |             +-------------------+
          |   Worker Node 1   |-----------+-------------|   Worker Node 2   |
          +-------------------+                         +-------------------+
                    |                                             |
                    +----------------------+----------------------+
                                           |
                                           v
                              +--------------------------+
                              |      Object Storage      |
                              |         (AWS S3)         |
                              +--------------------------+

## 5. System Components (One-Sentence Explanations)

- **CDN (Content Delivery Network):** Caches and serves static photo assets and thumbnails from edge locations close to users to minimize latency and bandwidth costs.
- **Load Balancer:** Distributes incoming HTTP traffic evenly across multiple application server nodes to prevent single-point overload and maintain high availability.
- **App Servers:** Executes core application logic, handles client requests, authenticates users, and manages feed coordination.
- **Cache (Redis/Memcached):** Stores frequently accessed user feeds, session data, and metadata in memory to deliver lightning-fast read response times.
- **Database with Read Replicas (PostgreSQL/MySQL):** Manages structured metadata (user accounts, photo URLs, follower graph) using a primary node for write operations and multiple read-only replicas to scale read queries.
- **Object Storage (AWS S3):** Provides scalable, durable, and cost-effective storage for raw original photo files and processed thumbnails.
- **Message Queue (RabbitMQ / AWS SQS):** Decouples photo uploading from expensive background processing tasks by holding thumbnail creation jobs asynchronously.
- **Worker Nodes:** Consumes processing jobs from the message queue to resize uploaded photos into thumbnails and update storage and metadata records.

---

## 6. Step-by-Step Photo Upload Flow

1. **Client Request:** The user selects a photo and sends an upload HTTP POST request to the Load Balancer.
2. **Server Receipt & Storage:** The Load Balancer routes the request to an available App Server, which uploads the original 2 MB photo file directly to **Object Storage (S3)**.
3. **Database Entry:** The App Server writes a new record into the **Primary Metadata Database** containing the photo ID, user ID, timestamp, and S3 file URL.
4. **Queue Task Publishing:** The App Server publishes an asynchronous background job (e.g., `{ photoId: "123", s3Url: "..." }`) to the **Message Queue**.
5. **Immediate Client Response:** The App Server immediately returns a success HTTP 201 response to the user client without waiting for thumbnail generation.
6. **Async Thumbnail Processing:** A background **Worker Node** picks up the job from the Message Queue, downloads the original photo, generates a 50 KB thumbnail image, uploads the thumbnail to Object Storage, and updates the database with the thumbnail URL.
7. **Cache Invalidation/Update:** The cache worker updates or invalidates relevant follower feed caches in **Redis** so followers see the new post upon their next feed fetch.

---

## 7. Trade-offs Analysis

### Trade-off 1: Asynchronous Processing vs. Real-Time Thumbnail Availability
- **Decision:** Generating thumbnails asynchronously using a Message Queue rather than synchronously during the user's upload HTTP request.
- **Trade-off:** Upload requests respond rapidly to the user, reducing network timeouts and server load during peak times; however, there is a minor delay (a few seconds) before the generated thumbnail becomes visible in followers' feeds.

### Trade-off 2: Cache Consistency vs. Feed Read Performance
- **Decision:** Caching pre-computed user timelines in Redis (fan-out on write/read).
- **Trade-off:** Reading feed pages achieves sub-10 millisecond response times; however, cache invalidation logic becomes more complex, and users might occasionally experience brief cache-staleness where newly uploaded photos take a couple of seconds to reflect across all follower feeds. 