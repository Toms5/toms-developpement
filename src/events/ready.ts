import {
  Events,
  type Client
} from 'discord.js';

export default {
  name: Events.ClientReady,
  once: true,

  execute(client: Client<true>) {
    console.log(`🤖 Connecté en tant que ${client.user.tag}`);
    console.log(`🟢 ID : ${client.user.id}`);
    console.log(`🌐 Serveurs : ${client.guilds.cache.size}`);
  }
};