import express, { Request, Response } from 'express';
const cors = require('cors');
const { Pool } = require('pg');
const Redis = require('ioredis');

const app = express();

// Railway-specific Redis connection string with IPv6 support (?family=0)
const redisUrl = process.env.REDIS_URL ? `${process.env.REDIS_URL}?family=0` : 'redis://localhost:6379';
const redis = new Redis(redisUrl);

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
    const { clientId, date, energyLevel, satisfaction, frictionCat, frictionNote, wins } = req.body;
    try {
        // 1. Permanent Storage in Postgres
        await pool.query(
            'INSERT INTO reflections ("clientId", "date", "energyLevel", "satisfaction", "frictionCat", "frictionNote", "wins") VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [clientId, date, energyLevel, satisfaction, frictionCat, frictionNote, wins]
        );

        // 2. Real-time "Last Seen" Ping in Redis
        // We normalize the key to lowercase to avoid "Adam" vs "adam" issues
        await redis.set(`last_seen:${clientId.toLowerCase().trim()}`, Date.now());

        res.send({ message: "Success" });
    } catch (err: any) {
        console.error("Database/Redis Error:", err.message);
        res.status(500).send(err.message);
    }
});

app.get('/all', async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT * FROM reflections ORDER BY "date" DESC');
        const rows = result.rows;

        // 3. Attach the Redis "Last Seen" data to each record
        const reflectionsWithLiveStatus = await Promise.all(rows.map(async (row: any) => {
            const lastSeen = await redis.get(`last_seen:${row.clientId.toLowerCase().trim()}`);
            return { 
                ...row, 
                lastSeen: lastSeen ? parseInt(lastSeen) : null 
            };
        }));

        res.json(reflectionsWithLiveStatus);
    } catch (err: any) {
        console.error("Database/Redis Error:", err.message);
        res.status(500).send(err.message);
    }
});

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

app.delete('/delete/:name', async (req: Request, res: Response) => {
    const nameToDelete = req.params.name.toLowerCase().trim();
    try {
        // Clean up Postgres
        await pool.query(
            'DELETE FROM reflections WHERE LOWER(TRIM("clientId")) = $1',
            [nameToDelete]
        );
        // Clean up Redis too so the "Last Seen" doesn't linger
        await redis.del(`last_seen:${nameToDelete}`);

        res.send({ message: "Success" });
    } catch (err: any) {
        res.status(500).send(err.message);
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));