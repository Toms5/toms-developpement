import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync
} from 'node:fs';
import { dirname, resolve } from 'node:path';

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
  clientId: string;
  description: string;
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

const STATUS_LABELS: Record<ProjectStatus, string> = {
  planifie: '📝 Planifié',
  preparation: '🟡 En préparation',
  developpement: '🔵 En développement',
  test: '🟣 En test',
  termine: '🟢 Terminé',
  pause: '🔴 En pause'
};

function ensureDataFile(): void {
  const directory = dirname(DATA_FILE);

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

function loadProjects(): Project[] {
  ensureDataFile();

  try {
    const content = readFileSync(
      DATA_FILE,
      'utf8'
    );

    const parsed: unknown = JSON.parse(content);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((project: Project) => ({
      ...project,
      tasks: Array.isArray(project.tasks)
        ? project.tasks
        : [],
      history: Array.isArray(project.history)
        ? project.history
        : []
    }));
  } catch {
    return [];
  }
}

function saveProjects(
  projects: Project[]
): void {
  ensureDataFile();

  writeFileSync(
    DATA_FILE,
    JSON.stringify(
      projects,
      null,
      2
    ),
    'utf8'
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
  const projects = loadProjects();

  const project = projects.find(
    item =>
      item.id === projectId
  );

  if (!project) {
    return null;
  }

  project.history.push({
    action,
    userId,
    details,
    createdAt:
      new Date().toISOString()
  });

  project.updatedAt =
    new Date().toISOString();

  saveProjects(projects);

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
  clientId: string,
  description: string,
  ticketChannelId?: string,
  ticketNumber?: string,
  createdById?: string
): Project {
  const projects = loadProjects();

  const now =
    new Date().toISOString();

  const project: Project = {
    id: getNextProjectId(projects),
    name,
    clientId,
    description,
    status: 'planifie',
    tasks: [],
    history: [],
    ticketChannelId,
    ticketNumber,
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

  saveProjects(projects);

  return project;
}

export function updateProjectStatus(
  projectId: number,
  status: ProjectStatus,
  changedById?: string
): Project | null {
  const projects = loadProjects();

  const project = projects.find(
    item =>
      item.id === projectId
  );

  if (!project) {
    return null;
  }

  const oldStatus = project.status;

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

  saveProjects(projects);

  return project;
}

export function deleteProject(
  projectId: number,
  deletedById?: string
): Project | null {
  const projects = loadProjects();

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

  projects.splice(index, 1);

  saveProjects(projects);

  return deletedProject;
}

export function addTask(
  projectId: number,
  name: string,
  userId?: string
): Project | null {
  const projects = loadProjects();

  const project = projects.find(
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

  saveProjects(projects);

  return project;
}

export function completeTask(
  projectId: number,
  taskId: number,
  userId?: string
): Project | null {
  const projects = loadProjects();

  const project = projects.find(
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

  saveProjects(projects);

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

export function getProjectSummary(
  project: Project
): string {
  const progress =
    getProjectProgress(project);

  const completed =
    project.tasks.filter(
      task => task.completed
    ).length;

  return [
    `📦 **${project.name}**`,
    `👤 Client : <@${project.clientId}>`,
    `📊 Statut : ${getStatusLabel(project.status)}`,
    `📈 Progression : **${progress}%**`,
    `📋 Tâches : **${completed}/${project.tasks.length}**`
  ].join('\n');
}