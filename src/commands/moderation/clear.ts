import {
  PermissionFlagsBits,
  SlashCommandBuilder,
  type ChatInputCommandInteraction
} from 'discord.js';

import type { Command } from '../../types/command.js';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Supprime plusieurs messages.')
    .addIntegerOption(option =>
      option
        .setName('nombre')
        .setDescription('Nombre de messages à supprimer.')
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true)
    )
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ManageMessages
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.channel?.isTextBased()) {
      await interaction.reply({
        content: '❌ Cette commande doit être utilisée dans un salon textuel.',
        ephemeral: true
      });

      return;
    }

    if (!('bulkDelete' in interaction.channel)) {
      await interaction.reply({
        content: '❌ Impossible de supprimer des messages ici.',
        ephemeral: true
      });

      return;
    }

    const nombre = interaction.options.getInteger('nombre', true);

    const deleted = await interaction.channel.bulkDelete(
      nombre,
      true
    );

    await interaction.reply({
      content: `🧹 **${deleted.size}** message(s) supprimé(s).`,
      ephemeral: true
    });
  }
};

export default command;