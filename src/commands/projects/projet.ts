import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  PermissionFlagsBits,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  SlashCommandBuilder,
  type ChatInputCommandInteraction
} from 'discord.js';

import type { Command } from '../../types/command.js';

import {
  addTask,
  completeTask,
  createProject,
  deleteProject,
  getProject,
  getProjects,
  getProjectHistory,
  getProjectProgress,
  getStatusLabel,
  updateProjectStatus,
  type ProjectStatus
} from '../../services/projectService.js';

import {
  getProjectRepository
} from '../../services/projectRepositoryService.js';

const STATUS_OPTIONS: {
  value: ProjectStatus;
  label: string;
  emoji: string;
}[] = [
  {
    value: 'planifie',
    label: 'Planifié',
    emoji: '📝'
  },
  {
    value: 'preparation',
    label: 'En préparation',
    emoji: '🟡'
  },
  {
    value: 'developpement',
    label: 'En développement',
    emoji: '🔵'
  },
  {
    value: 'test',
    label: 'En test',
    emoji: '🟣'
  },
  {
    value: 'termine',
    label: 'Terminé',
    emoji: '🟢'
  },
  {
    value: 'pause',
    label: 'En pause',
    emoji: '🔴'
  }
];

function isStaff(
  interaction: ChatInputCommandInteraction
): boolean {
  return (
    interaction.memberPermissions?.has(
      PermissionFlagsBits.Administrator
    ) ?? false
  );
}

function buildProjectEmbed(
  projectId: number
): EmbedBuilder {
  const project =
    getProject(projectId);

  if (!project) {
    return new EmbedBuilder()
      .setTitle('❌ Projet introuvable')
      .setDescription(
        'Ce projet n’existe plus.'
      );
  }

  const progress =
    getProjectProgress(project);

  const completed =
    project.tasks.filter(
      task => task.completed
    ).length;

  const tasks =
    project.tasks
      .slice(0, 15)
      .map(
        task =>
          `${task.completed ? '☑️' : '⬜'} **#${task.id}** — ${task.name}`
      );

  const taskText =
    tasks.length > 0
      ? tasks.join('\n')
      : 'Aucune tâche pour le moment.';

  const repository =
    getProjectRepository(project.id);

  const repositoryText =
    repository
      ? `🔗 **Repository GitHub :** ${repository.url}`
      : '🔗 **Repository GitHub :** Aucun repository lié.';

  return new EmbedBuilder()
    .setTitle(
      `📦 Projet #${project.id} — ${project.name}`
    )
    .setDescription(
      [
        `👤 **Client :** <@${project.clientId}>`,
        '',
        `📊 **Statut :** ${getStatusLabel(project.status)}`,
        `📈 **Progression :** ${progress}%`,
        `📋 **Tâches :** ${completed}/${project.tasks.length}`,
        '',
        repositoryText,
        '',
        '### 📝 Description',
        project.description,
        '',
        '### 📋 Tâches',
        taskText,
        project.tasks.length > 15
          ? `… et **${project.tasks.length - 15}** autre(s) tâche(s).`
          : ''
      ]
        .filter(Boolean)
        .join('\n')
    )
    .setFooter({
      text:
        "Tom's Développement • Gestion de projet"
    })
    .setTimestamp();
}

function buildProjectButtons(
  projectId: number
): ActionRowBuilder<ButtonBuilder>[] {
  const main =
    new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(
            `project:view:${projectId}`
          )
          .setLabel('Détails')
          .setEmoji('🔎')
          .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
          .setCustomId(
            `project:tasks:${projectId}`
          )
          .setLabel('Tâches')
          .setEmoji('📋')
          .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
          .setCustomId(
            `project:history:${projectId}`
          )
          .setLabel('Historique')
          .setEmoji('🕘')
          .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
          .setCustomId(
            `project:status:${projectId}`
          )
          .setLabel('Statut')
          .setEmoji('📊')
          .setStyle(ButtonStyle.Primary)
      );

  const management =
    new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(
            `project:addtask:${projectId}`
          )
          .setLabel('Ajouter une tâche')
          .setEmoji('➕')
          .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
          .setCustomId(
            `project:delete:${projectId}`
          )
          .setLabel('Supprimer')
          .setEmoji('🗑️')
          .setStyle(ButtonStyle.Danger)
      );

  const repository =
    getProjectRepository(projectId);

  const components:
    ActionRowBuilder<ButtonBuilder>[] = [
      main
    ];

  if (repository) {
    const repositoryButton =
      new ButtonBuilder()
        .setLabel('Repository GitHub')
        .setEmoji('🔗')
        .setStyle(ButtonStyle.Link)
        .setURL(repository.url);

    components.push(
      new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          repositoryButton
        )
    );
  }

  components.push(
    management
  );

  return components;
}

