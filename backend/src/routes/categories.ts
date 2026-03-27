import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/index.js';
import { categories } from '../db/schema.js';

export const categoriesRouter = Router();

const createCategorySchema = z.object({
    name: z.string().min(1),
    type: z.enum(['income', 'expense', 'obligation']),
    parentId: z.number().int().positive().optional(),
});

// GET /api/categories
categoriesRouter.get('/', async (_req, res) => {
    try {
        const rows = await db.select().from(categories);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// POST /api/categories
categoriesRouter.post('/', async (req, res) => {
    const parsed = createCategorySchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
    }

    try {
        const [category] = await db.insert(categories).values(parsed.data).returning();
        res.status(201).json(category);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create category' });
    }
});
