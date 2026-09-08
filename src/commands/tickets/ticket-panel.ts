import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type ChatInputCommandInteraction
} from 'discord.js';

import type { Command } from '../../types/command.js';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('ticket-panel')
    .setDescription(
      'Installe le panneau de création de tickets.'
    )
    .setDefaultMemberPermissions(
      PermissionFlagsBits.Administrator
    ),

  async execute(
    interaction: ChatInputCommandInteraction
  ) {
    const channel =
      interaction.channel;

    if (
      !channel ||
      !channel.isTextBased()
    ) {
      await interaction.reply({
        content:
          '❌ Cette commande doit être utilisée dans un salon textuel.',
        ephemeral: true
      });

      return;
    }

    if (!('send' in channel)) {
      await interaction.reply({
        content:
          '❌ Impossible d’envoyer le panneau dans ce salon.',
        ephemeral: true
      });

      return;
    }

    const embed =
      new EmbedBuilder()
        .setTitle(
          '🎫 Support — Tom\'s Développement'
        )
        .setDescription(
          [
            'Besoin d’aide ou d’un suivi concernant votre projet ?',
            '',
            'Cliquez sur le bouton ci-dessous pour ouvrir un ticket privé.',
            '',
            '🛡️ Votre ticket sera visible par vous et l’équipe de développement.',
            '📋 Merci de fournir un maximum d’informations dans votre demande.'
          ].join('\n')
        )
        .setFooter({
          text:
            'Tom\'s Développement • Support'
        })
        .setTimestamp();

    const button =
      new ButtonBuilder()
        .setCustomId(
          'ticket:create'
        )
        .setLabel(
          'Ouvrir un ticket'
        )
        .setEmoji('🎫')
        .setStyle(
          ButtonStyle.Primary
        );

    const row =
      new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          button
        );

    await channel.send({
      embeds: [embed],
      components: [row]
    });

    await interaction.reply({
      content:
        '✅ Le panneau de tickets a été installé.',
      ephemeral: true
    });
  }
};

export default command;