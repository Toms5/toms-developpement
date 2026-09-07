import {
  ActionRowBuilder,
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  SlashCommandBuilder,
  type ChatInputCommandInteraction
} from 'discord.js';

import type { Command } from '../../types/command.js';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription(
      'Affiche le centre d’aide de Tom\'s Développement.'
    ),

  async execute(
    interaction: ChatInputCommandInteraction
  ) {
    const embed =
      new EmbedBuilder()
        .setTitle(
          "🤖 Tom's Développement — Centre d'aide"
        )
        .setDescription(
          [
            'Bienvenue dans le centre d’aide du serveur.',
            '',
            'Sélectionnez une catégorie ci-dessous pour découvrir les commandes disponibles.',
            '',
            '🛠️ **Tom\'s Développement**',
            'Gestion • Support • Projets • Modération • Logs'
          ].join('\n')
        )
        .addFields({
          name: '📚 Catégories',
          value:
            [
              '🏠 Général',
              '🛡️ Modération',
              '🎫 Tickets',
              '📦 Projets',
              '📋 Administration'
            ].join('\n')
        })
        .setFooter({
          text:
            "Tom's Développement • Bot officiel"
        })
        .setTimestamp();

    const menu =
      new StringSelectMenuBuilder()
        .setCustomId('help:category')
        .setPlaceholder(
          'Choisir une catégorie'
        )
        .addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel('Général')
            .setDescription(
              'Commandes générales du serveur'
            )
            .setEmoji('🏠')
            .setValue('general'),

          new StringSelectMenuOptionBuilder()
            .setLabel('Modération')
            .setDescription(
              'Gestion et modération'
            )
            .setEmoji('🛡️')
            .setValue('moderation'),

          new StringSelectMenuOptionBuilder()
            .setLabel('Tickets')
            .setDescription(
              'Support et tickets clients'
            )
            .setEmoji('🎫')
            .setValue('tickets'),

          new StringSelectMenuOptionBuilder()
            .setLabel('Projets')
            .setDescription(
              'Gestion complète des projets'
            )
            .setEmoji('📦')
            .setValue('projects'),

          new StringSelectMenuOptionBuilder()
            .setLabel('Administration')
            .setDescription(
              'Configuration et administration'
            )
            .setEmoji('📋')
            .setValue('admin')
        );

    const row =
      new ActionRowBuilder<StringSelectMenuBuilder>()
        .addComponents(menu);

    await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true
    });
  }
};

export default command;