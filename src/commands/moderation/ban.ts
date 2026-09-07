import {
  PermissionFlagsBits,
  SlashCommandBuilder,
  type ChatInputCommandInteraction
} from 'discord.js';

import type { Command } from '../../types/command.js';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bannit un membre du serveur.')
    .addUserOption(option =>
      option
        .setName('membre')
        .setDescription('Le membre à bannir.')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('raison')
        .setDescription('Raison du bannissement.')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(
      PermissionFlagsBits.BanMembers
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser('membre', true);
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

    if (!member.bannable) {
      await interaction.reply({
        content: '❌ Je ne peux pas bannir ce membre.',
        ephemeral: true
      });
      return;
    }

    await member.ban({
      reason: raison
    });

    await interaction.reply({
      content: `🔨 **${user.tag}** a été banni.\n**Raison :** ${raison}`
    });
  }
};

export default command;