import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync
} from 'node:fs';

import {
  dirname,
  resolve
} from 'node:path';

import {
  syncGitHubFile,
  writeGitHubFile
} from './githubStorage.js';

export type ProjectStatus =
  | 'planifie'
  | 'preparation'
  | 'developpement'
  | 'test'
  | 'termine'
  | 'pause';

export interface ProjectTask {
  id: number;
  name: string;
  completed: boolean;
}

export interface ProjectHistoryEntry {
  action: string;
  userId: string;
  details: string;
  createdAt: string;
}

export interface Project {
  id: number;
  name: string;
  clientId?: string;
  description: string;

  price: number;
  paidAmount: number;
  quoteId?: number;

  status: ProjectStatus;

  tasks: ProjectTask[];
  history: ProjectHistoryEntry[];

  ticketChannelId?: string;
  ticketNumber?: string;

  createdAt: string;
  updatedAt: string;
}

const DATA_FILE = resolve(
  process.cwd(),
  'data',
  'projects.json'
);

const GITHUB_FILE =
  'data/projects.json';

const STATUS_LABELS: Record<
  ProjectStatus,
  string
> = {
  planifie: '📝 Planifié',
  preparation: '🟡 En préparation',
  developpement: '🔵 En développement',
  test: '🟣 En test',
  termine: '🟢 Terminé',
  pause: '🔴 En pause'
};

function ensureDataFile(): void {
  const directory =
    dirname(DATA_FILE);

  if (!existsSync(directory)) {
    mkdirSync(directory, {
      recursive: true
    });
  }

  if (!existsSync(DATA_FILE)) {
    writeFileSync(
      DATA_FILE,
      '[]',
      'utf8'
    );
  }
}

function normalizeProject(
  project: Partial<Project>
): Project {
  return {
    id: project.id ?? 0,
    name: project.name ?? 'Projet sans nom',
    ...(project.clientId
      ? { clientId: project.clientId }
      : {}),
    description:
      project.description ??
      'Aucune description.',
    price:
      typeof project.price === 'number'
        ? Math.max(0, project.price)
        : 0,
    paidAmount:
      typeof project.paidAmount === 'number'
        ? Math.max(0, project.paidAmount)
        : 0,
    ...(typeof project.quoteId === 'number'
      ? { quoteId: project.quoteId }
      : {}),
    status:
      project.status ?? 'planifie',
    tasks:
      Array.isArray(project.tasks)
        ? project.tasks
        : [],
    history:
      Array.isArray(project.history)
        ? project.history
        : [],
    ...(project.ticketChannelId
      ? {
          ticketChannelId:
            project.ticketChannelId
        }
      : {}),
    ...(project.ticketNumber
      ? {
          ticketNumber:
            project.ticketNumber
        }
      : {}),
    createdAt:
      project.createdAt ??
      new Date().toISOString(),
    updatedAt:
      project.updatedAt ??
      new Date().toISOString()
  };
}

function loadProjects(): Project[] {
  ensureDataFile();

  try {
    const content =
      readFileSync(
        DATA_FILE,
        'utf8'
      );

    const parsed: unknown =
      JSON.parse(content);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map(
      project =>
        normalizeProject(
          project as Partial<Project>
        )
    );
  } catch {
    return [];
  }
}

function saveProjects(
  projects: Project[],
  commitMessage =
    'chore: update projects'
): void {
  ensureDataFile();

  const content =
    JSON.stringify(
      projects,
      null,
      2
    );

  writeFileSync(
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
      `❌ Impossible de synchroniser ${GITHUB_FILE} avec GitHub :`,
      error
    );
  });
}

export async function initializeProjectStorage(): Promise<void> {
  ensureDataFile();

  const localContent =
    readFileSync(
      DATA_FILE,
      'utf8'
    );

  const syncedContent =
    await syncGitHubFile(
      GITHUB_FILE,
      localContent
    );

  let projects: unknown;

  try {
    projects =
      JSON.parse(
        syncedContent
      );
  } catch {
    projects = [];
  }

  const normalized =
    Array.isArray(projects)
      ? projects.map(
          project =>
            normalizeProject(
              project as Partial<Project>
            )
        )
      : [];

  writeFileSync(
    DATA_FILE,
    JSON.stringify(
      normalized,
      null,
      2
    ),
    'utf8'
  );

  console.log(
    '☁️ Projets synchronisés depuis GitHub.'
  );
}

function getNextProjectId(
  projects: Project[]
): number {
  if (projects.length === 0) {
    return 1;
  }

  return (
    Math.max(
      ...projects.map(
        project => project.id
      )
    ) + 1
  );
}

export function getStatusLabel(
  status: ProjectStatus
): string {
  return STATUS_LABELS[status];
}

