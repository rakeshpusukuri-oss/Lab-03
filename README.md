# Lab 3: REST API, query parameters, validation, debugging

**Name:** Rakesh · **Registration Number:** 252U1R1207 · **Section:** CSE-2D  
**Course:** Backend Development Fundamentals (Year II Term II • Aurora) · **Faculty:** Joel Prashanth D

---

## Submission & Repository Links
- **Course Repository:** [https://github.com/rakeshpusukuri-oss/Backend-Development](https://github.com/rakeshpusukuri-oss/Backend-Development)
- **Lab 3 Direct Folder:** [https://github.com/rakeshpusukuri-oss/Backend-Development/tree/main/lab-03](https://github.com/rakeshpusukuri-oss/Backend-Development/tree/main/lab-03)
- **Live Link:** `Not applicable` — Local Express.js REST API with file-based SQLite database (`books.db`). Comprehensive automated test logs and Postman collection are provided.

---

## How to Run

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18.x or v20.x recommended)
- `npm` (Node Package Manager)

### 2. Installation
Navigate into the `lab-03` directory and install dependencies:
```bash
cd lab-03
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env` (optional; defaults to port `3000`):
```bash
cp .env.example .env
```
Contents of `.env`:
```env
PORT=3000
```

### 4. Database Initialization & Seeding
The database (`books.db`) will be automatically created and populated with 10 sample books on first startup. You can also re-seed and view the records at any time:
```bash
npm run seed
```

### 5. Start Server
Run the development server with `nodemon` (auto-restarts on change):
```bash
npm run dev
```

Or run standard start:
```bash
npm start
```
The server will start at: `http://localhost:3000/`

### 6. Automated Testing & Postman Collection
Run the complete automated test suite (verifying 31 assertions across all query params, validation, and error cases):
```bash
npm test
```

Import `Lab-03-Postman-Collection.json` directly into Postman to test all 15 success and failure requests with a single click.

---

## Endpoints Table

| Method | Endpoint | Query / Path / Body Parameters | Success Status | Error Status | Description |
| :---: | :--- | :--- | :---: | :---: | :--- |
| **GET** | `/books/` | `search_q` (string, default `""`)<br>`min_price`, `max_price` (numbers, default `0`, `999999`)<br>`order_by` (`id\|title\|author\|price\|pages`, default `id`)<br>`order` (`ASC\|DESC`, default `ASC`)<br>`limit` (int, default `10`)<br>`offset` (int, default `0`) | `200 OK` | `400 Bad Request`<br>`500 Server Error` | Retrieves books with partial title search (`LIKE`), price range filtering (`BETWEEN`), sorting, and pagination. Rejects invalid parameters with 400. |
| **GET** | `/books/:bookId/` | Path Param: `:bookId` (integer) | `200 OK` | `404 Not Found`<br>`500 Server Error` | Retrieves a single book by ID. Returns 404 with standardized `{ "message": "..." }` if not found. |
| **POST** | `/books/` | JSON Body: `{ title, author, price, pages }` | `201 Created` | `400 Bad Request`<br>`500 Server Error` | Creates a new book. Strictly rejects missing fields, empty strings, and non-numeric/negative prices with 400. |
| **PUT** | `/books/:bookId/` | Path Param: `:bookId`<br>JSON Body: `{ title, author, price, pages }` | `200 OK` | `400 Bad Request`<br>`404 Not Found`<br>`500 Server Error` | Updates an existing book. Verifies existence (404) and validates input fields (400) before update. |
| **DELETE** | `/books/:bookId/` | Path Param: `:bookId` (integer) | `200 OK` | `404 Not Found`<br>`500 Server Error` | Removes a book from the database. Returns 404 if record does not exist. |

---

## Debugging Exercise: 4 Common Errors & Solutions

| Bug Type | Root Cause & Symptoms | Systematic Diagnosis & Fix |
| :--- | :--- | :--- |
| **1. `EADDRINUSE` (Port Conflict)** | Attempting to start the Express server on port 3000 while another node instance or background process is already listening on that port. | **Diagnostic:** `netstat -ano \| findstr :3000`<br>**Fix:** Terminated the orphaned process (`Stop-Process -Id <PID>`), or configured dynamic fallback port via `process.env.PORT \|\| 3000`. |
| **2. Wrong Import Path (`MODULE_NOT_FOUND`)** | Relative require statement like `require('./db')` failing because the file is named `database.js` or located in a different relative directory. | **Diagnostic:** Node throws `Error: Cannot find module './db'`.<br>**Fix:** Resolved exact relative path using `path.join(__dirname, 'database.js')` and verified file extensions. |
| **3. Table-Name Typo (`no such table: books`)** | SQL queries referenced `FROM books` (plural) while the SQLite database schema created the table as `book` (singular). | **Diagnostic:** SQLite driver throws `SQLITE_ERROR: no such table: books`.<br>**Fix:** Inspected database schema using `PRAGMA table_info('book')` and standardized all SQL queries to use the exact table name `book`. |
| **4. Missing `await` (Unresolved Promise)** | Forgetting `await` on asynchronous database calls (e.g. `const books = db.all(query)`), causing Express to send `[object Promise]` or empty response before the query resolved. | **Diagnostic:** `res.json()` outputs empty or internal Promise objects without query data.<br>**Fix:** Marked all route handlers as `async (req, res)` and ensured every `db.all()`, `db.get()`, and `db.run()` call is prefixed with `await`. |

---

## Screenshots

> Postman and console verification outputs are stored in [`screenshots/`](screenshots/).

### 1. GET /books/ (Default Query)
![GET /books/](screenshots/01_get_all_books.png)
*Fetches default 10 books sorted by ID ascending with HTTP 200 OK.*

### 2. Search by Title (`?search_q=code`)
![GET Search](screenshots/02_get_search_query.png)
*Partial title matching using SQL LIKE with HTTP 200 OK.*

### 3. Price Range Filter (`?min_price=600&max_price=800`)
![GET Price Filter](screenshots/03_get_price_filter.png)
*Filters books between 600 and 800 using SQL BETWEEN with HTTP 200 OK.*

### 4. Sort by Price Descending (`?order_by=price&order=DESC`)
![GET Sort](screenshots/04_get_sort_desc.png)
*Sorts books in descending order of price with HTTP 200 OK.*

### 5. Pagination (`?limit=3&offset=3`)
![GET Pagination](screenshots/05_get_pagination.png)
*Retrieves page 2 containing books at offset 3 with HTTP 200 OK.*

### 6. Query Validation Failure (HTTP 400 Bad Request)
![GET 400 Error](screenshots/06_get_invalid_param_400.png)
*Rejects invalid/unauthorized sort columns with 400 Bad Request.*

### 7. POST Validation Failure (HTTP 400 Bad Request)
![POST 400 Error](screenshots/10_post_validation_error_400.png)
*Rejects non-numeric price or missing fields with 400 Bad Request.*

### 8. POST Valid Creation (HTTP 201 Created)
![POST 201 Created](screenshots/09_post_create_201.png)
*Successfully inserts new book and returns generated ID with HTTP 201 Created.*

---

## Viva Questions & Answers

### 1. What is the difference between a query parameter and a path parameter?
> **Answer:**
> - **Path Parameters (`/books/:bookId`):** Form an integral part of the URL path used to identify a specific, singular resource in a resource hierarchy. They are mandatory; altering or omitting the path parameter points to a completely different endpoint.
> - **Query Parameters (`/books?search_q=code&order=DESC`):** Optional key-value pairs appended after `?` used to filter, sort, search, or paginate a collection of resources without changing the identity of the underlying endpoint.

### 2. What does "stateless" mean in RESTful API design?
> **Answer:**
> Statelessness means that the server retains **no client session context** between successive HTTP requests. Each incoming request must contain all the information necessary for the server to understand and process it (authentication tokens, query parameters, payload). If the server restarts or scales across multiple instances, any server instance can handle any client request independently.

### 3. Which HTTP status code is used for bad input vs. a missing record?
> **Answer:**
> - **`400 Bad Request`:** Used when the client's request is syntactically invalid, malformed, or fails semantic validation (e.g. sending a string for a numeric price, missing required body fields, or supplying an unwhitelisted sort column).
> - **`404 Not Found`:** Used when the request syntax is valid and well-formed, but the specific resource identified by the URI does not exist on the server (e.g. requesting `GET /books/9999` when ID 9999 does not exist in the database).

---

## Notes: Problems Faced and How You Solved Them

1. **SQL Injection Risks with Dynamic Column Sorting:**
   - *Problem:* SQLite `?` placeholders cannot be used for SQL identifiers such as column names (`ORDER BY ?`) or direction keywords (`ASC`/`DESC`). Direct string interpolation would introduce SQL injection vulnerabilities.
   - *Solution:* Implemented strict whitelist validation: `['id', 'title', 'author', 'price', 'pages']` for columns and `['ASC', 'DESC']` for direction. Any invalid value immediately halts the request with `400 Bad Request` before constructing the SQL query.

2. **Accurate Type Coercion for Price and Pagination:**
   - *Problem:* URL query parameters are parsed by Express as strings (e.g. `req.query.limit = "3"`). Passing raw strings to range or limit calculations can cause unexpected SQL behavior or NaN bugs.
   - *Solution:* Explicitly validated and parsed numbers using `parseInt(limit, 10)`, `parseInt(offset, 10)`, and `Number(min_price)`, returning `400 Bad Request` if negative or invalid.

3. **Standardizing Error Responses Across All Failure Cases:**
   - *Problem:* Inconsistent response shapes (e.g. `{ error: "..." }` vs `{ message: "..." }`) create difficulties for client-side API consumers.
   - *Solution:* Standardized all error and confirmation responses to uniform `{ "message": "..." }` payloads across 200, 201, 400, 404, and 500 status codes.
