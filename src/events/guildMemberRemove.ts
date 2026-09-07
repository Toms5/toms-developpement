import {
  EmbedBuilder,
  Events
} from 'discord.js';

import { sendLog } from '../services/logger.js';

export default {
  name: Events.GuildMemberRemove,
  once: false,

  async execute(member: any) {
    const embed = new EmbedBuilder()
      .setTitle('🚪 Membre parti')
      .setDescription(
        `**${member.user.tag}** a quitté le serveur.`
      )
      .addFields({
        name: '🆔 ID',
        value: member.user.id,
        inline: true
      })
      .setTimestamp();

    await sendLog(member.guild, embed);
  }
};