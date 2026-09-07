import {
  EmbedBuilder,
  type MessageReaction,
  type PartialMessageReaction,
  type User,
  type PartialUser
} from 'discord.js';

import { sendLog } from '../services/logger.js';

const REGLEMENT_BUTTON_EMOJI = '✅';

export async function execute(
  reaction: MessageReaction | PartialMessageReaction,
  user: User | PartialUser
): Promise<void> {
  if (user.bot) {
    return;
  }

  if (
    reaction.partial
  ) {
    try {
      await reaction.fetch();
    } catch {
      return;
    }
  }

  if (
    reaction.emoji.name !==
    REGLEMENT_BUTTON_EMOJI
  ) {
    return;
  }

  const message =
    reaction.message;

  if (
    message.partial
  ) {
    try {
      await message.fetch();
    } catch {
      return;
    }
  }

  if (
    !message.guild ||
    message.author?.bot !== true
  ) {
    return;
  }

  const embed =
    message.embeds[0];

  if (!embed) {
    return;
  }

  const footer =
    embed.footer?.text;

  if (!footer) {
    return;
  }

  const match =
    footer.match(
      /ROLE_ID:(\d+)/
    );

  if (!match) {
    return;
  }

  const roleId =
    match[1];

  const member =
    await message.guild.members
      .fetch(user.id)
      .catch(() => null);

  if (!member) {
    return;
  }

  const role =
    message.guild.roles.cache.get(
      roleId
    );

  if (!role) {
    return;
  }

  if (
    member.roles.cache.has(role.id)
  ) {
    return;
  }

  if (
    !role.editable
  ) {
    return;
  }

  await member.roles
    .add(
      role,
      'Acceptation du règlement'
    )
    .catch(() => null);

  await sendLog(
    message.guild,
    new EmbedBuilder()
      .setTitle('📜 Règlement accepté')
      .setDescription(
        [
          `👤 Membre : ${member.user}`,
          `🎭 Rôle attribué : ${role}`,
          '',
          'Le membre a accepté le règlement.'
        ].join('\n')
      )
      .setTimestamp()
  );
}

export default {
  execute
};