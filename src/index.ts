import express, { Request, Response } from 'express';
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

const PORT = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static('./src'));

app.post('/reflections', async (req: Request, res: Response) => {
    const { clientId, date, energyLevel, satisfaction, frictionCat, frictionNote } = req.body;
    try {
        await pool.query(
            'INSERT INTO reflections ("clientId", "date", "energyLevel", "satisfaction", "frictionCat", "frictionNote") VALUES ($1, $2, $3, $4, $5, $6)',
            [clientId, date, energyLevel, satisfaction, frictionCat, frictionNote]
        );
        res.send({ message: "Success" });
    } catch (err: any) {
        console.error("Database Error:", err.message);
        res.status(500).send(err.message);
    }
});

// 1. Get all data from the database
app.get('/all', async (req: Request, res: Response) => {
    try {
        // Updated to use "date" to match your expected table structure
        const result = await pool.query('SELECT * FROM reflections ORDER BY "date" DESC');
        res.json(result.rows);
    } catch (err: any) {
        console.error("Database Error:", err.message);
        res.status(500).send(err.message);
    }
});

// 2. Update notes route (SQL Update)
app.post('/update-notes', async (req: Request, res: Response) => {
    const { clientId, notes } = req.body;
    try {
        await pool.query(
            'UPDATE reflections SET "coachNotes" = $1 WHERE LOWER(TRIM("clientId")) = LOWER(TRIM($2))',
            [notes, clientId]
        );
        res.send({ message: "Success" });
    } catch (err: any) {
        res.status(500).send(err.message);
    }
});

// 3. Delete client route (SQL Delete)
app.delete('/delete/:name', async (req: Request, res: Response) => {
    const nameToDelete = req.params.name.toLowerCase().trim();
    try {
        await pool.query(
            'DELETE FROM reflections WHERE LOWER(TRIM("clientId")) = $1',
            [nameToDelete]
        );
        res.send({ message: "Success" });
    } catch (err: any) {
        res.status(500).send(err.message);
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));