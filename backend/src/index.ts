import 'dotenv/config';
import express from 'express';
import { accountsRouter } from './routes/accounts.js';
import { categoriesRouter } from './routes/categories.js';
import { transactionsRouter } from './routes/transactions.js';

const app = express();
const port = process.env.API_PORT ?? 3001;

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/accounts', accountsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/transactions', transactionsRouter);

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
