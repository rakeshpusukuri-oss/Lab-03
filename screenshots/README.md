# Screenshots Directory - Lab 3

Place your Postman test output screenshots in this directory with the following filenames:

1. `01_get_all_books.png`: `GET /books/` (Default query, returns 10 books)
2. `02_get_search_query.png`: `GET /books/?search_q=code` (Substring match with LIKE)
3. `03_get_price_filter.png`: `GET /books/?min_price=600&max_price=800` (Price range filter)
4. `04_get_sort_desc.png`: `GET /books/?order_by=price&order=DESC` (Sorting by price descending)
5. `05_get_pagination.png`: `GET /books/?limit=3&offset=3` (Pagination page 2)
6. `06_get_invalid_param_400.png`: `GET /books/?order_by=invalid` (HTTP 400 Bad Request error)
7. `07_get_book_by_id.png`: `GET /books/1/` (Single book details)
8. `08_get_not_found_404.png`: `GET /books/9999/` (HTTP 404 Not Found error)
9. `09_post_create_201.png`: `POST /books/` (Valid book creation, HTTP 201 Created)
10. `10_post_validation_error_400.png`: `POST /books/` (Missing field or non-numeric price, HTTP 400 Bad Request)
11. `11_put_update_200.png`: `PUT /books/:bookId/` (Successful book update, HTTP 200 OK)
12. `12_delete_book_200.png`: `DELETE /books/:bookId/` (Successful deletion, HTTP 200 OK)
