import fs from 'node:fs';
import path from 'node:path';

import {
  syncGitHubFile,
  writeGitHubFile
} from './githubStorage.js';

export interface ProjectRepository {
  projectId: number;
  url: string;
  updatedAt: string;
  updatedBy: string;
}

const DATA_DIR =
  path.resolve('data');

const DATA_FILE =
  path.join(
    DATA_DIR,
    'project-repositories.json'
  );

const GITHUB_FILE =
  'data/project-repositories.json';

function ensureDataFile(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(
      DATA_DIR,
      {
        recursive: true
      }
    );
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(
      DATA_FILE,
      '{}',
      'utf8'
    );
  }
}

function readData():
  Record<string, ProjectRepository> {
  ensureDataFile();

  try {
    const content =
      fs.readFileSync(
        DATA_FILE,
        'utf8'
      );

    const parsed: unknown =
      JSON.parse(content);

    if (
      !parsed ||
      typeof parsed !== 'object' ||
      Array.isArray(parsed)
    ) {
      return {};
    }

    return parsed as Record<
      string,
      ProjectRepository
    >;
  } catch {
    return {};
  }
}

function writeData(
  data: Record<
    string,
    ProjectRepository
  >,
  message: string
): void {
  ensureDataFile();

  const content =
    JSON.stringify(
      data,
      null,
      2
    );

  fs.writeFileSync(
    DATA_FILE,
    content,
    'utf8'
  );

  void writeGitHubFile(
    GITHUB_FILE,
    content,
    message
  ).catch(error => {
    console.error(
      '❌ Impossible de synchroniser project-repositories.json avec GitHub :',
      error
    );
  });
}

export async function initializeProjectRepositoryStorage(): Promise<void> {
  const content =
    await syncGitHubFile(
      GITHUB_FILE,
      '{}'
    );

  ensureDataFile();

  fs.writeFileSync(
    DATA_FILE,
    content,
    'utf8'
  );

  console.log(
    '☁️ Repositories projets synchronisés depuis GitHub.'
  );
}

export function getProjectRepository(
  projectId: number
): ProjectRepository | null {
  const data =
    readData();

  return (
    data[String(projectId)] ??
    null
  );
}

export function setProjectRepository(
  projectId: number,
  url: string,
  userId: string
): ProjectRepository {
  const data =
    readData();

  const repository:
    ProjectRepository = {
      projectId,
      url,
      updatedAt:
        new Date().toISOString(),
      updatedBy: userId
    };

  data[String(projectId)] =
    repository;

  writeData(
    data,
    `feat: link github repository to project #${projectId}`
  );

  return repository;
}

export function removeProjectRepository(
  projectId: number
): boolean {
  const data =
    readData();

  if (
    !data[String(projectId)]
  ) {
    return false;
  }

  delete data[
    String(projectId)
  ];

  writeData(
    data,
    `feat: unlink github repository from project #${projectId}`
  );

  return true;
}

export function isValidGitHubRepositoryUrl(
  value: string
): boolean {
  try {
    const url =
      new URL(value);

    return (
      url.protocol === 'https:' &&
      url.hostname ===
        'github.com' &&
      url.pathname
        .split('/')
        .filter(Boolean)
        .length >= 2
    );
  } catch {
    return false;
  }
}