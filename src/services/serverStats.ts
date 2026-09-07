import {
  ChannelType,
  PermissionFlagsBits,
  type Client,
  type Guild
} from 'discord.js';

const STATS_CATEGORY_NAME = '📊・STATISTIQUES';

const STATS_CHANNELS = {
  members: '👥 Membres',
  online: '🟢 En ligne',
  bots: '🤖 Bots',
  tickets: '🎫 Tickets'
} as const;

async function getOrCreateStatsCategory(
  guild: Guild
) {
  const existing =
    guild.channels.cache.find(
      channel =>
        channel.type === ChannelType.GuildCategory &&
        channel.name === STATS_CATEGORY_NAME
    );

  if (
    existing &&
    existing.type === ChannelType.GuildCategory
  ) {
    return existing;
  }

  return guild.channels.create({
    name: STATS_CATEGORY_NAME,
    type: ChannelType.GuildCategory
  });
}

async function getOrCreateStatsChannel(
  guild: Guild,
  name: string,
  categoryId: string
) {
  const existing =
    guild.channels.cache.find(
      channel =>
        channel.type === ChannelType.GuildVoice &&
        channel.name.startsWith(name)
    );

  if (
    existing &&
    existing.type === ChannelType.GuildVoice
  ) {
    return existing;
  }

  return guild.channels.create({
    name,
    type: ChannelType.GuildVoice,
    parent: categoryId,
    permissionOverwrites: [
      {
        id: guild.roles.everyone.id,
        deny: [
          PermissionFlagsBits.Connect,
          PermissionFlagsBits.Speak
        ]
      }
    ]
  });
}

function countOnlineMembers(
  guild: Guild
): number {
  return guild.members.cache.filter(
    member =>
      !member.user.bot &&
      member.presence?.status &&
      member.presence.status !== 'offline'
  ).size;
}

function countBots(
  guild: Guild
): number {
  return guild.members.cache.filter(
    member => member.user.bot
  ).size;
}

function countOpenTickets(
  guild: Guild
): number {
  return guild.channels.cache.filter(
    channel =>
      channel.type === ChannelType.GuildText &&
      channel.name.startsWith('ticket-')
  ).size;
}

export async function updateServerStats(
  guild: Guild
): Promise<void> {
  await guild.members.fetch().catch(() => null);

  const category =
    await getOrCreateStatsCategory(guild);

  const membersChannel =
    await getOrCreateStatsChannel(
      guild,
      STATS_CHANNELS.members,
      category.id
    );

  const onlineChannel =
    await getOrCreateStatsChannel(
      guild,
      STATS_CHANNELS.online,
      category.id
    );

  const botsChannel =
    await getOrCreateStatsChannel(
      guild,
      STATS_CHANNELS.bots,
      category.id
    );

  const ticketsChannel =
    await getOrCreateStatsChannel(
      guild,
      STATS_CHANNELS.tickets,
      category.id
    );

  const members =
    guild.memberCount;

  const online =
    countOnlineMembers(guild);

  const bots =
    countBots(guild);

  const tickets =
    countOpenTickets(guild);

  await membersChannel
    .setName(
      `${STATS_CHANNELS.members} : ${members}`
    )
    .catch(() => null);

  await onlineChannel
    .setName(
      `${STATS_CHANNELS.online} : ${online}`
    )
    .catch(() => null);

  await botsChannel
    .setName(
      `${STATS_CHANNELS.bots} : ${bots}`
    )
    .catch(() => null);

  await ticketsChannel
    .setName(
      `${STATS_CHANNELS.tickets} : ${tickets}`
    )
    .catch(() => null);
}

export function startServerStats(
  client: Client
): void {
  const updateAllGuilds =
    async () => {
      for (
        const guild of client.guilds.cache.values()
      ) {
        await updateServerStats(guild);
      }
    };

  void updateAllGuilds();

  setInterval(
    () => {
      void updateAllGuilds();
    },
    60_000
  );
}