import db from "../db.js";

export async function getAllBooks() {
    const result = await db.query("SELECT * FROM book ORDER BY updated_at DESC");
    return result.rows;
}

export async function getBook(id) {
    const result = await db.query("SELECT * FROM book WHERE id=$1", [id]);
    return result.rows[0];
}

export async function addBook(title, author, isbn, publish_year, description, review, rating, cover_url) {
    const result = await db.query(`
        INSERT INTO book
        (title, author, isbn, publish_year, description, review, rating, cover_url, created_at, updated_at)
        VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()) RETURNING *`,
        [title, author, isbn, publish_year, description, review, rating, cover_url]);
    return result.rows[0];
}

export async function editBookReview(id, new_review) {
    const result = await db.query(`
        UPDATE book
        SET review=$1, updated_at=NOW()
        WHERE id=$2
        RETURNING *`, [new_review, id]);
    return result.rows[0];
}

export async function editBookRating(id, new_rating) {
    const result = await db.query(`
        UPDATE book
        SET rating=$1, updated_at=NOW()
        WHERE id=$2
        RETURNING *`, [parseFloat(new_rating), id]);
    return result.rows[0];
}

export async function deleteBook(id) {
    const result = await db.query("DELETE FROM book WHERE id=$1", [id]);
    return result.rowCount;
}
