import {
  PermissionFlagsBits,
  SlashCommandBuilder,
  type ChatInputCommandInteraction
} from 'discord.js';

import type { Command } from '../../types/command.js';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('untimeout')
    .setDescription('Retire le timeout d’un membre.')
    .addUserOption(option =>
      option
        .setName('membre')
        .setDescription('Le membre concerné.')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ModerateMembers
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser('membre', true);

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
        content: '❌ Je ne peux pas modifier ce membre.',
        ephemeral: true
      });
      return;
    }

    await member.timeout(null, 'Timeout retiré.');

    await interaction.reply({
      content: `🔓 Le timeout de **${user.tag}** a été retiré.`
    });
  }
};

export default command;