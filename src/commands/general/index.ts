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
import { serverConfig } from '../../config/server.js';

const command: Command = {
data: new SlashCommandBuilder()
.setName('index')
.setDescription('Publie l’index automatique du serveur.')
.setDefaultMemberPermissions(
PermissionFlagsBits.Administrator
),

async execute(
interaction: ChatInputCommandInteraction
): Promise<void> {
const channel =
interaction.channel;

if (
  !channel ||
  !channel.isTextBased() ||
  !('send' in channel)
) {
  await interaction.reply({
    content:
      '❌ Impossible de publier l’index dans ce salon.',
    ephemeral: true
  });

  return;
}

const embed =
  new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('🗺️ INDEX — TOM\'S DÉVELOPPEMENT')
    .setDescription(
      [
        'Bienvenue sur **Tom\'s Développement** ! 👋',
        '',
        'Cet espace centralise les informations, le développement, les projets et le support.',
        '',
        '━━━━━━━━━━━━━━━━━━━━'
      ].join('\n')
    )
    .addFields(
      {
        name: '📌 START',
        value:
          `👋 <#${serverConfig.channels.bienvenue}>\n` +
          `📜 <#${serverConfig.channels.reglement}>`,
        inline: true
      },
      {
        name: '💻 DEV',
        value:
          `💬 <#${serverConfig.categories.dev}>\n` +
          `🐛 <#${serverConfig.channels.logs}>\n` +
          `🧠 <#${serverConfig.channels.todo}>\n` +
          `📚 <#${serverConfig.channels.workInProgress}>`,
        inline: true
      },
      {
        name: '🚀 PROJECTS',
        value:
          `📦 <#${serverConfig.channels.projets}>\n` +
          `📋 <#${serverConfig.channels.todo}>\n` +
          `🚧 <#${serverConfig.channels.workInProgress}>`,
        inline: true
      },
      {
        name: '🎫 SUPPORT',
        value:
          `🎫 <#${serverConfig.channels.ouvrirTicket}>\n\n` +
          'Ouvre un ticket pour obtenir de l’aide, demander un devis ou signaler un problème.',
        inline: false
      },
      {
        name: '🗄️ ARCHIVE',
        value:
          `<#${serverConfig.channels.archives}>`,
        inline: true
      },
      {
        name: '📊 STATISTIQUES',
        value:
          '👥 Membres\n🟢 En ligne\n🤖 Bots\n🎫 Tickets ouverts',
        inline: true
      }
    )
    .setFooter({
      text:
        "Tom's Développement • Index du serveur"
    })
    .setTimestamp();

const ticketButton =
  new ButtonBuilder()
    .setLabel('Ouvrir un ticket')
    .setEmoji('🎫')
    .setStyle(ButtonStyle.Link)
    .setURL(
      `https://discord.com/channels/${interaction.guildId}/${serverConfig.channels.ouvrirTicket}`
    );

const rulesButton =
  new ButtonBuilder()
    .setLabel('Règlement')
    .setEmoji('📜')
    .setStyle(ButtonStyle.Link)
    .setURL(
      `https://discord.com/channels/${interaction.guildId}/${serverConfig.channels.reglement}`
    );

const projectsButton =
  new ButtonBuilder()
    .setLabel('Projets')
    .setEmoji('🚀')
    .setStyle(ButtonStyle.Link)
    .setURL(
      `https://discord.com/channels/${interaction.guildId}/${serverConfig.channels.projets}`
    );

const row =
  new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      ticketButton,
      rulesButton,
      projectsButton
    );

await channel.send({
  embeds: [embed],
  components: [row]
});

await interaction.reply({
  content:
    '✅ Index du serveur publié avec succès.',
  ephemeral: true
});


}
};

export default command;
