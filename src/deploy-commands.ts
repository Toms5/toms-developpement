import 'dotenv/config';

import {
REST,
Routes
} from 'discord.js';

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

const token =
process.env.DISCORD_TOKEN;

const clientId =
process.env.CLIENT_ID;

const guildId =
process.env.GUILD_ID;

if (!token) {
throw new Error(
'❌ DISCORD_TOKEN est manquant.'
);
}

if (!clientId) {
throw new Error(
'❌ CLIENT_ID est manquant.'
);
}

if (!guildId) {
throw new Error(
'❌ GUILD_ID est manquant.'
);
}

const commands = [
ping.data.toJSON(),
help.data.toJSON(),
serverinfo.data.toJSON(),
userinfo.data.toJSON(),
avis.data.toJSON(),
reglement.data.toJSON(),

clear.data.toJSON(),
kick.data.toJSON(),
ban.data.toJSON(),
timeout.data.toJSON(),
untimeout.data.toJSON(),

ticketPanel.data.toJSON(),

projet.data.toJSON()
];

const rest =
new REST({
version: '10'
}).setToken(token);

try {
console.log(
'🔄 Enregistrement des commandes...'
);

await rest.put(
Routes.applicationGuildCommands(
clientId,
guildId
),
{
body: commands
}
);

console.log(
'✅ Commandes enregistrées avec succès.'
);
} catch (error) {
console.error(
'❌ Impossible d’enregistrer les commandes :',
error
);
}
