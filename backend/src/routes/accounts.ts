import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/index.js';
import { accounts } from '../db/schema.js';

export const accountsRouter = Router();

const createAccountSchema = z.object({
    name: z.string().min(1),
    type: z.enum(['bank', 'cash', 'crypto', 'fund', 'insurance', 'other']),
    currency: z.string().min(1).max(10).default('PLN'),
    institution: z.string().optional(),
    description: z.string().optional(),
});

// GET /api/accounts
accountsRouter.get('/', async (_req, res) => {
    try {
        const rows = await db.select().from(accounts);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch accounts' });
    }
});

// POST /api/accounts
accountsRouter.post('/', async (req, res) => {
    const parsed = createAccountSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
    }

    try {
        const [account] = await db.insert(accounts).values(parsed.data).returning();
        res.status(201).json(account);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create account' });
    }
});
