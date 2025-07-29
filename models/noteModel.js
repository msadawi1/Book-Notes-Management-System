import db from "../db.js";

export async function getNotesByBook(book_id) {
    const result = await db.query("SELECT * FROM note WHERE book_id=$1 ORDER BY created_at ASC", [book_id]);
    return result.rows;
}

export async function addNote(content, page_num, book_id) {
    const result = await db.query(`
        INSERT INTO note
        (content, page_number, created_at, book_id)
        VALUES
        ($1, $2, NOW(), $3) RETURNING *`,
        [content, page_num, book_id]);
    return result.rows[0];
}


export async function editNoteContent(id, content) {
    const result = await db.query(`
        UPDATE note
        SET content=$1
        WHERE id=$2 RETURNING *`, [content, id]);
    return result.rows[0];
}

export async function deleteNote(id) {
    const result = await db.query("DELETE FROM note WHERE id=$1", [id]);
    return result.rowCount;
}