function buildProjectHistory(
  projectId: number
): EmbedBuilder {
  const project =
    getProject(projectId);

  if (!project) {
    return new EmbedBuilder()
      .setTitle('❌ Projet introuvable');
  }

  const history =
    getProjectHistory(projectId)
      .slice(-15)
      .reverse();

  const lines =
    history.map(entry => {
      const date =
        new Date(
          entry.createdAt
        ).toLocaleString('fr-FR');

      return [
        `**${entry.action}**`,
        `👤 <@${entry.userId}>`,
        `> ${entry.details}`,
        `🕘 ${date}`
      ].join('\n');
    });

  return new EmbedBuilder()
    .setTitle(
      `🕘 Historique — Projet #${project.id}`
    )
    .setDescription(
      lines.length > 0
        ? lines.join('\n\n')
        : 'Aucun historique disponible.'
    )
    .setFooter({
      text:
        "Tom's Développement • Historique"
    })
    .setTimestamp();
}

function buildTaskEmbed(
  projectId: number
): EmbedBuilder {
  const project =
    getProject(projectId);

  if (!project) {
    return new EmbedBuilder()
      .setTitle('❌ Projet introuvable');
  }

  const lines =
    project.tasks.length > 0
      ? project.tasks.map(
          task =>
            `${task.completed ? '☑️' : '⬜'} **#${task.id}** — ${task.name}`
        )
      : [
          'Aucune tâche.',
          '',
          'Utilisez **Ajouter une tâche** pour commencer.'
        ];

  return new EmbedBuilder()
    .setTitle(
      `📋 Tâches — Projet #${project.id}`
    )
    .setDescription(
      lines.join('\n')
    )
    .setFooter({
      text:
        "Tom's Développement • Tâches"
    })
    .setTimestamp();
}

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('projet')
    .setDescription(
      'Gestion des projets Tom\'s Développement.'
    )
    .addSubcommand(sub =>
      sub
        .setName('dashboard')
        .setDescription(
          'Affiche le tableau de bord des projets.'
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('creer')
        .setDescription(
          'Crée un nouveau projet.'
        )
        .addStringOption(option =>
          option
            .setName('nom')
            .setDescription(
              'Nom du projet.'
            )
            .setRequired(true)
        )
        .addUserOption(option =>
          option
            .setName('client')
            .setDescription(
              'Client du projet.'
            )
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('description')
            .setDescription(
              'Description du projet.'
            )
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('liste')
        .setDescription(
          'Affiche la liste des projets.'
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('voir')
        .setDescription(
          'Affiche un projet.'
        )
        .addIntegerOption(option =>
          option
            .setName('id')
            .setDescription(
              'Identifiant du projet.'
            )
            .setRequired(true)
            .setMinValue(1)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('statut')
        .setDescription(
          'Modifie le statut d’un projet.'
        )
        .addIntegerOption(option =>
          option
            .setName('id')
            .setDescription(
              'Identifiant du projet.'
            )
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('statut')
            .setDescription(
              'Nouveau statut.'
            )
            .setRequired(true)
            .addChoices(
              ...STATUS_OPTIONS.map(
                status => ({
                  name:
                    `${status.emoji} ${status.label}`,
                  value:
                    status.value
                })
              )
            )
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('supprimer')
        .setDescription(
          'Supprime un projet.'
        )
        .addIntegerOption(option =>
          option
            .setName('id')
            .setDescription(
              'Identifiant du projet.'
            )
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('tache-ajouter')
        .setDescription(
          'Ajoute une tâche à un projet.'
        )
        .addIntegerOption(option =>
          option
            .setName('id')
            .setDescription(
              'Identifiant du projet.'
            )
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('nom')
            .setDescription(
              'Nom de la tâche.'
            )
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('tache-terminee')
        .setDescription(
          'Termine une tâche.'
        )
        .addIntegerOption(option =>
          option
            .setName('id')
            .setDescription(
              'Identifiant du projet.'
            )
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option
            .setName('tache')
            .setDescription(
              'Numéro de la tâche.'
            )
            .setRequired(true)
            .setMinValue(1)
        )
    ),

  async execute(
    interaction: ChatInputCommandInteraction
  ) {
    await interaction.deferReply();

    const subcommand =
      interaction.options.getSubcommand();

    if (
      [
        'creer',
        'statut',
        'supprimer',
        'tache-ajouter',
        'tache-terminee'
      ].includes(subcommand) &&
      !isStaff(interaction)
    ) {
      await interaction.editReply({
        content:
          '❌ Cette action est réservée à l’équipe de développement.'
      });

      return;
    }

    if (subcommand === 'dashboard') {
      const projects =
        getProjects();

      const description =
        projects.length === 0
          ? [
              'Aucun projet enregistré.',
              '',
              'Utilisez `/projet creer` pour créer votre premier projet.'
            ].join('\n')
          : projects
              .map(
                project => {
                  const repository =
                    getProjectRepository(
                      project.id
                    );

                  return [
                    `### 📦 #${project.id} — ${project.name}`,
                    `👤 <@${project.clientId}>`,
                    `${getStatusLabel(project.status)} • ${getProjectProgress(project)}%`,
                    repository
                      ? `🔗 [Repository GitHub](${repository.url})`
                      : '🔗 Aucun repository GitHub lié'
                  ].join('\n');
                }
              )
              .join('\n\n');

      const embed =
        new EmbedBuilder()
          .setTitle(
            "📊 Tom's Développement — Dashboard"
          )
          .setDescription(
            description
          )
          .addFields({
            name: '📦 Projets',
            value:
              `**${projects.length}** projet(s)`
          })
          .setFooter({
            text:
              "Tom's Développement • Dashboard"
          })
          .setTimestamp();

      const components:
        ActionRowBuilder<ButtonBuilder>[] = [];

      if (projects.length > 0) {
        const buttons =
          projects
            .slice(0, 5)
            .map(
              project =>
                new ButtonBuilder()
                  .setCustomId(
                    `project:view:${project.id}`
                  )
                  .setLabel(
                    `#${project.id}`
                  )
                  .setStyle(
                    ButtonStyle.Primary
                  )
            );

        components.push(
          new ActionRowBuilder<ButtonBuilder>()
            .addComponents(buttons)
        );
      }

      await interaction.editReply({
        embeds: [embed],
        components
      });

      return;
    }

    if (subcommand === 'creer') {
      const name =
        interaction.options.getString(
          'nom',
          true
        );

      const client =
        interaction.options.getUser(
          'client',
          true
        );

      const description =
        interaction.options.getString(
          'description',
          true
        );

      const project =
        createProject(
          name,
          client.id,
          description,
          undefined,
          undefined,
          interaction.user.id
        );

      await interaction.editReply({
        embeds: [
          buildProjectEmbed(
            project.id
          )
        ],
        components:
          buildProjectButtons(
            project.id
          )
      });

      return;
    }

    if (subcommand === 'liste') {
      const projects =
        getProjects();

      const embed =
        new EmbedBuilder()
          .setTitle(
            "📦 Projets — Tom's Développement"
          )
          .setDescription(
            projects.length === 0
              ? 'Aucun projet enregistré.'
              : projects
                  .map(
                    project => {
                      const repository =
                        getProjectRepository(
                          project.id
                        );

                      return [
                        `### #${project.id} — ${project.name}`,
                        `👤 <@${project.clientId}>`,
                        `${getStatusLabel(project.status)} • ${getProjectProgress(project)}%`,
                        repository
                          ? `🔗 [Repository GitHub](${repository.url})`
                          : '🔗 Aucun repository GitHub lié'
                      ].join('\n');
                    }
                  )
                  .join('\n\n')
          )
          .setFooter({
            text:
              "Tom's Développement • Projets"
          })
          .setTimestamp();

      await interaction.editReply({
        embeds: [embed]
      });

      return;
    }

    const projectId =
      interaction.options.getInteger(
        'id',
        true
      );

    const project =
      getProject(projectId);

    if (!project) {
      await interaction.editReply({
        content:
          `❌ Le projet **#${projectId}** n’existe pas.`
      });

      return;
    }

    if (subcommand === 'voir') {
      await interaction.editReply({
        embeds: [
          buildProjectEmbed(
            projectId
          )
        ],
        components:
          buildProjectButtons(
            projectId
          )
      });

      return;
    }

    if (subcommand === 'statut') {
      const status =
        interaction.options.getString(
          'statut',
          true
        ) as ProjectStatus;

      const updated =
        updateProjectStatus(
          projectId,
          status,
          interaction.user.id
        );

      await interaction.editReply({
        embeds: [
          buildProjectEmbed(
            updated!.id
          )
        ],
        components:
          buildProjectButtons(
            updated!.id
          )
      });

      return;
    }

    if (subcommand === 'supprimer') {
      const deleted =
        deleteProject(
          projectId,
          interaction.user.id
        );

      await interaction.editReply({
        content:
          deleted
            ? `🗑️ Le projet **#${projectId} — ${deleted.name}** a été supprimé.`
            : '❌ Impossible de supprimer ce projet.'
      });

      return;
    }

    if (subcommand === 'tache-ajouter') {
      const taskName =
        interaction.options.getString(
          'nom',
          true
        );

      const updated =
        addTask(
          projectId,
          taskName,
          interaction.user.id
        );

      await interaction.editReply({
        embeds: [
          buildTaskEmbed(
            updated!.id
          )
        ],
        components:
          buildProjectButtons(
            updated!.id
          )
      });

      return;
    }

    if (subcommand === 'tache-terminee') {
      const taskId =
        interaction.options.getInteger(
          'tache',
          true
        );

      const updated =
        completeTask(
          projectId,
          taskId,
          interaction.user.id
        );

      if (!updated) {
        await interaction.editReply({
          content:
            `❌ La tâche **#${taskId}** n’existe pas.`
        });

        return;
      }

      await interaction.editReply({
        embeds: [
          buildTaskEmbed(
            updated.id
          )
        ],
        components:
          buildProjectButtons(
            updated.id
          )
      });
    }
  }
};

export {
  buildProjectEmbed,
  buildProjectButtons,
  buildProjectHistory,
  buildTaskEmbed
};

export default command;