import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { transactions, budgets, accounts, liabilities } from '@/lib/db/schema';
import { eq, and, isNull, gte, lte, sum, desc } from 'drizzle-orm';
import { z } from 'zod';
import { promises as dns } from 'dns';
import { Agent, fetch as undiciFetch } from 'undici';
import { LOCALE_COOKIE, resolveLocale, type Locale } from '@/i18n/config';

const RequestSchema = z.object({
  messages: z.array(z.object({
    role:    z.enum(['user', 'assistant']),
    content: z.string(),
  })),
  config: z.object({
    provider: z.string(),
    modelId:  z.string().regex(/^[a-zA-Z0-9._:-]+$/, 'Invalid model id'),
    apiKey:   z.string(),
    endpoint: z.string().url().optional(),
  }),
});

const FETCH_TIMEOUT_MS = 30_000;

// Blocks SSRF via a user-supplied "custom" endpoint: loopback, private/link-local
// ranges (incl. cloud metadata 169.254.169.254), and non-HTTPS targets. DNS is
// resolved and the actual IP checked too — checking the hostname string alone
// isn't enough (e.g. a domain the attacker controls resolving to 127.0.0.1).
function isPrivateOrReservedIp(ip: string): boolean {
  let candidate = ip.toLowerCase();
  // Unwrap IPv4-mapped/-compatible IPv6 (::ffff:a.b.c.d or ::a.b.c.d) to the
  // embedded IPv4 address — otherwise splitting on '.' below yields a NaN
  // segment and a blocked IPv4 target slips through disguised as an AAAA record.
  const mapped = candidate.match(/^::(?:ffff:)?(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) candidate = mapped[1];

  if (candidate === '::1') return true;
  if (candidate.startsWith('fe80:')) return true; // IPv6 link-local
  if (candidate.startsWith('fc') || candidate.startsWith('fd')) return true; // IPv6 unique-local

  const parts = candidate.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return false;
  const [a, b] = parts;
  if (a === 127) return true;                        // loopback
  if (a === 10) return true;                          // 10.0.0.0/8
  if (a === 172 && b >= 16 && b <= 31) return true;    // 172.16.0.0/12
  if (a === 192 && b === 168) return true;             // 192.168.0.0/16
  if (a === 169 && b === 254) return true;             // link-local + cloud metadata
  if (a === 0) return true;                            // 0.0.0.0/8
  return false;
}

// Validates the endpoint and returns the exact IPs it resolved to, so the
// caller can pin the actual request to them — re-resolving at connect time
// would open a DNS-rebinding gap (a different IP the second time around).
async function assertSafeEndpoint(rawUrl: string): Promise<string[]> {
  const url = new URL(rawUrl);
  if (url.protocol !== 'https:') {
    throw new Error('Custom endpoint must use https://');
  }
  const hostname = url.hostname.toLowerCase();
  if (hostname === 'localhost' || isPrivateOrReservedIp(hostname)) {
    throw new Error('This endpoint address is not allowed');
  }
  let addresses: { address: string; family: number }[];
  try {
    addresses = await dns.lookup(hostname, { all: true });
  } catch {
    throw new Error('Could not resolve endpoint address');
  }
  if (addresses.length === 0 || addresses.some((a) => isPrivateOrReservedIp(a.address))) {
    throw new Error('This endpoint address is not allowed');
  }
  return addresses.map((a) => a.address);
}

async function buildFinancialContext(userId: string, locale: Locale): Promise<string> {
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

${locale === 'en' ? 'Respond in English.' : 'Odpowiadaj po polsku.'} Bądź konkretny, pomocny i rzeczowy. Możesz zadawać pytania doprecyzowujące.
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
  const locale: Locale = resolveLocale(req.cookies.get(LOCALE_COOKIE)?.value);
  const systemContext = await buildFinancialContext(user.id, locale);

  // Route to appropriate provider
  let responseContent: string;

  if (config.provider === 'openai' || config.provider === 'custom') {
    const endpoint = config.endpoint ?? 'https://api.openai.com/v1';
    let pinnedAddresses: string[];
    try {
      pinnedAddresses = await assertSafeEndpoint(endpoint);
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : 'Invalid endpoint' }, { status: 400 });
    }
    // Pin the connection to exactly the IPs we just validated — resolving the
    // hostname again inside undici would reopen a DNS-rebinding window.
    const pinnedDispatcher = new Agent({
      connect: {
        lookup: (_hostname, options, callback) => {
          const results = pinnedAddresses.map((address) => ({ address, family: address.includes(':') ? 6 : 4 }));
          if (options?.all) callback(null, results);
          else callback(null, results[0].address, results[0].family);
        },
      },
    });
    const res = await undiciFetch(`${endpoint}/chat/completions`, {
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
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      dispatcher: pinnedDispatcher,
    });
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `Provider error: ${err}` }, { status: 502 });
    }
    const data = await res.json() as { choices?: { message?: { content?: string } }[] };
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
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
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
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
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
