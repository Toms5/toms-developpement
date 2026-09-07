import {
  PermissionFlagsBits,
  SlashCommandBuilder,
  type ChatInputCommandInteraction
} from 'discord.js';

import type { Command } from '../../types/command.js';

import {
  getProject
} from '../../services/projectService.js';

import {
  getProjectRepository,
  isValidGitHubRepositoryUrl,
  removeProjectRepository,
  setProjectRepository
} from '../../services/projectRepositoryService.js';

const command: Command = {
  data:
    new SlashCommandBuilder()
      .setName(
        'projet-repository'
      )
      .setDescription(
        'Associe un repository GitHub à un projet.'
      )
      .setDefaultMemberPermissions(
        PermissionFlagsBits.Administrator
      )
      .addSubcommand(
        subcommand =>
          subcommand
            .setName('lier')
            .setDescription(
              'Lie un repository GitHub à un projet.'
            )
            .addIntegerOption(
              option =>
                option
                  .setName('projet')
                  .setDescription(
                    'ID du projet.'
                  )
                  .setRequired(true)
                  .setMinValue(1)
            )
            .addStringOption(
              option =>
                option
                  .setName('url')
                  .setDescription(
                    'URL du repository GitHub.'
                  )
                  .setRequired(true)
            )
      )
      .addSubcommand(
        subcommand =>
          subcommand
            .setName('voir')
            .setDescription(
              'Affiche le repository GitHub d’un projet.'
            )
            .addIntegerOption(
              option =>
                option
                  .setName('projet')
                  .setDescription(
                    'ID du projet.'
                  )
                  .setRequired(true)
                  .setMinValue(1)
            )
      )
      .addSubcommand(
        subcommand =>
          subcommand
            .setName('supprimer')
            .setDescription(
              'Supprime le repository lié à un projet.'
            )
            .addIntegerOption(
              option =>
                option
                  .setName('projet')
                  .setDescription(
                    'ID du projet.'
                  )
                  .setRequired(true)
                  .setMinValue(1)
            )
      ),

  async execute(
    interaction:
      ChatInputCommandInteraction
  ): Promise<void> {
    const subcommand =
      interaction.options.getSubcommand();

    const projectId =
      interaction.options.getInteger(
        'projet',
        true
      );

    const project =
      getProject(projectId);

    if (!project) {
      await interaction.reply({
        content:
          `❌ Le projet **#${projectId}** n’existe pas.`,
        ephemeral: true
      });

      return;
    }

    if (
      subcommand === 'lier'
    ) {
      const url =
        interaction.options.getString(
          'url',
          true
        ).trim();

      if (
        !isValidGitHubRepositoryUrl(
          url
        )
      ) {
        await interaction.reply({
          content:
            '❌ URL GitHub invalide.\n\nUtilisez une URL du type :\n`https://github.com/utilisateur/repository`',
          ephemeral: true
        });

        return;
      }

      const repository =
        setProjectRepository(
          projectId,
          url,
          interaction.user.id
        );

      await interaction.reply({
        content:
          [
            '✅ **Repository GitHub lié !**',
            '',
            `🚀 **Projet :** #${project.id} — ${project.name}`,
            `🔗 **Repository :** ${repository.url}`
          ].join('\n'),
        ephemeral: true
      });

      return;
    }

    if (
      subcommand === 'voir'
    ) {
      const repository =
        getProjectRepository(
          projectId
        );

      if (!repository) {
        await interaction.reply({
          content:
            `📦 Le projet **#${project.id} — ${project.name}** n’a aucun repository GitHub lié.`,
          ephemeral: true
        });

        return;
      }

      await interaction.reply({
        content:
          [
            `🚀 **Projet #${project.id} — ${project.name}**`,
            '',
            `🔗 **Repository GitHub :** ${repository.url}`
          ].join('\n'),
        ephemeral: true
      });

      return;
    }

    if (
      subcommand === 'supprimer'
    ) {
      const removed =
        removeProjectRepository(
          projectId
        );

      if (!removed) {
        await interaction.reply({
          content:
            `❌ Aucun repository n’est lié au projet **#${project.id}**.`,
          ephemeral: true
        });

        return;
      }

      await interaction.reply({
        content:
          `🗑️ Le repository GitHub du projet **#${project.id} — ${project.name}** a été supprimé.`,
        ephemeral: true
      });

      return;
    }
  }
};

export default command;