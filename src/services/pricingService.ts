import fs from 'node:fs/promises';
import path from 'node:path';

import {
  readGitHubFile,
  writeGitHubFile
} from './githubStorage.js';

export type PricingCategory =
  | 'developpement'
  | 'fivem'
  | 'discord'
  | 'site'
  | 'maintenance'
  | 'autre';

export interface PricingItem {
  id: number;
  name: string;
  description: string;
  category: PricingCategory;
  price: number;
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR =
  path.resolve('data');

const DATA_FILE =
  path.join(
    DATA_DIR,
    'pricing.json'
  );

const GITHUB_FILE =
  'data/pricing.json';

let pricing: PricingItem[] = [];

const defaultPricing: PricingItem[] = [
  {
    id: 1,
    name: 'Développement Discord',
    description:
      'Création ou développement de fonctionnalités personnalisées pour un bot Discord.',
    category: 'discord',
    price: 50,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 2,
    name: 'Script FiveM',
    description:
      'Développement d’un script Lua/FiveM personnalisé.',
    category: 'fivem',
    price: 50,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 3,
    name: 'Site web',
    description:
      'Création d’un site web personnalisé.',
    category: 'site',
    price: 100,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

async function ensurePricingDirectory(): Promise<void> {
  await fs.mkdir(
    DATA_DIR,
    {
      recursive: true
    }
  );
}

async function savePricing(
  commitMessage: string
): Promise<void> {
  await ensurePricingDirectory();

  const content =
    JSON.stringify(
      pricing,
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

function parsePricing(
  content: string
): PricingItem[] {
  const parsed =
    JSON.parse(content);

  if (!Array.isArray(parsed)) {
    throw new Error(
      'Le fichier pricing.json doit contenir un tableau.'
    );
  }

  return parsed as PricingItem[];
}

export async function initializePricingStorage(): Promise<void> {
  await ensurePricingDirectory();

  const githubFile =
    await readGitHubFile(
      GITHUB_FILE
    );

  if (githubFile) {
    pricing =
      parsePricing(
        githubFile.content
      );

    await fs.writeFile(
      DATA_FILE,
      githubFile.content,
      'utf8'
    );

    console.log(
      '☁️ Tarifs synchronisés depuis GitHub.'
    );

    return;
  }

  try {
    const localContent =
      await fs.readFile(
        DATA_FILE,
        'utf8'
      );

    pricing =
      parsePricing(
        localContent
      );
  } catch {
    pricing = [
      ...defaultPricing
    ];

    await savePricing(
      'feat: initialize pricing'
    );
  }

  console.log(
    '💰 Système de tarifs initialisé.'
  );
}

export function getPricing(): PricingItem[] {
  return [...pricing]
    .sort(
      (a, b) =>
        a.category.localeCompare(
          b.category
        ) ||
        a.price - b.price ||
        a.name.localeCompare(
          b.name
        )
    );
}

export function getPricingItem(
  id: number
): PricingItem | undefined {
  return pricing.find(
    item => item.id === id
  );
}

export async function addPricingItem(
  name: string,
  description: string,
  category: PricingCategory,
  price: number
): Promise<PricingItem> {
  const nextId =
    pricing.length > 0
      ? Math.max(
          ...pricing.map(
            item => item.id
          )
        ) + 1
      : 1;

  const now =
    new Date().toISOString();

  const item: PricingItem = {
    id: nextId,
    name,
    description,
    category,
    price,
    createdAt: now,
    updatedAt: now
  };

  pricing.push(item);

  await savePricing(
    `feat: add pricing item #${item.id}`
  );

  return item;
}

export async function updatePricingItem(
  id: number,
  updates: {
    name?: string;
    description?: string;
    category?: PricingCategory;
    price?: number;
  }
): Promise<PricingItem | null> {
  const item =
    getPricingItem(id);

  if (!item) {
    return null;
  }

  if (updates.name !== undefined) {
    item.name =
      updates.name;
  }

  if (
    updates.description !==
    undefined
  ) {
    item.description =
      updates.description;
  }

  if (
    updates.category !==
    undefined
  ) {
    item.category =
      updates.category;
  }

  if (
    updates.price !==
    undefined
  ) {
    item.price =
      updates.price;
  }

  item.updatedAt =
    new Date().toISOString();

  await savePricing(
    `feat: update pricing item #${id}`
  );

  return item;
}

export async function deletePricingItem(
  id: number
): Promise<PricingItem | null> {
  const index =
    pricing.findIndex(
      item => item.id === id
    );

  if (index === -1) {
    return null;
  }

  const [
    deleted
  ] =
    pricing.splice(
      index,
      1
    );

  await savePricing(
    `feat: delete pricing item #${id}`
  );

  return deleted;
}

export function getPricingCategoryLabel(
  category: PricingCategory
): string {
  const labels: Record<
    PricingCategory,
    string
  > = {
    developpement:
      '💻 Développement',
    fivem:
      '🎮 FiveM',
    discord:
      '🤖 Discord',
    site:
      '🌐 Site web',
    maintenance:
      '🔧 Maintenance',
    autre:
      '📦 Autre'
  };

  return labels[category];
}