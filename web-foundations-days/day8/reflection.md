```markdown
# Course Reflection

## 1. Most Difficult Concept
The most challenging concept in this course was understanding relational database transactions and concurrency controls—specifically how to handle race conditions when thousands of users interact with the exact same row in a database simultaneously. Visualizing how atomic operations and optimistic locking prevent double-bookings required shifting from simple linear logic to thinking about concurrent execution paths.

## 2. Overcoming the Difficulty
I overcame this by breaking down complex interactions into step-by-step SQL queries and testing edge cases manually. Writing out SQL update statements with `WHERE` clauses checking versions and timestamps helped me understand how relational databases enforce consistency natively.

## 3. Improving the Capstone Based on Feedback
Based on system design feedback, I would improve the TicketHub capstone by implementing a dedicated Redis token bucket algorithm for rate-limiting bot traffic, and adding automated webhooks for expired seat hold cleanups rather than relying on lazy evaluation.

## 4. Next Steps
My next goal is to build full-stack applications with Node.js and PostgreSQL, focus on mastering microservice communication patterns, and prepare for cloud infrastructure certifications.