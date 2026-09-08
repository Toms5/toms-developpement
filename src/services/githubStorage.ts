import { config } from '../config/config.js';

interface GitHubFileResponse {
  content?: string;
  sha?: string;
}

const API_BASE_URL =
  'https://api.github.com';

const writeQueues =
  new Map<string, Promise<void>>();

function getFileUrl(
  filePath: string
): string {
  return [
    API_BASE_URL,
    'repos',
    config.githubOwner,
    config.githubRepo,
    'contents',
    filePath
  ].join('/');
}

function getHeaders(): Record<string, string> {
  return {
    Accept:
      'application/vnd.github+json',
    Authorization:
      `Bearer ${config.githubToken}`,
    'X-GitHub-Api-Version':
      '2022-11-28',
    'Content-Type':
      'application/json',
    'User-Agent':
      "Tom's-Developpement-Bot"
  };
}

function encodeContent(
  content: string
): string {
  return Buffer.from(
    content,
    'utf8'
  ).toString('base64');
}

function decodeContent(
  content: string
): string {
  return Buffer.from(
    content.replace(/\n/g, ''),
    'base64'
  ).toString('utf8');
}

export async function readGitHubFile(
  filePath: string
): Promise<{
  content: string;
  sha: string;
} | null> {
  const response =
    await fetch(
      `${getFileUrl(filePath)}?ref=${encodeURIComponent(config.githubBranch)}`,
      {
        method: 'GET',
        headers: getHeaders()
      }
    );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const body =
      await response.text();

    throw new Error(
      `GitHub GET ${filePath} failed (${response.status}): ${body}`
    );
  }

  const data =
    await response.json() as GitHubFileResponse;

  if (
    !data.content ||
    !data.sha
  ) {
    throw new Error(
      `Le fichier GitHub ${filePath} est invalide.`
    );
  }

  return {
    content:
      decodeContent(data.content),
    sha: data.sha
  };
}

async function updateGitHubFile(
  filePath: string,
  content: string,
  message: string
): Promise<void> {
  let current =
    await readGitHubFile(filePath);

  for (
    let attempt = 1;
    attempt <= 3;
    attempt++
  ) {
    const body: Record<
      string,
      unknown
    > = {
      message,
      content:
        encodeContent(content),
      branch:
        config.githubBranch
    };

    if (current?.sha) {
      body.sha = current.sha;
    }

    const response =
      await fetch(
        getFileUrl(filePath),
        {
          method: 'PUT',
          headers: getHeaders(),
          body:
            JSON.stringify(body)
        }
      );

    if (response.ok) {
      return;
    }

    if (
      response.status === 409 &&
      attempt < 3
    ) {
      current =
        await readGitHubFile(
          filePath
        );

      continue;
    }

    const bodyText =
      await response.text();

    throw new Error(
      `GitHub PUT ${filePath} failed (${response.status}): ${bodyText}`
    );
  }
}

export function writeGitHubFile(
  filePath: string,
  content: string,
  message: string
): Promise<void> {
  const previous =
    writeQueues.get(filePath) ??
    Promise.resolve();

  const next =
    previous
      .catch(() => undefined)
      .then(() =>
        updateGitHubFile(
          filePath,
          content,
          message
        )
      );

  writeQueues.set(
    filePath,
    next
  );

  return next;
}

export async function syncGitHubFile(
  filePath: string,
  fallbackContent: string
): Promise<string> {
  const file =
    await readGitHubFile(filePath);

  if (file) {
    return file.content;
  }

  await writeGitHubFile(
    filePath,
    fallbackContent,
    `chore: initialize ${filePath}`
  );

  return fallbackContent;
}