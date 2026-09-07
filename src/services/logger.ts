import {
  EmbedBuilder,
  type Client,
  type Guild,
  type TextChannel
} from 'discord.js';

const LOG_CHANNEL_NAME = '📋・logs';

export async function getLogChannel(
  guild: Guild
): Promise<TextChannel | null> {
  const channel = guild.channels.cache.find(
    channel =>
      channel.name === LOG_CHANNEL_NAME &&
      channel.isTextBased()
  );

  if (!channel || !channel.isTextBased()) {
    return null;
  }

  return channel as TextChannel;
}

export async function sendLog(
  guild: Guild,
  embed: EmbedBuilder
): Promise<void> {
  const channel = await getLogChannel(guild);

  if (!channel) {
    return;
  }

  await channel.send({
    embeds: [embed]
  }).catch(() => null);
}

export async function createLogChannel(
  client: Client,
  guild: Guild
): Promise<void> {
  const existing = guild.channels.cache.find(
    channel => channel.name === LOG_CHANNEL_NAME
  );

  if (existing) {
    return;
  }

  const channel = await guild.channels.create({
    name: LOG_CHANNEL_NAME,
    type: 0
  });

  await channel.send({
    embeds: [
      new EmbedBuilder()
        .setTitle('📋 Logs activés')
        .setDescription(
          'Ce salon contient les événements importants du serveur.'
        )
        .setTimestamp()
    ]
  });

  console.log(
    `📋 Salon de logs créé sur ${guild.name}`
  );
}