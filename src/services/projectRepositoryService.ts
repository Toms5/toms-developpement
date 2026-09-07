import fs from 'node:fs';
import path from 'node:path';

export interface ProjectRepository {
  projectId: number;
  url: string;
  updatedAt: string;
  updatedBy: string;
}

const DATA_DIR = path.resolve('data');
const DATA_FILE = path.join(
  DATA_DIR,
  'project-repositories.json'
);

function ensureDataFile(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, {
      recursive: true
    });
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(
      DATA_FILE,
      '{}',
      'utf8'
    );
  }
}

function readData(): Record<
  string,
  ProjectRepository
> {
  ensureDataFile();

  try {
    const content =
      fs.readFileSync(
        DATA_FILE,
        'utf8'
      );

    return JSON.parse(content);
  } catch {
    return {};
  }
}

function writeData(
  data: Record<string, ProjectRepository>
): void {
  ensureDataFile();

  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify(
      data,
      null,
      2
    ),
    'utf8'
  );
}

export function getProjectRepository(
  projectId: number
): ProjectRepository | null {
  const data = readData();

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
  const data = readData();

  const repository: ProjectRepository = {
    projectId,
    url,
    updatedAt:
      new Date().toISOString(),
    updatedBy: userId
  };

  data[String(projectId)] =
    repository;

  writeData(data);

  return repository;
}

export function removeProjectRepository(
  projectId: number
): boolean {
  const data = readData();

  if (!data[String(projectId)]) {
    return false;
  }

  delete data[String(projectId)];

  writeData(data);

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
      url.hostname === 'github.com' &&
      url.pathname
        .split('/')
        .filter(Boolean)
        .length >= 2
    );
  } catch {
    return false;
  }
}