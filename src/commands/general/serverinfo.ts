import {
  EmbedBuilder,
  SlashCommandBuilder,
  type ChatInputCommandInteraction
} from 'discord.js';

import type { Command } from '../../types/command.js';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Affiche les informations du serveur.'),

  async execute(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild;

    if (!guild) {
      await interaction.reply({
        content: '❌ Cette commande doit être utilisée sur un serveur.',
        ephemeral: true
      });

      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(`📊 ${guild.name}`)
      .setThumbnail(guild.iconURL())
      .addFields(
        {
          name: '👑 Propriétaire',
          value: `<@${guild.ownerId}>`,
          inline: true
        },
        {
          name: '👥 Membres',
          value: `${guild.memberCount}`,
          inline: true
        },
        {
          name: '🆔 ID',
          value: guild.id,
          inline: true
        },
        {
          name: '📅 Création',
          value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`
        }
      )
      .setTimestamp();

    await interaction.reply({
      embeds: [embed]
    });
  }
};

export default command;