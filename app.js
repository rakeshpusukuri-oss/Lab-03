const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "books.db");
const PORT = process.env.PORT || 3000;

let db = null;

// Async function to open the database and start the server only after connection succeeds
async function initializeDBAndServer() {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    // Ensure the book table exists
    await db.exec(`
      CREATE TABLE IF NOT EXISTS book (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        price INTEGER NOT NULL,
        pages INTEGER NOT NULL
      );
    `);

    // Pre-seed with 10 records if table is empty
    const countRow = await db.get("SELECT COUNT(*) AS count FROM book;");
    if (countRow.count === 0) {
      console.log("Database table 'book' is empty. Inserting initial seed records...");
      const seedBooks = [
        ["Clean Code", "Robert C. Martin", 650, 464],
        ["The Pragmatic Programmer", "Andrew Hunt & David Thomas", 720, 352],
        ["Design Patterns", "Erich Gamma et al.", 850, 395],
        ["You Don't Know JS Yet", "Kyle Simpson", 450, 280],
        ["JavaScript: The Good Parts", "Douglas Crockford", 380, 176],
        ["Introduction to Algorithms", "Thomas H. Cormen", 1200, 1312],
        ["Refactoring", "Martin Fowler", 790, 448],
        ["Database System Concepts", "Abraham Silberschatz", 950, 1376],
        ["Designing Data-Intensive Applications", "Martin Kleppmann", 1100, 616],
        ["Site Reliability Engineering", "Betsy Beyer et al.", 880, 550]
      ];

      const insertQuery = `
        INSERT INTO book (title, author, price, pages)
        VALUES (?, ?, ?, ?);
      `;

      for (const item of seedBooks) {
        await db.run(insertQuery, item);
      }
      console.log("Seeded 10 books into 'book' table.");
    }

    app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}/`);
    });
  } catch (error) {
    console.error(`DB Initialization Error: ${error.message}`);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------
// RESTful Endpoints
// ---------------------------------------------------------------------

/**
 * 1. GET /books/
 * Query parameters:
 *  - search_q: partial title match (LIKE %...%) [default: ""]
 *  - min_price: minimum book price [default: 0]
 *  - max_price: maximum book price [default: 999999]
 *  - order_by: column to sort by ('id', 'title', 'author', 'price', 'pages') [default: "id"]
 *  - order: direction ('ASC', 'DESC') [default: "ASC"]
 *  - limit: maximum records to return [default: 10]
 *  - offset: records to skip for pagination [default: 0]
 */
app.get("/books/", async (request, response) => {
  try {
    const {
      search_q = "",
      min_price = 0,
      max_price = 999999,
      order_by = "id",
      order = "ASC",
      limit = 10,
      offset = 0
    } = request.query;

    // Validate price range parameters
    const parsedMinPrice = Number(min_price);
    const parsedMaxPrice = Number(max_price);
    if (isNaN(parsedMinPrice) || isNaN(parsedMaxPrice) || parsedMinPrice < 0 || parsedMaxPrice < parsedMinPrice) {
      return response.status(400).json({
        message: "Invalid price range: min_price and max_price must be valid positive numbers with min_price <= max_price"
      });
    }

    // Whitelist validation for order_by column
    const allowedColumns = ["id", "title", "author", "price", "pages"];
    const normalizedOrderBy = String(order_by).toLowerCase();
    if (!allowedColumns.includes(normalizedOrderBy)) {
      return response.status(400).json({
        message: `Invalid order_by column '${order_by}'. Allowed columns: ${allowedColumns.join(", ")}`
      });
    }

    // Whitelist validation for order direction
    const normalizedOrder = String(order).toUpperCase();
    if (normalizedOrder !== "ASC" && normalizedOrder !== "DESC") {
      return response.status(400).json({
        message: `Invalid order direction '${order}'. Allowed values: ASC, DESC`
      });
    }

    // Validate limit and offset for pagination
    const parsedLimit = parseInt(limit, 10);
    const parsedOffset = parseInt(offset, 10);
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      return response.status(400).json({
        message: "Invalid limit: limit must be a positive integer"
      });
    }
    if (isNaN(parsedOffset) || parsedOffset < 0) {
      return response.status(400).json({
        message: "Invalid offset: offset must be a non-negative integer"
      });
    }

    // Parameterized SQL query with safe dynamic ordering
    const getBooksQuery = `
      SELECT *
      FROM book
      WHERE title LIKE ? AND price BETWEEN ? AND ?
      ORDER BY ${normalizedOrderBy} ${normalizedOrder}
      LIMIT ? OFFSET ?;
    `;

    const searchPattern = `%${search_q}%`;
    const books = await db.all(getBooksQuery, [
      searchPattern,
      parsedMinPrice,
      parsedMaxPrice,
      parsedLimit,
      parsedOffset
    ]);

    response.status(200).json(books);
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
});

/**
 * 2. GET /books/:bookId/
 * Retrieve a single book by ID
 */
app.get("/books/:bookId/", async (request, response) => {
  try {
    const { bookId } = request.params;
    const getBookQuery = `
      SELECT *
      FROM book
      WHERE id = ?;
    `;
    const book = await db.get(getBookQuery, [bookId]);

    if (!book) {
      return response.status(404).json({ message: `Book with ID ${bookId} not found` });
    }

    response.status(200).json(book);
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
});

/**
 * Validation helper function for POST and PUT request bodies
 */
function validateBookPayload(body) {
  const { title, author, price, pages } = body;

  if (title === undefined || typeof title !== "string" || title.trim() === "") {
    return "Missing or invalid title: title must be a non-empty string";
  }
  if (author === undefined || typeof author !== "string" || author.trim() === "") {
    return "Missing or invalid author: author must be a non-empty string";
  }
  if (price === undefined || typeof price !== "number" || isNaN(price) || price <= 0) {
    return "Missing or invalid price: price must be a positive number";
  }
  if (pages === undefined || !Number.isInteger(pages) || pages <= 0) {
    return "Missing or invalid pages: pages must be a positive integer";
  }
  return null;
}

/**
 * 3. POST /books/
 * Create a new book with strict body validation
 */
app.post("/books/", async (request, response) => {
  try {
    const validationError = validateBookPayload(request.body);
    if (validationError) {
      return response.status(400).json({ message: validationError });
    }

    const { title, author, price, pages } = request.body;

    const addBookQuery = `
      INSERT INTO book (title, author, price, pages)
      VALUES (?, ?, ?, ?);
    `;

    const result = await db.run(addBookQuery, [
      title.trim(),
      author.trim(),
      price,
      pages
    ]);

    response.status(201).json({
      message: "Book created successfully",
      bookId: result.lastID
    });
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
});

/**
 * 4. PUT /books/:bookId/
 * Update an existing book's details
 */
app.put("/books/:bookId/", async (request, response) => {
  try {
    const { bookId } = request.params;

    // Verify book existence first
    const checkBookQuery = `SELECT * FROM book WHERE id = ?;`;
    const existingBook = await db.get(checkBookQuery, [bookId]);
    if (!existingBook) {
      return response.status(404).json({ message: `Book with ID ${bookId} not found` });
    }

    // Validate body payload
    const validationError = validateBookPayload(request.body);
    if (validationError) {
      return response.status(400).json({ message: validationError });
    }

    const { title, author, price, pages } = request.body;

    const updateBookQuery = `
      UPDATE book
      SET
        title = ?,
        author = ?,
        price = ?,
        pages = ?
      WHERE id = ?;
    `;

    await db.run(updateBookQuery, [
      title.trim(),
      author.trim(),
      price,
      pages,
      bookId
    ]);

    response.status(200).json({
      message: "Book updated successfully"
    });
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
});

/**
 * 5. DELETE /books/:bookId/
 * Remove a book by ID
 */
app.delete("/books/:bookId/", async (request, response) => {
  try {
    const { bookId } = request.params;

    // Verify book existence first
    const checkBookQuery = `SELECT * FROM book WHERE id = ?;`;
    const existingBook = await db.get(checkBookQuery, [bookId]);
    if (!existingBook) {
      return response.status(404).json({ message: `Book with ID ${bookId} not found` });
    }

    const deleteBookQuery = `DELETE FROM book WHERE id = ?;`;
    await db.run(deleteBookQuery, [bookId]);

    response.status(200).json({
      message: "Book deleted successfully"
    });
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
});

// Start the server
initializeDBAndServer();

module.exports = app;
