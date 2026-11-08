// Automated end-to-end test runner for Lab 3
// Tests search, filter, sort, pagination, validation, 400/404 handling, and CRUD

async function runAllTests() {
  const app = require("./app");
  
  // Wait 1.5s for database connection and server to bind
  await new Promise((r) => setTimeout(r, 1500));

  const BASE_URL = "http://127.0.0.1:3000";

  console.log("=================================================================");
  console.log("   Lab 3: REST API Query Params, Validation & Debugging Tests   ");
  console.log("=================================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
    }
  }

  try {
    // 1. GET /books/ (Defaults)
    console.log("--> 1. Testing GET /books/ (Default query parameters)");
    const r1 = await fetch(`${BASE_URL}/books/`);
    const d1 = await r1.json();
    assert(r1.status === 200, "Status is 200 OK");
    assert(Array.isArray(d1) && d1.length === 10, "Returns all 10 books by default");
    console.log(`Retrieved ${d1.length} books.\n`);

    // 2. GET /books/?search_q=code (Search query)
    console.log("--> 2. Testing GET /books/?search_q=code (Partial title search with LIKE)");
    const r2 = await fetch(`${BASE_URL}/books/?search_q=code`);
    const d2 = await r2.json();
    assert(r2.status === 200, "Status is 200 OK");
    assert(d2.length >= 1 && d2.some((b) => b.title.toLowerCase().includes("code")), "Matches title containing 'code'");
    console.log(`Found ${d2.length} matching book(s): "${d2.map((b) => b.title).join(", ")}"\n`);

    // 3. GET /books/?min_price=600&max_price=800 (Price filter)
    console.log("--> 3. Testing GET /books/?min_price=600&max_price=800 (Price range filter)");
    const r3 = await fetch(`${BASE_URL}/books/?min_price=600&max_price=800`);
    const d3 = await r3.json();
    assert(r3.status === 200, "Status is 200 OK");
    assert(d3.every((b) => b.price >= 600 && b.price <= 800), "All returned books are between 600 and 800");
    console.log(`Books in range 600-800: ${d3.map((b) => `${b.title} ($${b.price})`).join("; ")}\n`);

    // 4. GET /books/?order_by=price&order=DESC (Sorting)
    console.log("--> 4. Testing GET /books/?order_by=price&order=DESC (Multi-column sorting)");
    const r4 = await fetch(`${BASE_URL}/books/?order_by=price&order=DESC`);
    const d4 = await r4.json();
    assert(r4.status === 200, "Status is 200 OK");
    assert(d4[0].price >= d4[1].price && d4[1].price >= d4[2].price, "Prices are in descending order");
    console.log(`Top 3 highest priced books: ${d4.slice(0, 3).map((b) => `${b.title} ($${b.price})`).join(", ")}\n`);

    // 5. GET /books/?limit=3&offset=3 (Pagination)
    console.log("--> 5. Testing GET /books/?limit=3&offset=3 (Pagination)");
    const r5 = await fetch(`${BASE_URL}/books/?limit=3&offset=3`);
    const d5 = await r5.json();
    assert(r5.status === 200, "Status is 200 OK");
    assert(d5.length === 3, "Returned exactly 3 books for page 2");
    assert(d5[0].id === 4, "Starts from offset index (ID 4)");
    console.log(`Page 2 books (IDs ${d5.map((b) => b.id).join(", ")}): ${d5.map((b) => b.title).join(", ")}\n`);

    // 6. Edge Case: Invalid order_by column (Security whitelist rejection)
    console.log("--> 6. Testing GET /books/?order_by=hacked_column (Invalid sort column)");
    const r6 = await fetch(`${BASE_URL}/books/?order_by=hacked_column`);
    const d6 = await r6.json();
    assert(r6.status === 400, "Rejects unwhitelisted sort column with 400 Bad Request");
    assert(d6.message && d6.message.includes("Invalid order_by"), "Clear error message returned");
    console.log(`Response: ${JSON.stringify(d6)}\n`);

    // 7. Edge Case: Invalid price range (min > max)
    console.log("--> 7. Testing GET /books/?min_price=1000&max_price=500 (min > max)");
    const r7 = await fetch(`${BASE_URL}/books/?min_price=1000&max_price=500`);
    const d7 = await r7.json();
    assert(r7.status === 400, "Rejects inverted price range with 400 Bad Request");
    console.log(`Response: ${JSON.stringify(d7)}\n`);

    // 8. GET /books/:bookId/ (Single book)
    console.log("--> 8. Testing GET /books/1/ (Single book lookup)");
    const r8 = await fetch(`${BASE_URL}/books/1/`);
    const d8 = await r8.json();
    assert(r8.status === 200, "Status is 200 OK");
    assert(d8.id === 1 && d8.title === "Clean Code", "Correct book object returned");
    console.log(`Found: ${d8.title} by ${d8.author}\n`);

    // 9. GET /books/9999/ (Non-existent book 404 check)
    console.log("--> 9. Testing GET /books/9999/ (Non-existent book 404 check)");
    const r9 = await fetch(`${BASE_URL}/books/9999/`);
    const d9 = await r9.json();
    assert(r9.status === 404, "Returns 404 Not Found for non-existent ID");
    assert(d9.message && d9.message.includes("not found"), "Standardized error message returned");
    console.log(`Response: ${JSON.stringify(d9)}\n`);

    // 10. POST /books/ with missing field (Validation failure)
    console.log("--> 10. Testing POST /books/ with missing author (Validation test)");
    const r10 = await fetch(`${BASE_URL}/books/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Incomplete Book", price: 500, pages: 200 })
    });
    const d10 = await r10.json();
    assert(r10.status === 400, "Rejects missing author with 400 Bad Request");
    assert(d10.message.includes("author"), "Error specifies missing author");
    console.log(`Response: ${JSON.stringify(d10)}\n`);

    // 11. POST /books/ with non-numeric price (Validation failure)
    console.log("--> 11. Testing POST /books/ with string price 'free' (Non-numeric validation)");
    const r11 = await fetch(`${BASE_URL}/books/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Test Book",
        author: "Test Author",
        price: "free",
        pages: 200
      })
    });
    const d11 = await r11.json();
    assert(r11.status === 400, "Rejects non-numeric price with 400 Bad Request");
    assert(d11.message.includes("price must be a positive number"), "Error specifies price validation failure");
    console.log(`Response: ${JSON.stringify(d11)}\n`);

    // 12. POST /books/ (Valid book creation)
    console.log("--> 12. Testing POST /books/ (Valid book creation)");
    const newBookPayload = {
      title: "Clean Architecture",
      author: "Robert C. Martin",
      price: 680,
      pages: 432
    };
    const r12 = await fetch(`${BASE_URL}/books/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newBookPayload)
    });
    const d12 = await r12.json();
    assert(r12.status === 201, "Returns 201 Created for valid book");
    assert(d12.bookId !== undefined, "Returns generated bookId");
    const createdId = d12.bookId;
    console.log(`Created new book ID: ${createdId}\n`);

    // 13. PUT /books/:bookId/ (Valid update)
    console.log(`--> 13. Testing PUT /books/${createdId}/ (Valid update)`);
    const updatePayload = {
      title: "Clean Architecture: A Craftsman's Guide",
      author: "Robert C. Martin",
      price: 750,
      pages: 432
    };
    const r13 = await fetch(`${BASE_URL}/books/${createdId}/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatePayload)
    });
    const d13 = await r13.json();
    assert(r13.status === 200, "Returns 200 OK after update");
    assert(d13.message === "Book updated successfully", "Standardized confirmation message returned");
    console.log(`Response: ${JSON.stringify(d13)}\n`);

    // 14. PUT /books/9999/ (Update non-existent book)
    console.log("--> 14. Testing PUT /books/9999/ (Update non-existent book)");
    const r14 = await fetch(`${BASE_URL}/books/9999/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatePayload)
    });
    const d14 = await r14.json();
    assert(r14.status === 404, "Returns 404 Not Found for invalid PUT ID");
    console.log(`Response: ${JSON.stringify(d14)}\n`);

    // 15. DELETE /books/:bookId/ (Valid delete)
    console.log(`--> 15. Testing DELETE /books/${createdId}/ (Valid delete)`);
    const r15 = await fetch(`${BASE_URL}/books/${createdId}/`, {
      method: "DELETE"
    });
    const d15 = await r15.json();
    assert(r15.status === 200, "Returns 200 OK after delete");
    assert(d15.message === "Book deleted successfully", "Standardized delete confirmation returned");
    console.log(`Response: ${JSON.stringify(d15)}\n`);

    // 16. DELETE /books/9999/ (Delete non-existent book)
    console.log("--> 16. Testing DELETE /books/9999/ (Delete non-existent book)");
    const r16 = await fetch(`${BASE_URL}/books/9999/`, {
      method: "DELETE"
    });
    const d16 = await r16.json();
    assert(r16.status === 404, "Returns 404 Not Found for invalid DELETE ID");
    console.log(`Response: ${JSON.stringify(d16)}\n`);

    // 17. Verify record is gone
    console.log(`--> 17. Verifying GET /books/${createdId}/ after DELETE`);
    const r17 = await fetch(`${BASE_URL}/books/${createdId}/`);
    assert(r17.status === 404, "Confirmed deleted book returns 404 Not Found");
    console.log();

    console.log("=================================================================");
    console.log(`   ALL TESTS COMPLETED: ${passed}/${total} ASSERTIONS PASSED!    `);
    console.log("=================================================================");
    process.exit(0);
  } catch (error) {
    console.error("Test execution failed:", error);
    process.exit(1);
  }
}

runAllTests();
