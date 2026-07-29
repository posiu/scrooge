'use client';

import { useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { Upload, FileSpreadsheet, ArrowRight, CheckCircle2, AlertTriangle, Loader2, X, RefreshCw, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { translateApiError } from '@/lib/apiError';

type Step = 'upload' | 'map' | 'preview' | 'done';

interface RawRow { [key: string]: string | number | null }

const MAPPING_FIELD_KEYS = ['date', 'amount', 'description', 'category', 'type'] as const;
const MAPPING_FIELD_REQUIRED: Record<typeof MAPPING_FIELD_KEYS[number], boolean> = {
  date: true, amount: true, description: false, category: false, type: false,
};

interface Account { id: string; name: string; }

export default function ImportPage() {
  const t = useTranslations('Import');
  const tErr = useTranslations('ApiErrors');
  const mappingFieldMeta = t.raw('mappingFields') as { label: string; hint: string }[];
  const MAPPING_FIELDS = MAPPING_FIELD_KEYS.map((key, i) => ({
    key, required: MAPPING_FIELD_REQUIRED[key], label: mappingFieldMeta[i].label, hint: mappingFieldMeta[i].hint,
  }));
  const [step, setStep]               = useState<Step>('upload');
  const [headers, setHeaders]         = useState<string[]>([]);
  const [rows, setRows]               = useState<RawRow[]>([]);
  const [fileName, setFileName]       = useState('');
  const [mapping, setMapping]         = useState<Record<string, string>>({});
  const [accounts, setAccounts]       = useState<Account[]>([]);
  const [accountId, setAccountId]     = useState('');
  const [skipDupes, setSkipDupes]     = useState(true);
  const [importing, setImporting]     = useState(false);
  const [result, setResult]           = useState<{ imported: number; skipped: number; errors: number } | null>(null);
  const [error, setError]             = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // Load accounts
  const loadAccounts = useCallback(async () => {
    const res = await fetch('/api/accounts');
    if (res.ok) {
      const data = await res.json();
      setAccounts(data);
      if (data.length > 0) setAccountId(data[0].id);
    }
  }, []);

  function parseFile(file: File) {
    setError('');
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'csv' || ext === 'txt') {
      Papa.parse<RawRow>(file, {
        header: true, skipEmptyLines: true,
        complete: (res) => {
          setHeaders(Object.keys(res.data[0] ?? {}));
          setRows(res.data.slice(0, 1000));
          setFileName(file.name);
          loadAccounts();
          setStep('map');
        },
        error: () => setError(t('errorCsvParse')),
      });
    } else if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const wb = XLSX.read(e.target?.result, { type: 'array', cellDates: true });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const data = XLSX.utils.sheet_to_json<RawRow>(ws, { defval: '' });
          if (data.length === 0) { setError(t('errorEmptySheet')); return; }
          setHeaders(Object.keys(data[0]));
          setRows(data.slice(0, 1000));
          setFileName(file.name);
          loadAccounts();
          setStep('map');
        } catch { setError(t('errorExcelRead')); }
      };
      reader.readAsArrayBuffer(file);
    } else {
      setError(t('errorUnsupportedFormat'));
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  }

  // Auto-guess column mapping
  function autoGuess() {
    const guessed: Record<string, string> = {};
    const dateKeys   = ['data', 'date', 'data transakcji', 'data operacji', 'data księgowania'];
    const amountKeys = ['kwota', 'amount', 'wartość', 'wartość operacji', 'kwota operacji', 'suma'];
    const descKeys   = ['opis', 'description', 'tytuł', 'tytul', 'nazwa', 'odbiorca/zleceniodawca', 'opis operacji'];
    const catKeys    = ['kategoria', 'category', 'typ', 'rodzaj'];

    for (const h of headers) {
      const hl = h.toLowerCase().trim();
      if (!guessed.date        && dateKeys.some(k => hl.includes(k)))   guessed.date        = h;
      if (!guessed.amount      && amountKeys.some(k => hl.includes(k))) guessed.amount      = h;
      if (!guessed.description && descKeys.some(k => hl.includes(k)))   guessed.description = h;
      if (!guessed.category    && catKeys.some(k => hl.includes(k)))    guessed.category    = h;
    }
    setMapping(guessed);
  }

  async function doImport() {
    if (!mapping.date || !mapping.amount || !accountId) return;
    setImporting(true);

    const importRows = rows.map(row => ({
      date:         String(row[mapping.date] ?? ''),
      amount:       Number(String(row[mapping.amount]).replace(',', '.').replace(/[^\d.-]/g, '')),
      description:  mapping.description ? String(row[mapping.description] ?? '') : '',
      categoryName: mapping.category ? String(row[mapping.category] ?? '') : '',
      type:         mapping.type ? (String(row[mapping.type]).toLowerCase().includes('prz') ? 'income' : 'expense') : undefined,
    })).filter(r => r.date && !isNaN(r.amount) && r.amount !== 0);

    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: importRows, accountId, mapping, skipDuplicates: skipDupes }),
      });
      const data = await res.json();
      if (res.ok) { setResult(data); setStep('done'); }
      else setError(translateApiError(data.error, tErr, t('errorImport')));
    } catch { setError(t('errorNetwork')); }
    setImporting(false);
  }

  function reset() {
    setStep('upload'); setHeaders([]); setRows([]); setFileName('');
    setMapping({}); setResult(null); setError('');
    if (fileRef.current) fileRef.current.value = '';
  }

  const previewRows = rows.slice(0, 5);
  const canProceed = mapping.date && mapping.amount && accountId;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
          <FileSpreadsheet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2">
        {(['upload', 'map', 'preview', 'done'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors',
              step === s ? 'bg-[#01581E] text-white' : (
                ['upload', 'map', 'preview', 'done'].indexOf(step) > i
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-muted text-muted-foreground'
              ))}>
              {['upload', 'map', 'preview', 'done'].indexOf(step) > i ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
            </div>
            <span className={cn('text-xs font-medium', step === s ? 'text-foreground' : 'text-muted-foreground')}>
              {[t('stepFile'), t('stepMapping'), t('stepPreview'), t('stepDone')][i]}
            </span>
            {i < 3 && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
          <AlertTriangle className="w-4 h-4 shrink-0" />{error}
          <button onClick={() => setError('')} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Step: Upload */}
      {step === 'upload' && (
        <div
          onDrop={onDrop} onDragOver={e => e.preventDefault()}
          className="border-2 border-dashed border-border rounded-2xl p-12 text-center hover:border-[#01581E]/50 hover:bg-[#01581E]/[0.02] transition-colors cursor-pointer"
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-foreground font-medium mb-2">{t('dropzoneTitle')}</p>
          <p className="text-sm text-muted-foreground">{t('dropzoneFormats')}</p>
          <p className="text-xs text-muted-foreground mt-2">{t('dropzoneLimit')}</p>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv,.txt" className="hidden" onChange={onFileChange} />
        </div>
      )}

      {/* Step: Map */}
      {step === 'map' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileSpreadsheet className="w-4 h-4" />
              <span><strong className="text-foreground">{fileName}</strong> — {t('rowsCount', { count: rows.length })}</span>
            </div>
            <button onClick={autoGuess} className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-border rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
              <RefreshCw className="w-3 h-3" /> {t('autoMatch')}
            </button>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">{t('matchColumnsTitle')}</h3>
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 dark:text-blue-400">
                {t.rich('matchColumnsHint', { b: (chunks) => <strong>{chunks}</strong> })}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {MAPPING_FIELDS.map(field => (
                <div key={field.key} className="space-y-1">
                  <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  <select
                    value={mapping[field.key] ?? ''}
                    onChange={e => setMapping(m => ({ ...m, [field.key]: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]"
                  >
                    <option value="">{t('noMap')}</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <p className="text-xs text-muted-foreground">{field.hint}</p>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-border space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">{t('targetAccountLabel')}</label>
                <select value={accountId} onChange={e => setAccountId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#01581E]">
                  <option value="">{t('selectAccount')}</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={skipDupes} onChange={e => setSkipDupes(e.target.checked)}
                  className="rounded border-border text-[#01581E] focus:ring-[#01581E]" />
                <span className="text-sm text-foreground">{t('skipDuplicates')}</span>
              </label>
            </div>
          </div>

          {/* Preview table */}
          {previewRows.length > 0 && mapping.date && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">{t('previewTitle', { shown: Math.min(5, rows.length), total: rows.length })}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">{t('colDate')}</th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">{t('colAmount')}</th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">{t('colDescription')}</th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">{t('colCategory')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {previewRows.map((row, i) => {
                      const amt = Number(String(row[mapping.amount] ?? '').replace(',', '.').replace(/[^\d.-]/g, ''));
                      return (
                        <tr key={i} className="hover:bg-muted/20">
                          <td className="px-4 py-2 text-foreground">{String(row[mapping.date] ?? '')}</td>
                          <td className={cn('px-4 py-2 font-medium', amt < 0 ? 'text-red-500' : 'text-green-600')}>
                            {isNaN(amt) ? String(row[mapping.amount] ?? '') : amt.toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-muted-foreground max-w-[200px] truncate">{mapping.description ? String(row[mapping.description] ?? '') : '—'}</td>
                          <td className="px-4 py-2 text-muted-foreground">{mapping.category ? String(row[mapping.category] ?? '') : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={reset} className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted">{t('startOver')}</button>
            <button onClick={doImport} disabled={!canProceed || importing}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#01581E] text-white rounded-lg text-sm font-medium hover:bg-[#01581E]/90 disabled:opacity-50">
              {importing ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('importing')}</> : <><Upload className="w-4 h-4" /> {t('importButton', { count: rows.length })}</>}
            </button>
          </div>
        </div>
      )}

      {/* Step: Done */}
      {step === 'done' && result && (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">{t('doneTitle')}</h2>
              <p className="text-muted-foreground mt-1">{t('doneSubtitle')}</p>
            </div>
            <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
              <div className="bg-muted/40 rounded-xl p-3">
                <p className="text-2xl font-bold text-green-600">{result.imported}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t('imported')}</p>
              </div>
              <div className="bg-muted/40 rounded-xl p-3">
                <p className="text-2xl font-bold text-muted-foreground">{result.skipped}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t('skipped')}</p>
              </div>
              <div className="bg-muted/40 rounded-xl p-3">
                <p className="text-2xl font-bold text-amber-600">{result.errors}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t('errorsLabel')}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={reset} className="flex-1 py-2.5 border border-border rounded-lg text-sm hover:bg-muted">{t('importAnother')}</button>
            <a href="/transactions" className="flex-1 py-2.5 bg-[#01581E] text-white rounded-lg text-sm font-medium text-center hover:bg-[#01581E]/90">
              {t('goToTransactions')}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
