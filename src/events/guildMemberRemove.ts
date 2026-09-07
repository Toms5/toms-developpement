import {
ChannelType,
EmbedBuilder,
type GuildMember,
type PartialGuildMember
} from 'discord.js';

import { sendLog } from '../services/logger.js';
import { updateServerStats } from '../services/serverStats.js';

const WELCOME_CHANNEL_NAME = '👋・bienvenue';

async function getWelcomeChannel(
member: GuildMember | PartialGuildMember
) {
const channel =
member.guild.channels.cache.find(
channel =>
channel.type === ChannelType.GuildText &&
channel.name === WELCOME_CHANNEL_NAME
);

if (
channel &&
channel.type === ChannelType.GuildText
) {
return channel;
}

return null;
}

export async function execute(
member: GuildMember | PartialGuildMember
): Promise<void> {
const guild = member.guild;

const memberNumber =
guild.memberCount;

const channel =
await getWelcomeChannel(member);

if (channel) {
const embed =
new EmbedBuilder()
.setTitle('👋 Un membre nous quitte')
.setDescription(
[
'👤 **' + member.user.username + '** vient de quitter le serveur.',
'',
'Nous étions ravis de l’avoir parmi nous. 👋',
'',
'👥 Membres restants : **' + memberNumber + '**',
'',
'━━━━━━━━━━━━━━━━━━━━',
'',
"💻 **Tom's Développement** continue son aventure !"
].join('\n')
)
.setThumbnail(
member.user.displayAvatarURL({
size: 256
})
)
.setFooter({
text: "Tom's Développement • Départ"
})
.setTimestamp();

await channel.send({
  embeds: [embed]
}).catch(() => null);

}

await sendLog(
guild,
new EmbedBuilder()
.setTitle('👋 Départ d’un membre')
.setDescription(
[
'👤 Membre : ' + member.user.tag,
'🆔 ID : `' + member.id + '`',
'👥 Membres restants : **' + memberNumber + '**'
].join('\n')
)
.setTimestamp()
);

await updateServerStats(guild);
}

export default {
execute
};