export function getProjects(): Project[] {
  return loadProjects();
}

export function getProject(
  projectId: number
): Project | null {
  return (
    loadProjects().find(
      project =>
        project.id === projectId
    ) ?? null
  );
}

export function getProjectByTicket(
  ticketChannelId: string
): Project | null {
  return (
    loadProjects().find(
      project =>
        project.ticketChannelId ===
        ticketChannelId
    ) ?? null
  );
}

export function addProjectHistory(
  projectId: number,
  action: string,
  userId: string,
  details: string
): Project | null {
  const projects =
    loadProjects();

  const project =
    projects.find(
      item =>
        item.id === projectId
    );

  if (!project) {
    return null;
  }

  const now =
    new Date().toISOString();

  project.history.push({
    action,
    userId,
    details,
    createdAt: now
  });

  project.updatedAt = now;

  saveProjects(
    projects,
    `chore: update history for project #${projectId}`
  );

  return project;
}

export function getProjectHistory(
  projectId: number
): ProjectHistoryEntry[] {
  const project =
    getProject(projectId);

  return project?.history ?? [];
}

export function createProject(
  name: string,
  clientId: string | undefined,
  description: string,
  ticketChannelId?: string,
  ticketNumber?: string,
  createdById?: string,
  price = 0,
  paidAmount = 0,
  quoteId?: number
): Project {
  const projects =
    loadProjects();

  const now =
    new Date().toISOString();

  const safePrice =
    Math.max(
      0,
      price
    );

  const safePaidAmount =
    Math.min(
      safePrice,
      Math.max(
        0,
        paidAmount
      )
    );

  const project: Project = {
    id:
      getNextProjectId(
        projects
      ),
    name,
    ...(clientId
      ? { clientId }
      : {}),
    description,
    price: safePrice,
    paidAmount:
      safePaidAmount,
    ...(typeof quoteId === 'number'
      ? { quoteId }
      : {}),
    status:
      'planifie',
    tasks: [],
    history: [],
    ...(ticketChannelId
      ? {
          ticketChannelId
        }
      : {}),
    ...(ticketNumber
      ? {
          ticketNumber
        }
      : {}),
    createdAt: now,
    updatedAt: now
  };

  if (createdById) {
    project.history.push({
      action: 'Création',
      userId: createdById,
      details:
        `Projet "${name}" créé.`,
      createdAt: now
    });
  }

  projects.push(project);

  saveProjects(
    projects,
    `feat: create project #${project.id}`
  );

  return project;
}

export function updateProjectStatus(
  projectId: number,
  status: ProjectStatus,
  changedById?: string
): Project | null {
  const projects =
    loadProjects();

  const project =
    projects.find(
      item =>
        item.id === projectId
    );

  if (!project) {
    return null;
  }

  const oldStatus =
    project.status;

  if (oldStatus === status) {
    return project;
  }

  project.status = status;

  project.updatedAt =
    new Date().toISOString();

  if (changedById) {
    project.history.push({
      action: 'Statut modifié',
      userId: changedById,
      details:
        `${getStatusLabel(oldStatus)} → ${getStatusLabel(status)}`,
      createdAt:
        project.updatedAt
    });
  }

  saveProjects(
    projects,
    `feat: update project #${projectId} status`
  );

  return project;
}

export function updateProjectFinance(
  projectId: number,
  price: number,
  paidAmount: number,
  userId?: string
): Project | null {
  const projects =
    loadProjects();

  const project =
    projects.find(
      item =>
        item.id === projectId
    );

  if (!project) {
    return null;
  }

  const safePrice =
    Math.max(
      0,
      price
    );

  const safePaidAmount =
    Math.min(
      safePrice,
      Math.max(
        0,
        paidAmount
      )
    );

  const oldPrice =
    project.price;

  const oldPaid =
    project.paidAmount;

  project.price =
    safePrice;

  project.paidAmount =
    safePaidAmount;

  project.updatedAt =
    new Date().toISOString();

  if (userId) {
    project.history.push({
      action: 'Finances modifiées',
      userId,
      details:
        [
          `Prix : ${formatPrice(oldPrice)} → ${formatPrice(safePrice)}`,
          `Payé : ${formatPrice(oldPaid)} → ${formatPrice(safePaidAmount)}`
        ].join(' | '),
      createdAt:
        project.updatedAt
    });
  }

  saveProjects(
    projects,
    `feat: update finances for project #${projectId}`
  );

  return project;
}

