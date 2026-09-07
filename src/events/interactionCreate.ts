import {
  ActionRowBuilder,
  EmbedBuilder,
  Events,
  ModalBuilder,
  PermissionFlagsBits,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  type Interaction
} from 'discord.js';

import type { Command } from '../types/command.js';

import {
  createTicket,
  closeTicket,
  handleReviewSubmit,
  handleTicketRating,
  publishReview,
  showTicketTypeMenu
} from '../services/ticketService.js';

import {
  addTask,
  deleteProject,
  getProject,
  getProjectHistory,
  getProjectProgress,
  getStatusLabel,
  updateProjectStatus
} from '../services/projectService.js';

import {
  buildProjectButtons,
  buildProjectEmbed,
  buildProjectHistory,
  buildTaskEmbed
} from '../commands/projects/projet.js';

import { sendLog } from '../services/logger.js';

function isStaff(
  interaction: Interaction
): boolean {
  return (
    interaction.memberPermissions?.has(
      PermissionFlagsBits.Administrator
    ) ??
    false
  );
}

async function handleRulesAcceptance(
  interaction: any
): Promise<void> {
  const parts =
    interaction.customId.split(':');

  const roleId =
    parts[2];

  if (!roleId) {
    await interaction.reply({
      content:
        '❌ Le rôle associé à ce règlement est introuvable.',
      ephemeral: true
    });

    return;
  }

  await interaction.deferUpdate();

  const guild =
    interaction.guild;

  if (!guild) {
    await interaction.followUp({
      content:
        '❌ Cette action doit être effectuée sur un serveur.',
      ephemeral: true
    }).catch(() => null);

    return;
  }

  const member =
    await guild.members
      .fetch(interaction.user.id)
      .catch(() => null);

  if (!member) {
    await interaction.followUp({
      content:
        '❌ Impossible de récupérer ton profil Discord.',
      ephemeral: true
    }).catch(() => null);

    return;
  }

  const role =
    await guild.roles
      .fetch(roleId)
      .catch(() => null);

  if (!role) {
    await interaction.followUp({
      content:
        '❌ Le rôle associé à ce règlement n’existe plus.',
      ephemeral: true
    }).catch(() => null);

    return;
  }

  const botMember =
    guild.members.me;

  if (!botMember) {
    await interaction.followUp({
      content:
        '❌ Impossible de vérifier les permissions du bot.',
      ephemeral: true
    }).catch(() => null);

    return;
  }

  if (
    role.position >=
    botMember.roles.highest.position
  ) {
    await interaction.followUp({
      content:
        '❌ Je ne peux pas attribuer ce rôle : mon rôle est placé trop bas dans la hiérarchie Discord.',
      ephemeral: true
    }).catch(() => null);

    return;
  }

  if (
    !member.roles.cache.has(
      role.id
    )
  ) {
    await member.roles.add(
      role,
      'Acceptation du règlement'
    );
  }

  await sendLog(
    guild,
    new EmbedBuilder()
      .setTitle(
        '📜 Règlement accepté'
      )
      .setDescription(
        [
          `👤 Membre : ${member}`,
          `🆔 ID : \`${member.id}\``,
          `🎭 Rôle attribué : ${role}`
        ].join('\n')
      )
      .setTimestamp()
  );

  await interaction.followUp({
    content:
      member.roles.cache.has(role.id)
        ? `✅ Règlement accepté ! Le rôle **${role.name}** est déjà présent sur ton compte.`
        : `✅ Règlement accepté ! Le rôle **${role.name}** t’a été attribué.`,
    ephemeral: true
  }).catch(() => null);
}

