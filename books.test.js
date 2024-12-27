process.env.NODE_ENV = "test";
const request = require("supertest");
const app = require("./app.js");
const db = require("./db.js");

beforeEach(async () => {
  await db.query("DELETE FROM books");

  await db.query(`
  INSERT INTO books (isbn, amazon_url, author, language, pages, publisher, title, year) 
  VALUES 
  ('9781451648539', 'https://www.amazon.com/dp/1451648537', 'Walter Isaacson', 'english', 656, 'Simon & Schuster', 'Steve Jobs', 2011)
  `);

  await db.query(`
  INSERT INTO books (isbn, amazon_url, author, language, pages, publisher, title, year) 
  VALUES 
  ('9780307465351', 'https://www.amazon.com/dp/0307465357', 'Chris Guillebeau', 'english', 304, 'Crown Business', 'The $100 Startup: Reinvent the Way You Make a Living, Do What You Love, and Create a New Future', 2012);
  `);
});

afterAll(async () => {
  await db.end();
});

describe("GET /books", () => {
  test("Gets a list of all books", async () => {
    const res = await request(app).get("/books");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      books: [
        {
            "isbn": "9781451648539",
            "amazon_url": "https://www.amazon.com/dp/1451648537",
            "author": "Walter Isaacson",
            "language": "english",
            "pages": 656,
            "publisher": "Simon & Schuster",
            "title": "Steve Jobs",
            "year": 2011
        },
        {
            "isbn": "9780307465351",
            "amazon_url": "https://www.amazon.com/dp/0307465357",
            "author": "Chris Guillebeau",
            "language": "english",
            "pages": 304,
            "publisher": "Crown Business",
            "title": "The $100 Startup: Reinvent the Way You Make a Living, Do What You Love, and Create a New Future",
            "year": 2012
        }
    ]
    });
  });
});

describe("GET /books/:id", () => {
  test("Gets a book by id(isbn)", async () => {
    const res = await request(app).get("/books/9781451648539");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      book: 
        {
            "isbn": "9781451648539",
            "amazon_url": "https://www.amazon.com/dp/1451648537",
            "author": "Walter Isaacson",
            "language": "english",
            "pages": 656,
            "publisher": "Simon & Schuster",
            "title": "Steve Jobs",
            "year": 2011
        }
    });
  });
  test("returns 404 for invalid id", async () => {
    const invalidId = 97814548539;
    const res = await request(app).get(`/books/${invalidId}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.error.message).toEqual(
      `There is no book with an isbn '${invalidId}`
    );
  });
});


describe("POST /books", () => {
  test("Creates a new book and returns book data", async () => {
    const newBook = {
      isbn: '9780143127741',
      amazon_url: 'https://www.amazon.com/dp/0143127748',
      author: 'Atul Gawande',
      language: 'english',
      pages: 304,
      publisher: 'Metropolitan Books',
      title: 'Being Mortal: Medicine and What Matters in the End',
      year: 2014
    };
    const res = (await request(app).post("/books").send(newBook));
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      book: 
      {
        isbn: '9780143127741',
        amazon_url: 'https://www.amazon.com/dp/0143127748',
        author: 'Atul Gawande',
        language: 'english',
        pages: 304,
        publisher: 'Metropolitan Books',
        title: 'Being Mortal: Medicine and What Matters in the End',
        year: 2014
      }
    });
  });
  test("returns 400 and list of errors for invalid data", async () => {
    const invalidBook = {
      isbn: '9780143127741',
      amazon_url: 890,
      author: 'Atul Gawande',
      language: 'english',
      pages:'304',
      publisher: 'Metropolitan Books',
      title: 'Being Mortal: Medicine and What Matters in the End',
      year: 2014
    };
    const res = (await request(app).post("/books").send(invalidBook));
    expect(res.statusCode).toBe(400);
    expect(res.body.error.message).toEqual(
      [
        'instance.amazon_url is not of a type(s) string',
        'instance.pages is not of a type(s) integer'
      ]
    );
  });
});

describe("PUT /books/:id", () => {
  test("Updates a book and returns book data", async () => {
    const newBookData = {
      "isbn": "9781451648539",
      "amazon_url": "https://www.amazon.com/dp/1451648537",
      "author": "Walter Isaacson",
      "language": "english",
      "pages": 500,
      "publisher": "Simon & Schuster",
      "title": "Steve Jobs",
      "year": 2000
  };
    const res = (await request(app).put("/books/9781451648539").send(newBookData));
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      book:  
        {
            "isbn": "9781451648539",
            "amazon_url": "https://www.amazon.com/dp/1451648537",
            "author": "Walter Isaacson",
            "language": "english",
            "pages": 500,
            "publisher": "Simon & Schuster",
            "title": "Steve Jobs",
            "year": 2000
        }
    });
  });
  test("returns 400 and list of errors for invalid data", async () => {
    const invalidBookData = {
      "pages": 500,
      "publisher": 90,
      "title": "Steve Jobs",
      "year": 2000
  };
    const res = (await request(app).put("/books/9781451648539").send(invalidBookData));
    expect(res.statusCode).toBe(400);
    console.log(res.body)
    expect(res.body.error.message).toEqual([
      'instance requires property "isbn"',
      'instance requires property "amazon_url"',
      'instance requires property "author"',
      'instance requires property "language"',
      'instance.publisher is not of a type(s) string'
    ]);
  });
});

describe("DELETE /books/:isbn", () => {
  test("Deletes a book and returns deleted message", async () => {
    const res = (await request(app).delete("/books/9781451648539"));
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ message: "Book deleted" });
  });
  test("returns 404 for invalid isbn", async () => {
    const res = (await request(app).delete("/books/9781458539"));
    expect(res.statusCode).toBe(404);
    expect(res.body.error.message).toEqual(`There is no book with an isbn 9781458539`);
  });
});