import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/index.js';
import { transactions } from '../db/schema.js';
import { eq, and, gte, lte } from 'drizzle-orm';

export const transactionsRouter = Router();

const createTransactionSchema = z.object({
    accountId: z.number().int().positive(),
    categoryId: z.number().int().positive().optional(),
    amount: z.string().regex(/^\d+(\.\d{1,2})?$/), // numeric as string
    type: z.enum(['income', 'expense', 'obligation']),
    currency: z.string().min(1).max(10).default('PLN'),
    description: z.string().optional(),
    date: z.string().datetime().optional(), // ISO string
});

const updateTransactionSchema = createTransactionSchema.partial();

// GET /api/transactions
transactionsRouter.get('/', async (req, res) => {
    const { accountId, categoryId, type, from, to } = req.query;

    try {
        const filters = [];
        if (accountId) filters.push(eq(transactions.accountId, Number(accountId)));
        if (categoryId) filters.push(eq(transactions.categoryId, Number(categoryId)));
        if (type) filters.push(eq(transactions.type, type as any));
        if (from) filters.push(gte(transactions.date, new Date(from as string)));
        if (to) filters.push(lte(transactions.date, new Date(to as string)));

        const rows = await db
            .select()
            .from(transactions)
            .where(filters.length > 0 ? and(...filters) : undefined);

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

// GET /api/transactions/:id
transactionsRouter.get('/:id', async (req, res) => {
    try {
        const [row] = await db
            .select()
            .from(transactions)
            .where(eq(transactions.id, Number(req.params.id)));

        if (!row) {
            res.status(404).json({ error: 'Transaction not found' });
            return;
        }
        res.json(row);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch transaction' });
    }
});

// POST /api/transactions
transactionsRouter.post('/', async (req, res) => {
    const parsed = createTransactionSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
    }

    try {
        const data = {
            ...parsed.data,
            date: parsed.data.date ? new Date(parsed.data.date) : new Date(),
        };
        const [row] = await db.insert(transactions).values(data).returning();
        res.status(201).json(row);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create transaction' });
    }
});

// PUT /api/transactions/:id
transactionsRouter.put('/:id', async (req, res) => {
    const parsed = updateTransactionSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
    }

    try {
        const data: any = { ...parsed.data };
        if (data.date) data.date = new Date(data.date);
        data.updatedAt = new Date();

        const [row] = await db
            .update(transactions)
            .set(data)
            .where(eq(transactions.id, Number(req.params.id)))
            .returning();

        if (!row) {
            res.status(404).json({ error: 'Transaction not found' });
            return;
        }
        res.json(row);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update transaction' });
    }
});

// DELETE /api/transactions/:id
transactionsRouter.delete('/:id', async (req, res) => {
    try {
        const [row] = await db
            .delete(transactions)
            .where(eq(transactions.id, Number(req.params.id)))
            .returning();

        if (!row) {
            res.status(404).json({ error: 'Transaction not found' });
            return;
        }
        res.json({ message: 'Transaction deleted', id: row.id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete transaction' });
    }
});
