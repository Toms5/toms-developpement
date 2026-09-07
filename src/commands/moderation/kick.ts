import {
  PermissionFlagsBits,
  SlashCommandBuilder,
  type ChatInputCommandInteraction
} from 'discord.js';

import type { Command } from '../../types/command.js';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Expulse un membre du serveur.')
    .addUserOption(option =>
      option
        .setName('membre')
        .setDescription('Le membre à expulser.')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('raison')
        .setDescription('Raison de l’expulsion.')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(
      PermissionFlagsBits.KickMembers
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

    if (!member.kickable) {
      await interaction.reply({
        content: '❌ Je ne peux pas expulser ce membre.',
        ephemeral: true
      });
      return;
    }

    await member.kick(raison);

    await interaction.reply({
      content: `👢 **${user.tag}** a été expulsé.\n**Raison :** ${raison}`
    });
  }
};

export default command;