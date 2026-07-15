import {
  pgTable,
  text,
  timestamp,
  integer,
  uuid,
  boolean,
  pgEnum,
  numeric,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const accountTypeEnum = pgEnum('account_type', [
  'bank', 'cash', 'crypto', 'fund', 'insurance', 'other',
]);

export const investmentCategoryEnum = pgEnum('investment_category', [
  'stocks', 'treasury_bonds', 'corporate_bonds', 'etf', 'deposits', 'mutual_funds',
  'currencies', 'precious_metals', 'art', 'cryptocurrencies', 'company_shares',
  'derivatives', 'other',
]);

export const transactionTypeEnum = pgEnum('transaction_type', [
  'income', 'expense', 'transfer',
]);

export const categoryTypeEnum = pgEnum('category_type', [
  'income', 'expense', 'obligation',
]);

export const liabilityTypeEnum = pgEnum('liability_type', [
  'loan', 'credit', 'subscription', 'installment', 'personal_loan', 'bank_loan', 'company_loan', 'other',
]);

export const featureStatusEnum = pgEnum('feature_request_status', [
  'open', 'planned', 'in_progress', 'done', 'rejected',
]);

export const taxTypeEnum = pgEnum('tax_type', [
  'personal_income', 'corporate', 'real_estate', 'land', 'pcc', 'investment', 'capital_gains', 'other',
]);

export const taxStatusEnum = pgEnum('tax_status', [
  'pending', 'partially_paid', 'paid', 'overdue',
]);

export const interestTypeEnum = pgEnum('interest_type', [
  'statutory', 'statutory_commercial', 'contractual', 'tax', 'tax_delayed', 'custom',
]);

export const enforcementStatusEnum = pgEnum('enforcement_status', [
  'active', 'partially_paid', 'satisfied', 'appealed', 'suspended',
]);

// ─── User Settings ────────────────────────────────────────────────────────────

export const userSettings = pgTable('user_settings', {
  id:          uuid('id').primaryKey().defaultRandom(),
  userId:      uuid('user_id').notNull().unique(),
  isAdmin:     boolean('is_admin').notNull().default(false),
  currency:    text('currency').notNull().default('PLN'),
  locale:      text('locale').notNull().default('pl-PL'),
  theme:       text('theme').notNull().default('system'),
  // AI Chat configuration (stored encrypted or as reference)
  aiProvider:  text('ai_provider'),   // 'openai' | 'anthropic' | 'google' | 'custom'
  aiModelId:   text('ai_model_id'),
  aiApiKeyRef: text('ai_api_key_ref'), // reference to user-supplied key (never plain text in DB)
  aiEndpoint:  text('ai_endpoint'),    // for custom providers
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── Accounts ─────────────────────────────────────────────────────────────────

export const accounts = pgTable('accounts', {
  id:          uuid('id').primaryKey().defaultRandom(),
  userId:      uuid('user_id').notNull(),
  name:        text('name').notNull(),
  type:        accountTypeEnum('type').notNull(),
  currency:    text('currency').notNull().default('PLN'),
  institution: text('institution'),
  description: text('description'),
  sortOrder:   integer('sort_order').notNull().default(0),
  isActive:    boolean('is_active').notNull().default(true),
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('accounts_user_id_idx').on(t.userId),
]);

// ─── Investments ──────────────────────────────────────────────────────────────

export const investments = pgTable('investments', {
  id:            uuid('id').primaryKey().defaultRandom(),
  userId:        uuid('user_id').notNull(),
  name:          text('name').notNull(),
  category:      investmentCategoryEnum('category').notNull(),
  currentValue:  numeric('current_value', { precision: 15, scale: 2 }).notNull(),
  currency:      text('currency').notNull().default('PLN'),
  institution:   text('institution'),
  description:   text('description'),
  isActive:      boolean('is_active').notNull().default(true),
  createdAt:     timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:     timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('investments_user_id_idx').on(t.userId),
]);

// ─── Categories ───────────────────────────────────────────────────────────────

export const categories = pgTable('categories', {
  id:          uuid('id').primaryKey().defaultRandom(),
  userId:      uuid('user_id'), // null = system/default (visible to all)
  name:        text('name').notNull(),
  type:        categoryTypeEnum('type').notNull(),
  parentId:    uuid('parent_id'), // self-reference for hierarchical categories
  icon:        text('icon'),
  color:       text('color'),
  sortOrder:   integer('sort_order').notNull().default(0),
  isSystem:    boolean('is_system').notNull().default(false),
  isActive:    boolean('is_active').notNull().default(true),
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('categories_user_id_idx').on(t.userId),
  index('categories_parent_id_idx').on(t.parentId),
]);

// ─── Transactions ─────────────────────────────────────────────────────────────

export const transactions = pgTable('transactions', {
  id:                   uuid('id').primaryKey().defaultRandom(),
  userId:               uuid('user_id').notNull(),
  accountId:            uuid('account_id').notNull().references(() => accounts.id),
  categoryId:           uuid('category_id').references(() => categories.id),
  amount:               numeric('amount', { precision: 15, scale: 2 }).notNull(),
  type:                 transactionTypeEnum('type').notNull(),
  currency:             text('currency').notNull().default('PLN'),
  description:          text('description'),
  date:                 timestamp('date', { withTimezone: true }).notNull(),
  tags:                 text('tags').array(),
  transferToAccountId:  uuid('transfer_to_account_id').references(() => accounts.id),
  // Import deduplication: hash of (date + amount + description)
  importHash:           text('import_hash'),
  deletedAt:            timestamp('deleted_at', { withTimezone: true }), // soft delete
  createdAt:            timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:            timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('transactions_user_date_idx').on(t.userId, t.date),
  index('transactions_user_category_idx').on(t.userId, t.categoryId),
  index('transactions_user_account_idx').on(t.userId, t.accountId),
  index('transactions_import_hash_idx').on(t.importHash),
]);

// ─── Budget Templates ─────────────────────────────────────────────────────────

export const budgetTemplates = pgTable('budget_templates', {
  id:          uuid('id').primaryKey().defaultRandom(),
  userId:      uuid('user_id').notNull(),
  name:        text('name').notNull(),
  description: text('description'),
  isDefault:   boolean('is_default').notNull().default(false),
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('budget_templates_user_id_idx').on(t.userId),
]);

export const budgetTemplateItems = pgTable('budget_template_items', {
  id:            uuid('id').primaryKey().defaultRandom(),
  templateId:    uuid('template_id').notNull().references(() => budgetTemplates.id, { onDelete: 'cascade' }),
  categoryId:    uuid('category_id').notNull().references(() => categories.id),
  plannedAmount: numeric('planned_amount', { precision: 15, scale: 2 }).notNull(),
  notes:         text('notes'),
  sortOrder:     integer('sort_order').notNull().default(0),
});

// ─── Monthly Budgets ──────────────────────────────────────────────────────────

export const budgets = pgTable('budgets', {
  id:            uuid('id').primaryKey().defaultRandom(),
  userId:        uuid('user_id').notNull(),
  categoryId:    uuid('category_id').notNull().references(() => categories.id),
  month:         text('month').notNull(), // YYYY-MM
  plannedAmount: numeric('planned_amount', { precision: 15, scale: 2 }).notNull(),
  notes:         text('notes'),
  createdAt:     timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:     timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('budgets_user_category_month_idx').on(t.userId, t.categoryId, t.month),
]);

// ─── Liabilities ──────────────────────────────────────────────────────────────

export const liabilities = pgTable('liabilities', {
  id:               uuid('id').primaryKey().defaultRandom(),
  userId:           uuid('user_id').notNull(),
  name:             text('name').notNull(),
  type:             liabilityTypeEnum('type').notNull(),
  totalAmount:      numeric('total_amount', { precision: 15, scale: 2 }).notNull(),
  remainingAmount:  numeric('remaining_amount', { precision: 15, scale: 2 }).notNull(),
  monthlyPayment:   numeric('monthly_payment', { precision: 15, scale: 2 }),
  interestRate:     numeric('interest_rate', { precision: 5, scale: 4 }),
  startDate:        timestamp('start_date', { withTimezone: true }),
  dueDate:          timestamp('due_date', { withTimezone: true }),
  categoryId:       uuid('category_id').references(() => categories.id),
  linkedAccountId:  uuid('linked_account_id').references(() => accounts.id),
  description:      text('description'),
  isActive:         boolean('is_active').notNull().default(true),
  createdAt:        timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:        timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('liabilities_user_id_idx').on(t.userId),
]);

// ─── AI Chat Sessions ─────────────────────────────────────────────────────────
// Only metadata stored in DB — messages are stored in localStorage on device

export const aiChatSessions = pgTable('ai_chat_sessions', {
  id:            uuid('id').primaryKey().defaultRandom(),
  userId:        uuid('user_id').notNull(),
  title:         text('title').notNull().default('Nowa rozmowa'),
  modelProvider: text('model_provider'), // 'openai' | 'anthropic' | 'google' | 'custom'
  modelId:       text('model_id'),
  messageCount:  integer('message_count').notNull().default(0),
  lastMessageAt: timestamp('last_message_at', { withTimezone: true }),
  createdAt:     timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('ai_chat_sessions_user_id_idx').on(t.userId),
]);

// ─── Feature Requests ─────────────────────────────────────────────────────────

export const featureRequests = pgTable('feature_requests', {
  id:          uuid('id').primaryKey().defaultRandom(),
  userId:      uuid('user_id'),
  authorEmail: text('author_email'),
  authorName:  text('author_name'),
  title:       text('title').notNull(),
  description: text('description').notNull(),
  status:      featureStatusEnum('status').notNull().default('open'),
  adminNote:   text('admin_note'),
  voteCount:   integer('vote_count').notNull().default(0),
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('feature_requests_status_idx').on(t.status),
  index('feature_requests_vote_count_idx').on(t.voteCount),
]);

export const featureVotes = pgTable('feature_votes', {
  id:               uuid('id').primaryKey().defaultRandom(),
  featureRequestId: uuid('feature_request_id').notNull().references(() => featureRequests.id, { onDelete: 'cascade' }),
  userId:           uuid('user_id'),
  voterEmail:       text('voter_email'),
  createdAt:        timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('feature_votes_request_user_idx').on(t.featureRequestId, t.userId),
]);

export const featureComments = pgTable('feature_comments', {
  id:               uuid('id').primaryKey().defaultRandom(),
  featureRequestId: uuid('feature_request_id').notNull().references(() => featureRequests.id, { onDelete: 'cascade' }),
  userId:           uuid('user_id'),
  authorEmail:      text('author_email'),
  authorName:       text('author_name'),
  isAdmin:          boolean('is_admin').notNull().default(false),
  content:          text('content').notNull(),
  createdAt:        timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:        timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── Taxes ───────────────────────────────────────────────────────────────────

export const taxes = pgTable('taxes', {
  id:              uuid('id').primaryKey().defaultRandom(),
  userId:          uuid('user_id').notNull(),
  name:            text('name').notNull(),
  type:            taxTypeEnum('type').notNull(),
  taxPeriod:       text('tax_period'),
  taxOffice:       text('tax_office'),
  amountDue:       numeric('amount_due', { precision: 15, scale: 2 }).notNull(),
  amountPaid:      numeric('amount_paid', { precision: 15, scale: 2 }).notNull().default('0'),
  dueDate:         timestamp('due_date', { withTimezone: true }),
  status:          taxStatusEnum('status').notNull().default('pending'),
  linkedAccountId: uuid('linked_account_id').references(() => accounts.id),
  description:     text('description'),
  isDemoData:      boolean('is_demo_data').notNull().default(false),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:       timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('taxes_user_id_idx').on(t.userId),
  index('taxes_status_idx').on(t.status),
]);

export const taxPayments = pgTable('tax_payments', {
  id:            uuid('id').primaryKey().defaultRandom(),
  taxId:         uuid('tax_id').notNull().references(() => taxes.id, { onDelete: 'cascade' }),
  userId:        uuid('user_id').notNull(),
  amount:        numeric('amount', { precision: 15, scale: 2 }).notNull(),
  paymentDate:   timestamp('payment_date', { withTimezone: true }).notNull(),
  transactionId: uuid('transaction_id').references(() => transactions.id),
  description:   text('description'),
  isDemoData:    boolean('is_demo_data').notNull().default(false),
  createdAt:     timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('tax_payments_tax_id_idx').on(t.taxId),
]);

// ─── Enforcement Proceedings ─────────────────────────────────────────────────

export const enforcementProceedings = pgTable('enforcement_proceedings', {
  id:                   uuid('id').primaryKey().defaultRandom(),
  userId:               uuid('user_id').notNull(),
  accountId:            uuid('account_id').references(() => accounts.id),
  creditor:             text('creditor').notNull(),
  enforcementAuthority: text('enforcement_authority').notNull(),
  caseNumber:           text('case_number'),
  reason:               text('reason').notNull(),
  originalAmount:       numeric('original_amount', { precision: 15, scale: 2 }).notNull(),
  remainingAmount:      numeric('remaining_amount', { precision: 15, scale: 2 }).notNull(),
  interestRate:         numeric('interest_rate', { precision: 7, scale: 4 }),
  interestRateCustom:   numeric('interest_rate_custom', { precision: 7, scale: 4 }),
  interestType:         interestTypeEnum('interest_type').notNull().default('statutory'),
  garnishmentDate:      timestamp('garnishment_date', { withTimezone: true }).notNull(),
  status:               enforcementStatusEnum('status').notNull().default('active'),
  description:          text('description'),
  isDemoData:           boolean('is_demo_data').notNull().default(false),
  createdAt:            timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:            timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('enforcement_user_id_idx').on(t.userId),
  index('enforcement_status_idx').on(t.status),
]);

export const enforcementPayments = pgTable('enforcement_payments', {
  id:            uuid('id').primaryKey().defaultRandom(),
  proceedingId:  uuid('proceeding_id').notNull().references(() => enforcementProceedings.id, { onDelete: 'cascade' }),
  userId:        uuid('user_id').notNull(),
  amount:        numeric('amount', { precision: 15, scale: 2 }).notNull(),
  paymentDate:   timestamp('payment_date', { withTimezone: true }).notNull(),
  transactionId: uuid('transaction_id').references(() => transactions.id),
  description:   text('description'),
  isDemoData:    boolean('is_demo_data').notNull().default(false),
  createdAt:     timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('enforcement_payments_proc_idx').on(t.proceedingId),
]);

// ─── Relations ────────────────────────────────────────────────────────────────

export const accountsRelations = relations(accounts, ({ many }) => ({
  transactions: many(transactions),
  liabilities:  many(liabilities),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent:        one(categories, { fields: [categories.parentId], references: [categories.id] }),
  children:      many(categories),
  transactions:  many(transactions),
  budgets:       many(budgets),
  liabilities:   many(liabilities),
  templateItems: many(budgetTemplateItems),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  account:           one(accounts, { fields: [transactions.accountId], references: [accounts.id] }),
  category:          one(categories, { fields: [transactions.categoryId], references: [categories.id] }),
  transferToAccount: one(accounts, {
    fields: [transactions.transferToAccountId],
    references: [accounts.id],
    relationName: 'transferTo',
  }),
}));

export const budgetTemplatesRelations = relations(budgetTemplates, ({ many }) => ({
  items: many(budgetTemplateItems),
}));

export const budgetTemplateItemsRelations = relations(budgetTemplateItems, ({ one }) => ({
  template: one(budgetTemplates, { fields: [budgetTemplateItems.templateId], references: [budgetTemplates.id] }),
  category: one(categories, { fields: [budgetTemplateItems.categoryId], references: [categories.id] }),
}));

export const budgetsRelations = relations(budgets, ({ one }) => ({
  category: one(categories, { fields: [budgets.categoryId], references: [categories.id] }),
}));

export const liabilitiesRelations = relations(liabilities, ({ one }) => ({
  category:      one(categories, { fields: [liabilities.categoryId], references: [categories.id] }),
  linkedAccount: one(accounts, { fields: [liabilities.linkedAccountId], references: [accounts.id] }),
}));

export const featureRequestsRelations = relations(featureRequests, ({ many }) => ({
  votes:    many(featureVotes),
  comments: many(featureComments),
}));

export const featureVotesRelations = relations(featureVotes, ({ one }) => ({
  featureRequest: one(featureRequests, { fields: [featureVotes.featureRequestId], references: [featureRequests.id] }),
}));

export const featureCommentsRelations = relations(featureComments, ({ one }) => ({
  featureRequest: one(featureRequests, { fields: [featureComments.featureRequestId], references: [featureRequests.id] }),
}));

export const taxesRelations = relations(taxes, ({ one, many }) => ({
  linkedAccount: one(accounts, { fields: [taxes.linkedAccountId], references: [accounts.id] }),
  payments:      many(taxPayments),
}));

export const taxPaymentsRelations = relations(taxPayments, ({ one }) => ({
  tax:         one(taxes, { fields: [taxPayments.taxId], references: [taxes.id] }),
  transaction: one(transactions, { fields: [taxPayments.transactionId], references: [transactions.id] }),
}));

export const enforcementProceedingsRelations = relations(enforcementProceedings, ({ one, many }) => ({
  account:  one(accounts, { fields: [enforcementProceedings.accountId], references: [accounts.id] }),
  payments: many(enforcementPayments),
}));

export const enforcementPaymentsRelations = relations(enforcementPayments, ({ one }) => ({
  proceeding:  one(enforcementProceedings, { fields: [enforcementPayments.proceedingId], references: [enforcementProceedings.id] }),
  transaction: one(transactions, { fields: [enforcementPayments.transactionId], references: [transactions.id] }),
}));

// ─── Savings Goals ──────────────────────────────────────────────────────────

export const goalStatusEnum = pgEnum('goal_status', ['active', 'completed', 'cancelled']);

export const savingsGoals = pgTable('savings_goals', {
  id:            uuid('id').primaryKey().defaultRandom(),
  userId:        uuid('user_id').notNull(),
  name:          text('name').notNull(),
  targetAmount:  numeric('target_amount', { precision: 15, scale: 2 }).notNull(),
  currentAmount: numeric('current_amount', { precision: 15, scale: 2 }).notNull().default('0'),
  targetDate:    timestamp('target_date', { withTimezone: true }),
  icon:          text('icon'),
  color:         text('color').default('#01581E'),
  status:        goalStatusEnum('status').notNull().default('active'),
  description:   text('description'),
  isDemoData:    boolean('is_demo_data').notNull().default(false),
  createdAt:     timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:     timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('goals_user_id_idx').on(t.userId),
]);

export const goalDeposits = pgTable('goal_deposits', {
  id:         uuid('id').primaryKey().defaultRandom(),
  goalId:     uuid('goal_id').notNull().references(() => savingsGoals.id, { onDelete: 'cascade' }),
  userId:     uuid('user_id').notNull(),
  amount:     numeric('amount', { precision: 15, scale: 2 }).notNull(),
  note:       text('note'),
  depositAt:  timestamp('deposit_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt:  timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('goal_deposits_goal_id_idx').on(t.goalId),
]);

export const savingsGoalsRelations = relations(savingsGoals, ({ many }) => ({
  deposits: many(goalDeposits),
}));

export const goalDepositsRelations = relations(goalDeposits, ({ one }) => ({
  goal: one(savingsGoals, { fields: [goalDeposits.goalId], references: [savingsGoals.id] }),
}));

// ─── Type Exports ─────────────────────────────────────────────────────────────

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type Budget = typeof budgets.$inferSelect;
export type NewBudget = typeof budgets.$inferInsert;
export type BudgetTemplate = typeof budgetTemplates.$inferSelect;
export type BudgetTemplateItem = typeof budgetTemplateItems.$inferSelect;
export type Liability = typeof liabilities.$inferSelect;
export type NewLiability = typeof liabilities.$inferInsert;
export type FeatureRequest = typeof featureRequests.$inferSelect;
export type FeatureVote = typeof featureVotes.$inferSelect;
export type FeatureComment = typeof featureComments.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;
export type AiChatSession = typeof aiChatSessions.$inferSelect;
export type Tax = typeof taxes.$inferSelect;
export type NewTax = typeof taxes.$inferInsert;
export type TaxPayment = typeof taxPayments.$inferSelect;
export type NewTaxPayment = typeof taxPayments.$inferInsert;
export type EnforcementProceeding = typeof enforcementProceedings.$inferSelect;
export type NewEnforcementProceeding = typeof enforcementProceedings.$inferInsert;
export type EnforcementPayment = typeof enforcementPayments.$inferSelect;
export type NewEnforcementPayment = typeof enforcementPayments.$inferInsert;
export type SavingsGoal = typeof savingsGoals.$inferSelect;
export type NewSavingsGoal = typeof savingsGoals.$inferInsert;
export type GoalDeposit = typeof goalDeposits.$inferSelect;
export type NewGoalDeposit = typeof goalDeposits.$inferInsert;
