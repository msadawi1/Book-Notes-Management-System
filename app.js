import express from "express";
import axios from 'axios';
import bodyParser from "body-parser";
import 'dotenv/config';

const app = express();
const port = 3000;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

// Homepage
app.get("/", async (req, res) => {
    try {
        const response = await axios.get('http://localhost:4500/books');
        const books = response.data;

        const bookDataList = [];

        for (const book of books) {
            const createdAtUTC = new Date(book.created_at); // UTC timestamp from server
            const createdAtLocalTime = createdAtUTC.toLocaleString(); // Converts to client's local timezone
            const updatedAtUTC = new Date(book.updated_at); // UTC timestamp from server
            const updatedATLocalTime = updatedAtUTC.toLocaleString(); // Converts to client's local timezone

            book.created_at = createdAtLocalTime;
            book.updated_at = updatedATLocalTime;
            bookDataList.push({
                id: book.id,
                title: book.title,
                rating: book.rating,
                last_edited: book.updated_at.split(",")[0],
                cover_url: book.cover_url
            });
        }
        res.render("index.ejs", { books: bookDataList });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

// New Book page
app.get("/add", (req, res) => {
    res.render("create.ejs");
});
// Add new book
app.post("/add", async (req, res) => {
    try {
        const resp = await axios.get(`https://www.googleapis.com/books/v1/volumes`, {
                params: { q: `isbn:${req.body['isbn']}` }
            });
        const data = resp.data.items[0].volumeInfo;
        const authors = data.authors.join(' & ');
        const publish_year = data['publishedDate'].split('-')[0];
        const thumbnail = data['imageLinks']['thumbnail'];
        const response = await axios.post('http://localhost:4500/books/new', {
            title: req.body['title'],
            isbn: req.body['isbn'],
            description: req.body['description'],
            review: req.body['review'],
            rating: req.body['rating'],
            author: authors,
            publish_year: publish_year,
            cover_url: thumbnail
        });
        if (response.status === 200)
            return res.redirect(`/books/${response.data.id}`);
        else
            return res.render("create.ejs", { error: response.data.error });
    } catch (err) {
        console.error(err.stack);
        let errorMsg = "An unexpected error occurred.";
        if (err.response && err.response.data?.error) {
            errorMsg = err.response.data.error;
        }
        return res.render("create.ejs", { error: errorMsg });
    }
});
// Book page
app.get("/books/:id", async (req, res) => {
    const id = req.params.id;
    const response = await axios.get(`http://localhost:4500/books/${id}`);
    const book = response.data;
    const resp = await axios.get(`http://localhost:4500/books/${id}/notes`);
    const notes = resp.data;

    const createdAtUTC = new Date(book.created_at); // UTC timestamp from server
    const createdAtLocalTime = createdAtUTC.toLocaleString(); // Converts to client's local timezone
    const updatedAtUTC = new Date(book.updated_at); // UTC timestamp from server
    const updatedATLocalTime = updatedAtUTC.toLocaleString(); // Converts to client's local timezone

    book.created_at = createdAtLocalTime;
    book.updated_at = updatedATLocalTime;
    res.render("book.ejs", { 
        book: book,
        notes: notes,
     });
});
// Edit book route
app.post("/books/:id", async (req, res) => {
    const id = req.params.id;
    const new_review = req.body['review'];
    const new_rating = req.body['rating'];
    await axios.patch(`http://localhost:4500/books/${id}`, {
        rating: new_rating,
        review: new_review
    });
    res.redirect(`/books/${id}`);
});
// Delete book
app.get("/books/delete/:id", async (req, res) => {
    const id = req.params.id;
    try {
        const response = await axios.delete(`http://localhost:4500/books/${id}`);
    } catch (error) {
        if (error.response) {
            console.log(`Error ${error.response.status}: ${error.response.data?.error || "Unknown error"}`);
        } else if (error.request) {
            console.log("No response from API:", error.request);
        } else {
            console.log("Error:", error.message);
        }
    }
    res.redirect("/");
});
// Delete a note
app.get("/books/:id/notes/:note_id/delete", async (req, res) => {
    const book_id = req.params.id;
    const note_id = req.params.note_id;
    try {
        const response = await axios.delete(`http://localhost:4500/notes/${note_id}`);
    } catch (error) {
        if (error.response) {
            console.log(`Error ${error.response.status}: ${error.response.data?.error || "Unknown error"}`);
        } else if (error.request) {
            console.log("No response from API:", error.request);
        } else {
            console.log("Error:", error.message);
        }
    }
    res.redirect(`/books/${book_id}#notes-section`); 
});
// Add a note
app.post("/books/:id/notes/new", async (req, res) => {
    const book_id = req.params.id;
    try {
        const response = await axios.post(`http://localhost:4500/books/${book_id}/notes`, {
            content: req.body['content'] || '',
            page_number: req.body['page-number'],
            id: book_id,
        });
    } catch (error) {
        if (error.response) {
            console.log(`Error ${error.response.status}: ${error.response.data?.error || "Unknown error"}`);
        } else if (error.request) {
            console.log("No response from API:", error.request);
        } else {
            console.log("Error:", error.message);
        }
    }
    res.redirect(`/books/${book_id}#notes-section`);
});
// Edit a note
app.post("/books/:id/notes/:note_id/edit", async (req, res) => {
    const book_id = req.params.id;
    const note_id = req.params.note_id;
    try {
        const response = await axios.patch(`http://localhost:4500/notes/${note_id}`, {
            content: req.body['content'] || ''
        });
    } catch (error) {
        if (error.response) {
            console.log(`Error ${error.response.status}: ${error.response.data?.error || "Unknown error"}`);
        } else if (error.request) {
            console.log("No response from API:", error.request);
        } else {
            console.log("Error:", error.message);
        }
    }
    res.redirect(`/books/${book_id}#notes-section`);
});
// New book form auto-fill
app.get("/search", async (req, res) => {
    let query = req.query['q'];
    if (query.length <= 0)
        return res.redirect("/add");
    // if query is a number
    if (!isNaN(query, 10))
        query = `isbn:${query}`;
    else
        query = `intitle:${query}`;
    const response = await axios.get(`https://www.googleapis.com/books/v1/volumes`, {
        params: {
            q: query,
        }
    });
    const book = response.data?.items?.[0]?.volumeInfo;
    
    if (!book) {
        return res.render("create.ejs", { search_error: "Book not found. Please enter a valid title/ISBN" })
    }
    const title = book.title;
    const description = book.description;
    const identifiers = book.industryIdentifiers || [];
    let isbn = identifiers.find(id => id.type === "ISBN_13")?.identifier
        || identifiers.find(id => id.type === "ISBN_10")?.identifier;
    if (!isbn)
        isbn = "Not found";
    res.render("create.ejs", {
        query: req.query['q'], 
        title: title,
        isbn: isbn,
        description: description
     });
});
// Handle any other route
app.use((req, res, next) => {
    res.redirect("/");
});


app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});