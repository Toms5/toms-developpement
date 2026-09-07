import {
  PermissionFlagsBits,
  SlashCommandBuilder,
  type ChatInputCommandInteraction
} from 'discord.js';

import type { Command } from '../../types/command.js';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Met un membre en timeout.')
    .addUserOption(option =>
      option
        .setName('membre')
        .setDescription('Le membre à sanctionner.')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('minutes')
        .setDescription('Durée du timeout en minutes.')
        .setMinValue(1)
        .setMaxValue(40320)
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('raison')
        .setDescription('Raison du timeout.')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ModerateMembers
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser('membre', true);
    const minutes = interaction.options.getInteger(
      'minutes',
      true
    );

    const raison =
      interaction.options.getString('raison') ??
      'Aucune raison fournie.';

    const member = await interaction.guild?.members
      .fetch(user.id)
      .catch(() => null);

    if (!member) {
      await interaction.reply({
        content: '❌ Membre introuvable sur ce serveur.',
        ephemeral: true
      });
      return;
    }

    if (!member.moderatable) {
      await interaction.reply({
        content: '❌ Je ne peux pas mettre ce membre en timeout.',
        ephemeral: true
      });
      return;
    }

    await member.timeout(
      minutes * 60 * 1000,
      raison
    );

    await interaction.reply({
      content:
        `⏱️ **${user.tag}** est en timeout pendant **${minutes} minute(s)**.\n` +
        `**Raison :** ${raison}`
    });
  }
};

export default command;