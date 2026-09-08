import fs from 'node:fs/promises';
import path from 'node:path';

import {
  readGitHubFile,
  writeGitHubFile
} from './githubStorage.js';

export type QuoteStatus =
  | 'brouillon'
  | 'envoye'
  | 'accepte'
  | 'refuse'
  | 'expire'
  | 'annule';

export interface QuoteLine {
  id: number;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
}

export interface QuoteHistoryEntry {
  action: string;
  userId: string;
  date: string;
  details?: string;
}

export interface Quote {
  id: number;
  number: string;
  clientId: string;
  title: string;
  description: string;
  lines: QuoteLine[];
  discount: number;
  status: QuoteStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  history: QuoteHistoryEntry[];
}

const DATA_DIR =
  path.resolve('data');

const DATA_FILE =
  path.join(
    DATA_DIR,
    'quotes.json'
  );

const GITHUB_FILE =
  'data/quotes.json';

let quotes: Quote[] = [];

async function ensureDataDirectory(): Promise<void> {
  await fs.mkdir(
    DATA_DIR,
    {
      recursive: true
    }
  );
}

function parseQuotes(
  content: string
): Quote[] {
  const parsed =
    JSON.parse(content);

  if (!Array.isArray(parsed)) {
    throw new Error(
      'Le fichier quotes.json doit contenir un tableau.'
    );
  }

  return parsed as Quote[];
}

async function saveQuotes(
  commitMessage: string
): Promise<void> {
  await ensureDataDirectory();

  const content =
    JSON.stringify(
      quotes,
      null,
      2
    );

  await fs.writeFile(
    DATA_FILE,
    content,
    'utf8'
  );

  void writeGitHubFile(
    GITHUB_FILE,
    content,
    commitMessage
  ).catch(error => {
    console.error(
      `❌ Impossible de synchroniser ${GITHUB_FILE} sur GitHub :`,
      error
    );
  });
}

export async function initializeQuoteStorage(): Promise<void> {
  await ensureDataDirectory();

  const githubFile =
    await readGitHubFile(
      GITHUB_FILE
    );

  if (githubFile) {
    quotes =
      parseQuotes(
        githubFile.content
      );

    await fs.writeFile(
      DATA_FILE,
      githubFile.content,
      'utf8'
    );

    console.log(
      '☁️ Devis synchronisés depuis GitHub.'
    );

    return;
  }

  try {
    const localContent =
      await fs.readFile(
        DATA_FILE,
        'utf8'
      );

    quotes =
      parseQuotes(
        localContent
      );
  } catch {
    quotes = [];

    await saveQuotes(
      'feat: initialize quotes'
    );
  }

  console.log(
    '🧾 Système de devis initialisé.'
  );
}

export function getQuotes(): Quote[] {
  return [...quotes]
    .sort(
      (a, b) =>
        b.id - a.id
    );
}

export function getQuote(
  id: number
): Quote | undefined {
  return quotes.find(
    quote =>
      quote.id === id
  );
}

export function getQuoteStatusLabel(
  status: QuoteStatus
): string {
  const labels: Record<
    QuoteStatus,
    string
  > = {
    brouillon: '📝 Brouillon',
    envoye: '📤 Envoyé',
    accepte: '✅ Accepté',
    refuse: '❌ Refusé',
    expire: '⏰ Expiré',
    annule: '🚫 Annulé'
  };

  return labels[status];
}

export function getQuoteTotal(
  quote: Quote
): number {
  const subtotal =
    quote.lines.reduce(
      (
        total,
        line
      ) =>
        total +
        line.quantity *
          line.unitPrice,
      0
    );

  return Math.max(
    0,
    subtotal -
      quote.discount
  );
}

function getNextQuoteId(): number {
  return quotes.length > 0
    ? Math.max(
        ...quotes.map(
          quote => quote.id
        )
      ) + 1
    : 1;
}

function createHistoryEntry(
  action: string,
  userId: string,
  details?: string
): QuoteHistoryEntry {
  return {
    action,
    userId,
    date:
      new Date().toISOString(),
    ...(details
      ? { details }
      : {})
  };
}

export async function createQuote(
  clientId: string,
  title: string,
  description: string,
  lines: QuoteLine[],
  createdBy: string,
  validityDays?: number
): Promise<Quote> {
  const id =
    getNextQuoteId();

  const now =
    new Date();

  const expiresAt =
    validityDays &&
    validityDays > 0
      ? new Date(
          now.getTime() +
            validityDays *
              24 *
              60 *
              60 *
              1000
        ).toISOString()
      : undefined;

  const quote: Quote = {
    id,
    number:
      `DEV-${String(id).padStart(3, '0')}`,
    clientId,
    title,
    description,
    lines,
    discount: 0,
    status: 'envoye',
    createdBy,
    createdAt:
      now.toISOString(),
    updatedAt:
      now.toISOString(),
    ...(expiresAt
      ? { expiresAt }
      : {}),
    history: [
      createHistoryEntry(
        'Création du devis',
        createdBy
      )
    ]
  };

  quotes.push(
    quote
  );

  await saveQuotes(
    `feat: create quote #${id}`
  );

  return quote;
}

export async function updateQuoteStatus(
  id: number,
  status: QuoteStatus,
  userId: string
): Promise<Quote | null> {
  const quote =
    getQuote(id);

  if (!quote) {
    return null;
  }

  quote.status =
    status;

  quote.updatedAt =
    new Date().toISOString();

  quote.history.push(
    createHistoryEntry(
      `Statut : ${status}`,
      userId
    )
  );

  await saveQuotes(
    `feat: update quote #${id} status`
  );

  return quote;
}

export async function deleteQuote(
  id: number,
  userId: string
): Promise<Quote | null> {
  const index =
    quotes.findIndex(
      quote =>
        quote.id === id
    );

  if (index === -1) {
    return null;
  }

  const [
    quote
  ] =
    quotes.splice(
      index,
      1
    );

  await saveQuotes(
    `feat: delete quote #${id} by ${userId}`
  );

  return quote;
}

export async function addQuoteHistory(
  id: number,
  action: string,
  userId: string,
  details?: string
): Promise<Quote | null> {
  const quote =
    getQuote(id);

  if (!quote) {
    return null;
  }

  quote.history.push(
    createHistoryEntry(
      action,
      userId,
      details
    )
  );

  quote.updatedAt =
    new Date().toISOString();

  await saveQuotes(
    `chore: update quote #${id} history`
  );

  return quote;
}