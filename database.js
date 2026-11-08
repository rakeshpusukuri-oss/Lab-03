const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const dbPath = path.join(__dirname, "books.db");

const seedBooks = [
  { title: "Clean Code", author: "Robert C. Martin", price: 650, pages: 464 },
  { title: "The Pragmatic Programmer", author: "Andrew Hunt & David Thomas", price: 720, pages: 352 },
  { title: "Design Patterns", author: "Erich Gamma et al.", price: 850, pages: 395 },
  { title: "You Don't Know JS Yet", author: "Kyle Simpson", price: 450, pages: 280 },
  { title: "JavaScript: The Good Parts", author: "Douglas Crockford", price: 380, pages: 176 },
  { title: "Introduction to Algorithms", author: "Thomas H. Cormen", price: 1200, pages: 1312 },
  { title: "Refactoring", author: "Martin Fowler", price: 790, pages: 448 },
  { title: "Database System Concepts", author: "Abraham Silberschatz", price: 950, pages: 1376 },
  { title: "Designing Data-Intensive Applications", author: "Martin Kleppmann", price: 1100, pages: 616 },
  { title: "Site Reliability Engineering", author: "Betsy Beyer et al.", price: 880, pages: 550 }
];

async function initializeDatabase() {
  let db = null;
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    console.log("Connected to SQLite database at:", dbPath);

    // Create table if not exists (Note: table is singular 'book')
    await db.exec(`
      CREATE TABLE IF NOT EXISTS book (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        price INTEGER NOT NULL,
        pages INTEGER NOT NULL
      );
    `);
    console.log("Table 'book' verified/created.");

    // Check count
    const countResult = await db.get("SELECT COUNT(*) AS count FROM book;");
    if (countResult.count === 0) {
      console.log("Seeding initial 10 books...");
      const insertQuery = `
        INSERT INTO book (title, author, price, pages)
        VALUES (?, ?, ?, ?);
      `;

      for (const b of seedBooks) {
        await db.run(insertQuery, [b.title, b.author, b.price, b.pages]);
      }
      console.log("Seeding complete: 10 books inserted.");
    } else {
      console.log(`Database contains ${countResult.count} books. Seeding skipped.`);
    }

    const books = await db.all("SELECT * FROM book;");
    console.table(books);

    return db;
  } catch (error) {
    console.error("Database initialization failed:", error.message);
    throw error;
  }
}

// Run standalone if executed directly
if (require.main === module) {
  initializeDatabase().then((db) => {
    db.close();
  });
}

module.exports = { initializeDatabase, dbPath };
