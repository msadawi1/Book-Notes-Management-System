import express from "express";
import bodyParser from "body-parser";
import 'dotenv/config';
import { getAllBooks, getBook, addBook, editBookRating, editBookReview, deleteBook } from "./models/bookModel.js";
import { getNotesByBook, addNote, editNoteContent, deleteNote } from "./models/noteModel.js";

const app = express();
const port = 4500;

app.use(express.static("public"));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 1. GET all books
app.get("/books", async (req, res) => {
    const result = await getAllBooks();
    res.status(200).json(result);
});

// 2. GET a book by ID
app.get("/books/:id", async (req, res) => {
    const result = await getBook(req.params.id);
    res.status(200).json(result);
});

// 3. GET all notes by a book ID
app.get("/books/:id/notes", async (req, res) => {
    const id = req.params.id;
    try {
        const book = await getBook(id);
        if (!book) {
            return res.status(404).json({ error: `Book with id ${id} not found.` });
        }
        const notes = await getNotesByBook(id);
        return res.status(200).json(notes);
    } catch (err) {
        console.error("Error getting notes by book: ", err.stack);
        return res.status(500).json({ error: "Internal server error." });
    }
});

// 4. POST a new book
app.post("/books/new", async (req, res) => {
    // transfer this to the search field and pass publishedDate as a hidden input
    // try {
    //     const response = await axios.get(API_URL, {
    //         params: {
    //             q: `intitle:${req.body['title']}`,
    //             key: process.env.API_KEY,
    //         }
    //     });
    //     var publish_year = parseInt(response.data['items'][0]['volumeInfo']['publishedDate'].split('-')[0]);
    // } catch (err) {
    //     console.error(err.stack);
    //     res.status(500).json({ error: "Google Books API server error." })
    // }
    try {
        console.log(req.body);
        let rating = req.body['rating'];
        if (parseInt(rating) >= 10) {
            rating = 9.9;
        }
        const response = await addBook(
            req.body['title'], req.body['author'], req.body['isbn'], req.body['publish_year'],
            req.body['description'], req.body['review'], rating, req.body['cover_url']
        );
        res.status(200).json(response);
    } catch (err) {
        console.error(err.stack)
        res.status(500).json({ error: "Internal server error." })
    }
});

// 5. POST a new note
app.post("/books/:id/notes", async (req, res) => {
    try {
        const response = await addNote(req.body['content'], req.body['page_number'], req.params['id']);
        res.status(200).json(response);
    } catch (err) {
        console.error(err.stack)
        res.status(500).json({ error: "Internal server error." })
    }
});

// 6. UPDATE a book
app.patch("/books/:id", async (req, res) => {
    try {
        let new_rating = req.body['rating'];
        if (parseInt(new_rating) >= 10) {
            new_rating = '9.9';
        }
        const new_review = req.body['review'];
        const id = req.params['id'];
        let response = await editBookRating(id, new_rating)
        if (!response) 
            return res.status(404).json({ error: `No book found with id ${id}. No books were modified.` });
        await editBookReview(id, new_review);
        res.status(200).json(response);
    } catch (err) {
        console.error(err.stack)
        res.status(500).json({ error: 'Internal server error.' })
    }
});

// 7. UPDATE a note
app.patch("/notes/:note_id", async (req, res) => {
    const id = req.params['note_id'];
    try {
        const response = await editNoteContent(id, req.body['content']);
        if(!response)
            return res.status(404).json({ error: `No note found with id ${id}. No notes were modified.` });
        res.status(200).json(response);
    } catch (err) {
        console.error(err.stack)
        res.status(500).json({ error: 'Internal server error.' })
    }
});

// 8. DELETE a book
app.delete("/books/:id", async (req, res) => {
    const id = req.params['id'];
    try {
        const response = await deleteBook(id);
        if (!response)
            return res.status(404).json({ error: `No book found with ID ${id}. No books were deleted.` });
        res.sendStatus(200);
    } catch (err) {
        console.error(err.stack)
        res.status(500).json({ error: 'Internal server error.' })
    }
});

// 9. DELETE a note
app.delete("/notes/:note_id", async (req, res) => {
    const id = req.params['note_id'];
    try {
        const response = await deleteNote(id);
        if (!response)
            return res.status(404).json({ error: `No note found with ID ${id}. No notes were deleted.` });
        res.sendStatus(200);
    } catch (err) {
        console.error(err.stack)
        res.status(500).json({ error: 'Internal server error.' })
    }
});


app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
