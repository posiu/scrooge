import { pgTable, serial, text, timestamp, integer, AnyPgColumn } from 'drizzle-orm/pg-core';

export const accounts = pgTable('accounts', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type', {
    enum: ['bank', 'cash', 'crypto', 'fund', 'insurance', 'other'],
  }).notNull(),
  currency: text('currency').notNull().default('PLN'),
  institution: text('institution'),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type', {
    enum: ['income', 'expense', 'obligation'],
  }).notNull(),
  parentId: integer('parent_id').references((): AnyPgColumn => categories.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  accountId: integer('account_id')
    .notNull()
    .references(() => accounts.id),
  categoryId: integer('category_id').references(() => categories.id),
  amount: text('amount').notNull(), // numeric 12,2 stored as text to avoid precision issues in JS
  type: text('type', { enum: ['income', 'expense', 'obligation'] }).notNull(),
  currency: text('currency').notNull().default('PLN'),
  description: text('description'),
  date: timestamp('date').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

