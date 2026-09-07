import {
  EmbedBuilder,
  Events
} from 'discord.js';

import { sendLog } from '../services/logger.js';

export default {
  name: Events.MessageDelete,
  once: false,

  async execute(message: any) {
    if (!message.guild || message.author?.bot) {
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('🗑️ Message supprimé')
      .setDescription(
        `Un message de **${message.author?.tag ?? 'Inconnu'}** a été supprimé.`
      )
      .addFields({
        name: '📍 Salon',
        value: `${message.channel}`,
        inline: true
      })
      .setTimestamp();

    if (message.content) {
      embed.addFields({
        name: '💬 Contenu',
        value: message.content.slice(0, 1024)
      });
    }

    await sendLog(message.guild, embed);
  }
};