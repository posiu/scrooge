import 'dotenv/config';
import { db } from './index.js';
import { categories } from './schema.js';

const defaultCategories: Array<{ name: string; type: 'income' | 'expense' | 'obligation' }> = [
    // Income
    { name: 'Wynagrodzenie', type: 'income' },
    { name: 'Freelance', type: 'income' },
    { name: 'Inwestycje', type: 'income' },
    { name: 'Inne przychody', type: 'income' },

    // Expenses
    { name: 'Jedzenie', type: 'expense' },
    { name: 'Transport', type: 'expense' },
    { name: 'Mieszkanie', type: 'expense' },
    { name: 'Rozrywka', type: 'expense' },
    { name: 'Zdrowie', type: 'expense' },
    { name: 'Odzież', type: 'expense' },
    { name: 'Inne wydatki', type: 'expense' },

    // Obligations
    { name: 'Kredyt', type: 'obligation' },
    { name: 'Rata', type: 'obligation' },
    { name: 'Abonament', type: 'obligation' },
];

async function seed() {
    console.log('🌱 Seeding default categories...');

    const inserted = await db
        .insert(categories)
        .values(defaultCategories)
        .onConflictDoNothing()
        .returning();

    inserted.forEach((c) => console.log(`  ✓ [${c.type}] ${c.name}`));
    console.log(`\nDone. Inserted ${inserted.length} categories.`);
    process.exit(0);
}

seed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
