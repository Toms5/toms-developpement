import {
ChannelType,
EmbedBuilder,
PermissionFlagsBits,
type GuildMember
} from 'discord.js';

import { sendLog } from '../services/logger.js';
import { updateServerStats } from '../services/serverStats.js';

const WELCOME_CHANNEL_NAME = '👋・bienvenue';

async function getOrCreateWelcomeChannel(
member: GuildMember
) {
const guild = member.guild;

const existing = guild.channels.cache.find(
channel =>
channel.type === ChannelType.GuildText &&
channel.name === WELCOME_CHANNEL_NAME
);

if (
existing &&
existing.type === ChannelType.GuildText
) {
return existing;
}

return guild.channels.create({
name: WELCOME_CHANNEL_NAME,
type: ChannelType.GuildText,
permissionOverwrites: [
{
id: guild.roles.everyone.id,
allow: [
PermissionFlagsBits.ViewChannel,
PermissionFlagsBits.ReadMessageHistory
],
deny: [
PermissionFlagsBits.SendMessages
]
}
]
});
}

export async function execute(
member: GuildMember
): Promise<void> {
const guild = member.guild;

const channel =
await getOrCreateWelcomeChannel(member);

const memberNumber =
guild.memberCount;

const embed =
new EmbedBuilder()
.setTitle(
`👋 Bienvenue sur ${guild.name} !`
)
.setDescription(
[
`Bienvenue ${member} ! 🎉`,
'',
"Nous sommes ravis de t’accueillir sur **Tom's Développement**.",
'',
`👥 Tu es notre **${memberNumber}ᵉ membre** !`,
'',
'🗺️ **Commence par consulter** `🗺️・index` pour découvrir le serveur.',
'📜 **Pense à lire le règlement** et à l’accepter.',
'🎫 **Besoin d’aide ?** Ouvre un ticket depuis le panneau de support.',
'💻 **Développement :** retrouve la communauté dans les salons DEV.',
'',
'━━━━━━━━━━━━━━━━━━━━',
'',
'🚀 **Bon développement et bienvenue parmi nous !**'
].join('\n')
)
.setThumbnail(
member.user.displayAvatarURL({
size: 256
})
)
.setFooter({
text: "Tom's Développement • Bienvenue"
})
.setTimestamp();

await channel.send({
content: member.toString(),
embeds: [embed]
});

await sendLog(
guild,
new EmbedBuilder()
.setTitle('👋 Nouveau membre')
.setDescription(
[
`👤 Membre : ${member}`,
`🆔 ID : ${member.id}`,
`👥 Membres : ${memberNumber}`
].join('\n')
)
.setTimestamp()
);

await updateServerStats(guild);
}

export default {
execute
};
