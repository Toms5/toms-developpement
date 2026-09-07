import {
  EmbedBuilder,
  SlashCommandBuilder,
  type ChatInputCommandInteraction
} from 'discord.js';

import type { Command } from '../../types/command.js';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Affiche les informations d\'un membre.')
    .addUserOption(option =>
      option
        .setName('membre')
        .setDescription('Le membre à consulter.')
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const user =
      interaction.options.getUser('membre') ??
      interaction.user;

    const member = interaction.guild
      ? await interaction.guild.members.fetch(user.id).catch(() => null)
      : null;

    const embed = new EmbedBuilder()
      .setTitle(`👤 ${user.username}`)
      .setThumbnail(user.displayAvatarURL())
      .addFields(
        {
          name: '🆔 ID',
          value: user.id,
          inline: true
        },
        {
          name: '🤖 Bot',
          value: user.bot ? 'Oui' : 'Non',
          inline: true
        },
        {
          name: '📅 Compte créé',
          value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>`
        }
      )
      .setTimestamp();

    if (member) {
      embed.addFields({
        name: '📥 Arrivée sur le serveur',
        value: member.joinedTimestamp
          ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`
          : 'Inconnue'
      });
    }

    await interaction.reply({
      embeds: [embed]
    });
  }
};

export default command;