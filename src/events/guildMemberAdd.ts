import {
  EmbedBuilder,
  Events
} from 'discord.js';

import { sendLog } from '../services/logger.js';

export default {
  name: Events.GuildMemberAdd,
  once: false,

  async execute(member: any) {
    const embed = new EmbedBuilder()
      .setTitle('👋 Nouveau membre')
      .setDescription(
        `${member.user} vient de rejoindre le serveur.`
      )
      .addFields({
        name: '👤 Compte',
        value: member.user.tag,
        inline: true
      })
      .setTimestamp();

    await sendLog(member.guild, embed);
  }
};