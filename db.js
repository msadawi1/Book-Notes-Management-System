import pg from "pg";
import "dotenv/config";

const db = new pg.Client({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: "localhost",
    port: 5432,
});

db.connect();
export default db;