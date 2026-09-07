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
    .setName('reglement')
    .setDescription(
      'Publie le règlement du serveur avec le système de rôle.'
    )
    .setDefaultMemberPermissions(
      PermissionFlagsBits.Administrator
    )
    .addRoleOption(option =>
      option
        .setName('role')
        .setDescription(
          'Rôle donné après acceptation du règlement.'
        )
        .setRequired(true)
    ),

  async execute(
    interaction: ChatInputCommandInteraction
  ): Promise<void> {
    const role =
      interaction.options.getRole(
        'role',
        true
      );

    const channel =
      interaction.channel;

    if (
      !channel ||
      !channel.isTextBased() ||
      !('send' in channel)
    ) {
      await interaction.reply({
        content:
          '❌ Impossible de publier le règlement dans ce salon.',
        ephemeral: true
      });

      return;
    }

    const embed =
      new EmbedBuilder()
        .setTitle(
          '📜 Règlement — Tom\'s Développement'
        )
        .setDescription(
          [
            'Bienvenue sur **Tom\'s Développement** !',
            '',
            'Avant de participer au serveur, merci de prendre connaissance du règlement.',
            '',
            '**1. 🤝 Respect**',
            'Respectez les autres membres, clients et développeurs.',
            '',
            '**2. 🚫 Comportement**',
            'Les insultes, provocations, discriminations et comportements nuisibles ne sont pas tolérés.',
            '',
            '**3. 💻 Développement**',
            'Utilisez les salons appropriés pour vos projets, bugs, idées et discussions techniques.',
            '',
            '**4. 🔒 Confidentialité**',
            'Ne partagez jamais d’informations personnelles, identifiants ou données confidentielles.',
            '',
            '**5. 📢 Publicité**',
            'La publicité ou le spam sans autorisation est interdit.',
            '',
            '**6. 🛡️ Modération**',
            'L’équipe se réserve le droit d’intervenir lorsqu’une situation l’exige.',
            '',
            '━━━━━━━━━━━━━━━━━━━━',
            '',
            `✅ Cliquez sur le bouton ci-dessous pour accepter le règlement et obtenir le rôle ${role}.`
          ].join('\n')
        )
        .setFooter({
          text:
            `Tom's Développement • ROLE_ID:${role.id}`
        })
        .setTimestamp();

    const button =
      new ButtonBuilder()
        .setCustomId(
          `reglement:accept:${role.id}`
        )
        .setLabel(
          'J’accepte le règlement'
        )
        .setEmoji('✅')
        .setStyle(
          ButtonStyle.Success
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
        `✅ Règlement publié. Le rôle ${role} sera attribué aux membres qui l'acceptent.`,
      ephemeral: true
    });
  }
};

export default command;