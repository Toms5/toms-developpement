import {
  EmbedBuilder,
  Events
} from 'discord.js';

import { sendLog } from '../services/logger.js';

export default {
  name: Events.MessageUpdate,
  once: false,

  async execute(oldMessage: any, newMessage: any) {
    if (!newMessage.guild || newMessage.author?.bot) {
      return;
    }

    if (oldMessage.content === newMessage.content) {
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('✏️ Message modifié')
      .setDescription(
        `**${newMessage.author?.tag ?? 'Inconnu'}** a modifié un message.`
      )
      .addFields(
        {
          name: '📍 Salon',
          value: `${newMessage.channel}`,
          inline: true
        },
        {
          name: 'Avant',
          value: oldMessage.content?.slice(0, 1024) || 'Inconnu'
        },
        {
          name: 'Après',
          value: newMessage.content?.slice(0, 1024) || 'Inconnu'
        }
      )
      .setTimestamp();

    await sendLog(newMessage.guild, embed);
  }
};