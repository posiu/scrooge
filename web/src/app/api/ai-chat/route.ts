import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { transactions, budgets, accounts, liabilities } from '@/lib/db/schema';
import { eq, and, isNull, gte, lte, sum, desc } from 'drizzle-orm';
import { z } from 'zod';

const RequestSchema = z.object({
  messages: z.array(z.object({
    role:    z.enum(['user', 'assistant']),
    content: z.string(),
  })),
  config: z.object({
    provider: z.string(),
    modelId:  z.string(),
    apiKey:   z.string(),
    endpoint: z.string().optional(),
  }),
});

async function buildFinancialContext(userId: string): Promise<string> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const [incRes, expRes, recentTx, activeLiabilities] = await Promise.all([
    db.select({ total: sum(transactions.amount) })
      .from(transactions)
      .where(and(
        eq(transactions.userId, userId),
        eq(transactions.type, 'income'),
        gte(transactions.date, monthStart),
        lte(transactions.date, monthEnd),
        isNull(transactions.deletedAt),
      )),
    db.select({ total: sum(transactions.amount) })
      .from(transactions)
      .where(and(
        eq(transactions.userId, userId),
        eq(transactions.type, 'expense'),
        gte(transactions.date, monthStart),
        lte(transactions.date, monthEnd),
        isNull(transactions.deletedAt),
      )),
    db.query.transactions.findMany({
      where: and(eq(transactions.userId, userId), isNull(transactions.deletedAt)),
      with: { category: true },
      orderBy: desc(transactions.date),
      limit: 20,
    }),
    db.query.liabilities.findMany({
      where: and(eq(liabilities.userId, userId), eq(liabilities.isActive, true)),
    }),
  ]);

  const income  = parseFloat(incRes[0]?.total ?? '0');
  const expense = parseFloat(expRes[0]?.total ?? '0');

  const context = `
Jesteś asystentem finansowym aplikacji Scrooge. Oto dane finansowe użytkownika:

BIEŻĄCY MIESIĄC (${now.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })}):
- Przychody: ${income.toFixed(2)} PLN
- Wydatki: ${expense.toFixed(2)} PLN
- Saldo: ${(income - expense).toFixed(2)} PLN

OSTATNIE TRANSAKCJE (do 20):
${recentTx.map((t) => `- ${new Date(t.date).toLocaleDateString('pl-PL')}: ${t.type === 'income' ? '+' : '-'}${parseFloat(t.amount).toFixed(2)} PLN ${t.category?.name ? `(${t.category.name})` : ''} ${t.description ? `"${t.description}"` : ''}`).join('\n')}

ZOBOWIĄZANIA AKTYWNE:
${activeLiabilities.length === 0 ? 'Brak' : activeLiabilities.map((l) => `- ${l.name}: pozostało ${parseFloat(l.remainingAmount).toFixed(2)} PLN${l.monthlyPayment ? `, rata: ${parseFloat(l.monthlyPayment).toFixed(2)} PLN/mies.` : ''}`).join('\n')}

Odpowiadaj po polsku. Bądź konkretny, pomocny i rzeczowy. Możesz zadawać pytania doprecyzowujące.
`.trim();

  return context;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const { messages, config } = parsed.data;
  const systemContext = await buildFinancialContext(user.id);

  // Route to appropriate provider
  let responseContent: string;

  if (config.provider === 'openai' || config.provider === 'custom') {
    const endpoint = config.endpoint ?? 'https://api.openai.com/v1';
    const res = await fetch(`${endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.modelId,
        messages: [
          { role: 'system', content: systemContext },
          ...messages,
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `Provider error: ${err}` }, { status: 502 });
    }
    const data = await res.json();
    responseContent = data.choices?.[0]?.message?.content ?? 'Brak odpowiedzi';
  } else if (config.provider === 'anthropic') {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.modelId,
        system: systemContext,
        messages,
        max_tokens: 1000,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `Provider error: ${err}` }, { status: 502 });
    }
    const data = await res.json();
    responseContent = data.content?.[0]?.text ?? 'Brak odpowiedzi';
  } else if (config.provider === 'google') {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${config.modelId}:generateContent?key=${config.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemContext }] },
          contents: messages.map((m) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
          })),
          generationConfig: { maxOutputTokens: 1000 },
        }),
      },
    );
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `Provider error: ${err}` }, { status: 502 });
    }
    const data = await res.json();
    responseContent = data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Brak odpowiedzi';
  } else {
    return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
  }

  return NextResponse.json({ content: responseContent });
}
