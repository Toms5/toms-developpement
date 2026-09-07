import 'dotenv/config';

import {
Client,
Collection,
Events,
GatewayIntentBits,
Partials
} from 'discord.js';

import { config } from './config/config.js';

import ping from './commands/general/ping.js';
import help from './commands/general/help.js';
import serverinfo from './commands/general/serverinfo.js';
import userinfo from './commands/general/userinfo.js';
import avis from './commands/general/avis.js';
import reglement from './commands/general/reglement.js';

import clear from './commands/moderation/clear.js';
import kick from './commands/moderation/kick.js';
import ban from './commands/moderation/ban.js';
import timeout from './commands/moderation/timeout.js';
import untimeout from './commands/moderation/untimeout.js';

import ticketPanel from './commands/tickets/ticket-panel.js';

import projet from './commands/projects/projet.js';

import ready from './events/ready.js';
import interactionCreate from './events/interactionCreate.js';
import guildMemberAdd from './events/guildMemberAdd.js';
import guildMemberRemove from './events/guildMemberRemove.js';
import messageDelete from './events/messageDelete.js';
import messageUpdate from './events/messageUpdate.js';
import messageReactionAdd from './events/messageReactionAdd.js';

import { createLogChannel } from './services/logger.js';
import { startBotActivity } from './services/botActivity.js';
import { startServerStats } from './services/serverStats.js';

import type { Command } from './types/command.js';

const client = new Client({
intents: [
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMembers,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.GuildMessageReactions,
GatewayIntentBits.MessageContent,
GatewayIntentBits.GuildPresences
],
partials: [
Partials.Message,
Partials.Reaction,
Partials.User
]
});

client.commands =
new Collection<string, Command>();

const commands: Command[] = [
ping,
help,
serverinfo,
userinfo,
avis,
reglement,

clear,
kick,
ban,
timeout,
untimeout,

ticketPanel,

projet
];

for (const command of commands) {
client.commands.set(
command.data.name,
command
);
}

client.once(
Events.ClientReady,
async (client) => {
await ready.execute(client);

startBotActivity(client);
startServerStats(client);

for (
  const guild of client.guilds.cache.values()
) {
  await createLogChannel(
    client,
    guild
  );
}

}
);

client.on(
Events.InteractionCreate,
(interaction) =>
interactionCreate.execute(interaction)
);

client.on(
Events.GuildMemberAdd,
(member) =>
guildMemberAdd.execute(member)
);

client.on(
Events.GuildMemberRemove,
(member) =>
guildMemberRemove.execute(member)
);

client.on(
Events.MessageDelete,
(message) =>
messageDelete.execute(message)
);

client.on(
Events.MessageUpdate,
(oldMessage, newMessage) =>
messageUpdate.execute(
oldMessage,
newMessage
)
);

client.on(
Events.MessageReactionAdd,
(reaction, user) =>
messageReactionAdd.execute(
reaction,
user
)
);

console.log(
"🚀 Démarrage de Tom's Développement..."
);

await client.login(
config.discordToken
);