async function handleHelpCategory(
  interaction: any
): Promise<void> {
  const category =
    interaction.values?.[0];

  const embeds: Record<
    string,
    EmbedBuilder
  > = {
    general:
      new EmbedBuilder()
        .setTitle('🏠 Commandes générales')
        .setDescription(
          [
            '`/help` — Affiche cette aide',
            '`/ping` — Vérifie la connexion du bot',
            '`/serverinfo` — Informations du serveur',
            '`/userinfo` — Informations d’un membre',
            '`/avis` — Statistiques des avis clients'
          ].join('\n')
        ),

    moderation:
      new EmbedBuilder()
        .setTitle('🛡️ Modération')
        .setDescription(
          [
            '`/clear` — Supprime des messages',
            '`/kick` — Expulse un membre',
            '`/ban` — Bannit un membre',
            '`/timeout` — Met un membre en timeout',
            '`/untimeout` — Retire un timeout'
          ].join('\n')
        ),

    tickets:
      new EmbedBuilder()
        .setTitle('🎫 Tickets')
        .setDescription(
          [
            '`/ticket-panel` — Installe le panneau de tickets',
            '',
            'Les tickets permettent de gérer les demandes clients :',
            '💻 Projet',
            '🐛 Bug',
            '💬 Question',
            '💰 Devis',
            '📞 Support',
            '📦 Autre',
            '',
            'À la fermeture : ⭐ note → 💬 commentaire → 👤 nom/anonyme → 🗄️ archivage'
          ].join('\n')
        ),

    projects:
      new EmbedBuilder()
        .setTitle('📦 Gestion des projets')
        .setDescription(
          [
            '`/projet dashboard` — Tableau de bord',
            '`/projet creer` — Créer un projet',
            '`/projet liste` — Lister les projets',
            '`/projet voir` — Voir un projet',
            '`/projet statut` — Modifier le statut',
            '`/projet supprimer` — Supprimer un projet',
            '`/projet tache-ajouter` — Ajouter une tâche',
            '`/projet tache-terminee` — Terminer une tâche',
            '',
            'Chaque projet possède maintenant un historique des actions.'
          ].join('\n')
        ),

    admin:
      new EmbedBuilder()
        .setTitle('📋 Administration')
        .setDescription(
          [
            '`/ticket-panel` — Configuration du panneau tickets',
            '',
            'Les événements importants sont enregistrés automatiquement dans **📋・logs**.',
            '',
            'Les actions sensibles sont réservées à l’équipe.'
          ].join('\n')
        )
  };

  const embed =
    embeds[category] ??
    new EmbedBuilder()
      .setTitle(
        '❌ Catégorie inconnue'
      );

  const menu =
    new StringSelectMenuBuilder()
      .setCustomId(
        'help:category'
      )
      .setPlaceholder(
        'Changer de catégorie'
      )
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('Général')
          .setEmoji('🏠')
          .setValue('general'),

        new StringSelectMenuOptionBuilder()
          .setLabel('Modération')
          .setEmoji('🛡️')
          .setValue('moderation'),

        new StringSelectMenuOptionBuilder()
          .setLabel('Tickets')
          .setEmoji('🎫')
          .setValue('tickets'),

        new StringSelectMenuOptionBuilder()
          .setLabel('Projets')
          .setEmoji('📦')
          .setValue('projects'),

        new StringSelectMenuOptionBuilder()
          .setLabel('Administration')
          .setEmoji('📋')
          .setValue('admin')
      );

  const row =
    new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(
        menu
      );

  await interaction.update({
    embeds: [embed],
    components: [row]
  });
}