export function addProjectPayment(
  projectId: number,
  amount: number,
  userId?: string
): Project | null {
  const projects =
    loadProjects();

  const project =
    projects.find(
      item =>
        item.id === projectId
    );

  if (!project) {
    return null;
  }

  const safeAmount =
    Math.max(
      0,
      amount
    );

  const remaining =
    getProjectRemainingAmount(
      project
    );

  const payment =
    Math.min(
      safeAmount,
      remaining
    );

  if (payment <= 0) {
    return project;
  }

  project.paidAmount +=
    payment;

  project.updatedAt =
    new Date().toISOString();

  if (userId) {
    project.history.push({
      action: 'Paiement enregistré',
      userId,
      details:
        `Paiement de ${formatPrice(payment)} enregistré.`,
      createdAt:
        project.updatedAt
    });
  }

  saveProjects(
    projects,
    `feat: add payment to project #${projectId}`
  );

  return project;
}

export function deleteProject(
  projectId: number,
  deletedById?: string
): Project | null {
  const projects =
    loadProjects();

  const index =
    projects.findIndex(
      project =>
        project.id === projectId
    );

  if (index === -1) {
    return null;
  }

  const deletedProject =
    projects[index];

  if (
    deletedProject &&
    deletedById
  ) {
    deletedProject.history.push({
      action: 'Suppression',
      userId: deletedById,
      details:
        `Projet "${deletedProject.name}" supprimé.`,
      createdAt:
        new Date().toISOString()
    });
  }

  projects.splice(
    index,
    1
  );

  saveProjects(
    projects,
    `feat: delete project #${projectId}`
  );

  return deletedProject;
}

export function addTask(
  projectId: number,
  name: string,
  userId?: string
): Project | null {
  const projects =
    loadProjects();

  const project =
    projects.find(
      item =>
        item.id === projectId
    );

  if (!project) {
    return null;
  }

  const nextTaskId =
    project.tasks.length === 0
      ? 1
      : Math.max(
          ...project.tasks.map(
            task => task.id
          )
        ) + 1;

  project.tasks.push({
    id: nextTaskId,
    name,
    completed: false
  });

  project.updatedAt =
    new Date().toISOString();

  if (userId) {
    project.history.push({
      action: 'Tâche ajoutée',
      userId,
      details:
        `Tâche #${nextTaskId} : "${name}"`,
      createdAt:
        project.updatedAt
    });
  }

  saveProjects(
    projects,
    `feat: add task to project #${projectId}`
  );

  return project;
}

export function completeTask(
  projectId: number,
  taskId: number,
  userId?: string
): Project | null {
  const projects =
    loadProjects();

  const project =
    projects.find(
      item =>
        item.id === projectId
    );

  if (!project) {
    return null;
  }

  const task =
    project.tasks.find(
      item =>
        item.id === taskId
    );

  if (!task) {
    return null;
  }

  if (!task.completed) {
    task.completed = true;

    project.updatedAt =
      new Date().toISOString();

    if (userId) {
      project.history.push({
        action: 'Tâche terminée',
        userId,
        details:
          `Tâche #${task.id} : "${task.name}"`,
        createdAt:
          project.updatedAt
      });
    }
  }

  saveProjects(
    projects,
    `feat: complete task #${taskId} on project #${projectId}`
  );

  return project;
}

export function getProjectProgress(
  project: Project
): number {
  if (project.tasks.length === 0) {
    return 0;
  }

  const completed =
    project.tasks.filter(
      task => task.completed
    ).length;

  return Math.round(
    (completed /
      project.tasks.length) *
      100
  );
}

export function getProjectRemainingAmount(
  project: Project
): number {
  return Math.max(
    0,
    project.price -
      project.paidAmount
  );
}

export function getProjectPaymentProgress(
  project: Project
): number {
  if (project.price <= 0) {
    return 0;
  }

  return Math.round(
    Math.min(
      100,
      (project.paidAmount /
        project.price) *
        100
    )
  );
}

export function formatPrice(
  amount: number
): string {
  return `${amount.toFixed(2).replace('.', ',')} €`;
}

export function getProjectSummary(
  project: Project
): string {
  const progress =
    getProjectProgress(
      project
    );

  const completed =
    project.tasks.filter(
      task => task.completed
    ).length;

  const remaining =
    getProjectRemainingAmount(
      project
    );

  return [
    `📦 **${project.name}**`,
    project.clientId
      ? `👤 Client : <@${project.clientId}>`
      : '👤 Client : Aucun client associé',
    `📊 Statut : ${getStatusLabel(project.status)}`,
    `📈 Progression : **${progress}%**`,
    `📋 Tâches : **${completed}/${project.tasks.length}**`,
    `💰 Prix : **${formatPrice(project.price)}**`,
    `💳 Payé : **${formatPrice(project.paidAmount)}**`,
    `📌 Reste : **${formatPrice(remaining)}**`
  ].join('\n');
}