async function handleProjectButton(
  interaction: any
): Promise<void> {
  const parts =
    interaction.customId.split(':');

  const action =
    parts[1];

  const projectId =
    Number(parts[2]);

  if (!Number.isInteger(projectId)) {
    return;
  }

  const project =
    getProject(projectId);

  if (!project) {
    await interaction.reply({
      content:
        `❌ Le projet **#${projectId}** n’existe plus.`,
      ephemeral: true
    });

    return;
  }

  if (action === 'view') {
    await interaction.update({
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

  if (action === 'tasks') {
    await interaction.update({
      embeds: [
        buildTaskEmbed(
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

  if (action === 'history') {
    await interaction.update({
      embeds: [
        buildProjectHistory(
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

  if (
    [
      'status',
      'addtask',
      'delete'
    ].includes(action) &&
    !isStaff(interaction)
  ) {
    await interaction.reply({
      content:
        '❌ Cette action est réservée à l’équipe.',
      ephemeral: true
    });

    return;
  }

  if (action === 'addtask') {
    const modal =
      new ModalBuilder()
        .setCustomId(
          `project:addtaskmodal:${projectId}`
        )
        .setTitle(
          '➕ Ajouter une tâche'
        );

    const input =
      new TextInputBuilder()
        .setCustomId(
          'task'
        )
        .setLabel(
          'Nom de la tâche'
        )
        .setPlaceholder(
          'Ex : Créer la page d’accueil'
        )
        .setStyle(
          TextInputStyle.Short
        )
        .setRequired(true)
        .setMaxLength(200);

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>()
        .addComponents(
          input
        )
    );

    await interaction.showModal(
      modal
    );

    return;
  }

  if (action === 'status') {
    const menu =
      new StringSelectMenuBuilder()
        .setCustomId(
          `project:status:${projectId}`
        )
        .setPlaceholder(
          'Choisir le nouveau statut'
        )
        .addOptions(
          {
            label: 'Planifié',
            value: 'planifie',
            emoji: '📝'
          },
          {
            label: 'En préparation',
            value: 'preparation',
            emoji: '🟡'
          },
          {
            label: 'En développement',
            value: 'developpement',
            emoji: '🔵'
          },
          {
            label: 'En test',
            value: 'test',
            emoji: '🟣'
          },
          {
            label: 'Terminé',
            value: 'termine',
            emoji: '🟢'
          },
          {
            label: 'En pause',
            value: 'pause',
            emoji: '🔴'
          }
        );

    await interaction.reply({
      content:
        '📊 Choisissez le nouveau statut :',
      components: [
        new ActionRowBuilder<StringSelectMenuBuilder>()
          .addComponents(
            menu
          )
      ],
      ephemeral: true
    });

    return;
  }

  if (action === 'delete') {
    const deleted =
      deleteProject(
        projectId,
        interaction.user.id
      );

    if (deleted) {
      await sendLog(
        interaction.guild!,
        new EmbedBuilder()
          .setTitle(
            '🗑️ Projet supprimé'
          )
          .setDescription(
            [
              `Projet : **#${deleted.id} — ${deleted.name}**`,
              `Supprimé par : <@${interaction.user.id}>`
            ].join('\n')
          )
          .setTimestamp()
      );
    }

    await interaction.update({
      content:
        deleted
          ? `🗑️ Le projet **#${projectId}** a été supprimé.`
          : '❌ Impossible de supprimer ce projet.',
      embeds: [],
      components: []
    });
  }
}

async function handleProjectStatus(
  interaction: any
): Promise<void> {
  const projectId =
    Number(
      interaction.customId.split(':')[2]
    );

  const status =
    interaction.values?.[0];

  if (
    !Number.isInteger(projectId) ||
    !status
  ) {
    return;
  }

  const updated =
    updateProjectStatus(
      projectId,
      status,
      interaction.user.id
    );

  if (!updated) {
    await interaction.update({
      content:
        '❌ Projet introuvable.',
      components: []
    });

    return;
  }

  await sendLog(
    interaction.guild!,
    new EmbedBuilder()
      .setTitle(
        '📊 Statut de projet modifié'
      )
      .setDescription(
        [
          `Projet : **#${updated.id} — ${updated.name}**`,
          `Nouveau statut : ${getStatusLabel(updated.status)}`,
          `Modifié par : <@${interaction.user.id}>`
        ].join('\n')
      )
      .setTimestamp()
  );

  await interaction.update({
    content:
      `✅ Le statut du projet **#${updated.id}** a été modifié.`,
    components: []
  });
}

async function handleProjectModal(
  interaction: any
): Promise<void> {
  const parts =
    interaction.customId.split(':');

  const projectId =
    Number(parts[2]);

  const taskName =
    interaction.fields
      .getTextInputValue(
        'task'
      )
      .trim();

  if (
    !Number.isInteger(projectId) ||
    !taskName
  ) {
    await interaction.reply({
      content:
        '❌ Données invalides.',
      ephemeral: true
    });

    return;
  }

  const project =
    addTask(
      projectId,
      taskName,
      interaction.user.id
    );

  if (!project) {
    await interaction.reply({
      content:
        '❌ Projet introuvable.',
      ephemeral: true
    });

    return;
  }

  await sendLog(
    interaction.guild!,
    new EmbedBuilder()
      .setTitle(
        '➕ Tâche ajoutée'
      )
      .setDescription(
        [
          `Projet : **#${project.id} — ${project.name}**`,
          `Tâche : **${taskName}**`,
          `Ajoutée par : <@${interaction.user.id}>`
        ].join('\n')
      )
      .setTimestamp()
  );

  await interaction.reply({
    embeds: [
      buildTaskEmbed(
        projectId
      )
    ],
    components:
      buildProjectButtons(
        projectId
      ),
    ephemeral: true
  });
}

export default {
  name: Events.InteractionCreate,

  async execute(
    interaction: Interaction
  ): Promise<void> {
    try {
      if (
        interaction.isChatInputCommand()
      ) {
        const command =
          interaction.client.commands.get(
            interaction.commandName
          ) as Command | undefined;

        if (!command) {
          await interaction.reply({
            content:
              '❌ Cette commande n’existe pas.',
            ephemeral: true
          });

          return;
        }

        await command.execute(
          interaction
        );

        return;
      }

      if (
        interaction.isButton()
      ) {
        if (
          interaction.customId.startsWith(
            'reglement:accept:'
          )
        ) {
          await handleRulesAcceptance(
            interaction
          );

          return;
        }

        if (
          interaction.customId ===
          'ticket:create'
        ) {
          await showTicketTypeMenu(
            interaction
          );

          return;
        }

        if (
          interaction.customId ===
          'ticket:close'
        ) {
          await closeTicket(
            interaction
          );

          return;
        }

        if (
          interaction.customId.startsWith(
            'ticket:rate:'
          )
        ) {
          await handleTicketRating(
            interaction
          );

          return;
        }

        if (
          interaction.customId ===
            'ticket:publish:name' ||
          interaction.customId ===
            'ticket:publish:anonymous'
        ) {
          await publishReview(
            interaction
          );

          return;
        }

        if (
          interaction.customId.startsWith(
            'project:'
          )
        ) {
          await handleProjectButton(
            interaction
          );

          return;
        }
      }

      if (
        interaction.isStringSelectMenu()
      ) {
        if (
          interaction.customId ===
          'ticket:type'
        ) {
          await createTicket(
            interaction
          );

          return;
        }

        if (
          interaction.customId ===
          'help:category'
        ) {
          await handleHelpCategory(
            interaction
          );

          return;
        }

        if (
          interaction.customId.startsWith(
            'project:status:'
          )
        ) {
          await handleProjectStatus(
            interaction
          );

          return;
        }
      }

      if (
        interaction.isModalSubmit()
      ) {
        if (
          interaction.customId ===
          'ticket:review'
        ) {
          await handleReviewSubmit(
            interaction
          );

          return;
        }

        if (
          interaction.customId.startsWith(
            'project:addtaskmodal:'
          )
        ) {
          await handleProjectModal(
            interaction
          );

          return;
        }
      }
    } catch (error) {
      console.error(
        '❌ Erreur interaction :',
        error
      );

      const message =
        '❌ Une erreur est survenue pendant le traitement de cette action.';

      if (
        interaction.isRepliable()
      ) {
        if (
          interaction.replied ||
          interaction.deferred
        ) {
          await interaction.editReply({
            content: message
          }).catch(() => null);
        } else {
          await interaction.reply({
            content: message,
            ephemeral: true
          }).catch(() => null);
        }
      }
    }
  }
};