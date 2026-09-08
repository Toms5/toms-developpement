import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  ModalBuilder,
  PermissionFlagsBits,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextInputBuilder,
  TextInputStyle,
  type Guild,
  type StringSelectMenuInteraction,
  type ButtonInteraction,
  type ModalSubmitInteraction
} from 'discord.js';

import { sendLog } from './logger.js';

const TICKET_CATEGORY_NAME =
  '🎫 TICKETS';

const ARCHIVE_CATEGORY_NAME =
  '🗄️ TICKETS ARCHIVES';

const REVIEW_CHANNEL_NAME =
  '💬・avis-clients';

const TICKET_TYPES: Record<string, string> = {
  projet: '💻 Projet',
  bug: '🐛 Bug',
  question: '💬 Question',
  devis: '💰 Devis',
  support: '📞 Support',
  autre: '📦 Autre'
};

interface PendingReview {
  ticketNumber: string;
  ticketType: string;
  clientId: string;
  rating: number;
  comment: string;
  anonymous: boolean;
}

const pendingReviews =
  new Map<string, PendingReview>();

async function getOrCreateTicketCategory(
  guild: Guild
) {
  const existing =
    guild.channels.cache.find(
      channel =>
        channel.type ===
          ChannelType.GuildCategory &&
        channel.name ===
          TICKET_CATEGORY_NAME
    );

  if (
    existing?.type ===
    ChannelType.GuildCategory
  ) {
    return existing;
  }

  return guild.channels.create({
    name: TICKET_CATEGORY_NAME,
    type: ChannelType.GuildCategory
  });
}

async function getOrCreateArchiveCategory(
  guild: Guild
) {
  const existing =
    guild.channels.cache.find(
      channel =>
        channel.type ===
          ChannelType.GuildCategory &&
        channel.name ===
          ARCHIVE_CATEGORY_NAME
    );

  if (
    existing?.type ===
    ChannelType.GuildCategory
  ) {
    return existing;
  }

  return guild.channels.create({
    name: ARCHIVE_CATEGORY_NAME,
    type: ChannelType.GuildCategory
  });
}

async function getOrCreateReviewChannel(
  guild: Guild
) {
  const existing =
    guild.channels.cache.find(
      channel =>
        channel.type ===
          ChannelType.GuildText &&
        channel.name ===
          REVIEW_CHANNEL_NAME
    );

  if (
    existing?.type ===
    ChannelType.GuildText
  ) {
    return existing;
  }

  return guild.channels.create({
    name: REVIEW_CHANNEL_NAME,
    type: ChannelType.GuildText,
    permissionOverwrites: [
      {
        id: guild.roles.everyone.id,
        deny: [
          PermissionFlagsBits.SendMessages
        ]
      }
    ]
  });
}

function getNextTicketNumber(
  guild: Guild
): number {
  let highest = 0;

  for (
    const channel of
      guild.channels.cache.values()
  ) {
    const match =
      channel.name.match(
        /^(?:ticket|closed-ticket)-(\d+)$/
      );

    if (!match) {
      continue;
    }

    highest =
      Math.max(
        highest,
        Number(match[1])
      );
  }

  return highest + 1;
}

function getStaffRoles(
  guild: Guild
) {
  return guild.roles.cache.filter(
    role =>
      role.name === 'DEV' ||
      role.name === 'OWNER' ||
      role.name === '🛠️ DEV' ||
      role.name === '👑 OWNER'
  );
}

function isStaff(
  interaction: ButtonInteraction
): boolean {
  return (
    interaction.memberPermissions?.has(
      PermissionFlagsBits.Administrator
    ) ||
    interaction.memberPermissions?.has(
      PermissionFlagsBits.ManageChannels
    ) ||
    false
  );
}

function getTicketOwnerId(
  topic: string | null
): string | null {
  const match =
    topic?.match(
      /owner:(\d+)/
    );

  return match?.[1] ?? null;
}

function getTicketNumber(
  channelName: string
): string {
  const match =
    channelName.match(
      /(?:ticket|closed-ticket)-(\d+)/
    );

  return match?.[1] ?? '000';
}

function getTicketType(
  topic: string | null
): string {
  const match =
    topic?.match(
      /type:([a-z]+)/
    );

  return (
    TICKET_TYPES[
      match?.[1] ?? 'autre'
    ] ??
    TICKET_TYPES.autre
  );
}

export function findUserOpenTicket(
  guild: Guild,
  userId: string
) {
  return guild.channels.cache.find(
    channel => {
      if (
        channel.type !==
        ChannelType.GuildText
      ) {
        return false;
      }

      if (
        !channel.name.startsWith(
          'ticket-'
        )
      ) {
        return false;
      }

      return channel.topic?.includes(
        `owner:${userId}`
      );
    }
  );
}

export async function showTicketTypeMenu(
  interaction: ButtonInteraction
): Promise<void> {
  const menu =
    new StringSelectMenuBuilder()
      .setCustomId('ticket:type')
      .setPlaceholder(
        'Choisir le type de demande'
      )
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('Projet')
          .setDescription(
            'Création ou suivi d’un projet'
          )
          .setEmoji('💻')
          .setValue('projet'),

        new StringSelectMenuOptionBuilder()
          .setLabel('Bug')
          .setDescription(
            'Signaler un problème'
          )
          .setEmoji('🐛')
          .setValue('bug'),

        new StringSelectMenuOptionBuilder()
          .setLabel('Question')
          .setDescription(
            'Poser une question'
          )
          .setEmoji('💬')
          .setValue('question'),

        new StringSelectMenuOptionBuilder()
          .setLabel('Devis')
          .setDescription(
            'Demander un devis'
          )
          .setEmoji('💰')
          .setValue('devis'),

        new StringSelectMenuOptionBuilder()
          .setLabel('Support')
          .setDescription(
            'Demande de support'
          )
          .setEmoji('📞')
          .setValue('support'),

        new StringSelectMenuOptionBuilder()
          .setLabel('Autre')
          .setDescription(
            'Autre demande'
          )
          .setEmoji('📦')
          .setValue('autre')
      );

  const row =
    new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(menu);

  await interaction.reply({
    content:
      '🎫 **Quel type de demande souhaitez-vous créer ?**',
    components: [row],
    ephemeral: true
  });
}

export async function createTicket(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const guild =
    interaction.guild;

  if (!guild) {
    await interaction.reply({
      content:
        '❌ Impossible de créer un ticket ici.',
      ephemeral: true
    });

    return;
  }

  const existingTicket =
    findUserOpenTicket(
      guild,
      interaction.user.id
    );

  if (existingTicket) {
    await interaction.reply({
      content:
        `❌ Tu as déjà un ticket ouvert : ${existingTicket}`,
      ephemeral: true
    });

    return;
  }

  await interaction.deferReply({
    ephemeral: true
  });

  const typeKey =
    interaction.values[0] ??
    'autre';

  const ticketType =
    TICKET_TYPES[typeKey] ??
    TICKET_TYPES.autre;

  const category =
    await getOrCreateTicketCategory(
      guild
    );

  const number =
    getNextTicketNumber(guild);

  const formattedNumber =
    String(number).padStart(3, '0');

  const channelName =
    `ticket-${formattedNumber}`;

  const staffRoles =
    getStaffRoles(guild);

  const permissionOverwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [
        PermissionFlagsBits.ViewChannel
      ]
    },
    {
      id: interaction.user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks
      ]
    }
  ];

  for (
    const role of staffRoles.values()
  ) {
    permissionOverwrites.push({
      id: role.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.ManageChannels
      ]
    });
  }

  const channel =
    await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: category.id,
      topic:
        `Ticket #${number} | owner:${interaction.user.id} | type:${typeKey}`,
      permissionOverwrites
    });

  const embed =
    new EmbedBuilder()
      .setTitle(
        `🎫 Ticket #${formattedNumber}`
      )
      .setDescription(
        [
          `Bonjour ${interaction.user} 👋`,
          '',
          `**Type de demande :** ${ticketType}`,
          '',
          'Merci de détailler votre demande afin que l’équipe puisse vous aider efficacement.',
          '',
          '📋 **Informations utiles :**',
          '• Décrivez votre besoin',
          '• Ajoutez les captures ou fichiers nécessaires',
          '• Précisez les erreurs rencontrées si nécessaire',
          '',
          'Un membre de l’équipe va vous répondre prochainement.'
        ].join('\n')
      )
      .addFields(
        {
          name: '👤 Client',
          value: `${interaction.user}`,
          inline: true
        },
        {
          name: '📂 Catégorie',
          value: ticketType,
          inline: true
        }
      )
      .setFooter({
        text:
          "Tom's Développement • Support"
      })
      .setTimestamp();

  const closeButton =
    new ButtonBuilder()
      .setCustomId('ticket:close')
      .setLabel('Fermer le ticket')
      .setEmoji('🔒')
      .setStyle(
        ButtonStyle.Danger
      );

  const row =
    new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        closeButton
      );

  const staffMention =
    staffRoles.first()
      ? `<@&${staffRoles.first()?.id}>`
      : '';

  await channel.send({
    content:
      `${interaction.user} ${staffMention}`,
    embeds: [embed],
    components: [row]
  });

  await sendLog(
    guild,
    new EmbedBuilder()
      .setTitle('🎫 Ticket créé')
      .setDescription(
        [
          `Ticket : **#${formattedNumber}**`,
          `Client : <@${interaction.user.id}>`,
          `Type : **${ticketType}**`,
          `Salon : ${channel}`
        ].join('\n')
      )
      .setTimestamp()
  );

  await interaction.editReply({
    content:
      `✅ Ton ticket a été créé : ${channel}`
  });
}

export async function closeTicket(
  interaction: ButtonInteraction
): Promise<void> {
  const channel =
    interaction.channel;

  if (
    !channel ||
    channel.type !==
      ChannelType.GuildText ||
    !channel.name.startsWith(
      'ticket-'
    )
  ) {
    await interaction.reply({
      content:
        '❌ Ce bouton ne peut être utilisé que dans un ticket ouvert.',
      ephemeral: true
    });

    return;
  }

  const ownerId =
    getTicketOwnerId(
      channel.topic
    );

  if (!ownerId) {
    await interaction.reply({
      content:
        '❌ Impossible d’identifier le client de ce ticket.',
      ephemeral: true
    });

    return;
  }

  const authorized =
    interaction.user.id === ownerId ||
    isStaff(interaction);

  if (!authorized) {
    await interaction.reply({
      content:
        '❌ Seul le client concerné ou un membre de l’équipe peut fermer ce ticket.',
      ephemeral: true
    });

    return;
  }

  await interaction.deferReply({
    ephemeral: true
  });

  const ticketNumber =
    getTicketNumber(
      channel.name
    );

  const ticketType =
    getTicketType(
      channel.topic
    );

  const client =
    await interaction.guild?.members
      .fetch(ownerId)
      .catch(() => null);

  if (!client) {
    await interaction.editReply({
      content:
        '❌ Impossible de retrouver le client.'
    });

    return;
  }

  /*
   * On bloque immédiatement toute nouvelle fermeture.
   * Le client peut toujours voir le salon et utiliser
   * le bouton de notation.
   */
  const closedButton =
    new ButtonBuilder()
      .setCustomId(
        'ticket:close:disabled'
      )
      .setLabel(
        'Ticket en cours de fermeture'
      )
      .setEmoji('🔒')
      .setStyle(
        ButtonStyle.Secondary
      )
      .setDisabled(true);

  await interaction.message.edit({
    components: [
      new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          closedButton
        )
    ]
  }).catch(() => null);

  /*
   * Le client ne peut plus écrire une fois le ticket
   * fermé, mais conserve ViewChannel + ReadMessageHistory
   * afin de pouvoir donner son avis.
   */
  await channel.permissionOverwrites.edit(
    ownerId,
    {
      ViewChannel: true,
      SendMessages: false,
      ReadMessageHistory: true
    }
  );

  const ratingButtons =
    new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        ...[1, 2, 3, 4, 5].map(
          rating =>
            new ButtonBuilder()
              .setCustomId(
                `ticket:rate:${rating}`
              )
              .setLabel(
                String(rating)
              )
              .setEmoji('⭐')
              .setStyle(
                rating <= 2
                  ? ButtonStyle.Danger
                  : rating === 3
                    ? ButtonStyle.Secondary
                    : rating === 4
                      ? ButtonStyle.Primary
                      : ButtonStyle.Success
              )
        )
      );

  await channel.send({
    content:
      `<@${ownerId}>`,
    embeds: [
      new EmbedBuilder()
        .setTitle(
          '⭐ Votre avis nous intéresse'
        )
        .setDescription(
          [
            `Merci pour votre confiance, ${client.user.username} !`,
            '',
            'Avant de clôturer définitivement ce ticket, nous aimerions connaître votre satisfaction.',
            '',
            '**Quelle note donnez-vous à votre expérience ?**',
            '',
            '⭐ 1 = Très insatisfait',
            '⭐⭐ 2 = Insatisfait',
            '⭐⭐⭐ 3 = Correct',
            '⭐⭐⭐⭐ 4 = Satisfait',
            '⭐⭐⭐⭐⭐ 5 = Excellent'
          ].join('\n')
        )
        .setFooter({
          text:
            "Tom's Développement • Satisfaction"
        })
        .setTimestamp()
    ],
    components: [ratingButtons],
    allowedMentions: {
      users: [ownerId]
    }
  });

  await sendLog(
    interaction.guild!,
    new EmbedBuilder()
      .setTitle(
        '🔒 Ticket en cours de fermeture'
      )
      .setDescription(
        [
          `Ticket : **#${ticketNumber}**`,
          `Client : <@${ownerId}>`,
          `Fermé par : <@${interaction.user.id}>`,
          `Type : **${ticketType}**`
        ].join('\n')
      )
      .setTimestamp()
  );

  await interaction.editReply({
    content:
      '⭐ La demande de satisfaction a été envoyée au client.'
  });
}

export async function handleTicketRating(
  interaction: ButtonInteraction
): Promise<void> {
  const channel =
    interaction.channel;

  if (
    !channel ||
    channel.type !==
      ChannelType.GuildText
  ) {
    await interaction.reply({
      content:
        '❌ Cette action doit être effectuée dans un ticket.',
      ephemeral: true
    });

    return;
  }

  if (
    !channel.name.startsWith(
      'ticket-'
    )
  ) {
    await interaction.reply({
      content:
        '❌ Ce ticket n’est plus disponible pour une évaluation.',
      ephemeral: true
    });

    return;
  }

  const ownerId =
    getTicketOwnerId(
      channel.topic
    );

  if (
    ownerId !==
    interaction.user.id
  ) {
    await interaction.reply({
      content:
        '❌ Seul le client concerné peut donner une note.',
      ephemeral: true
    });

    return;
  }

  const rating =
    Number(
      interaction.customId.split(':')[2]
    );

  if (
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5
  ) {
    await interaction.reply({
      content:
        '❌ Cette note est invalide.',
      ephemeral: true
    });

    return;
  }

  pendingReviews.set(
    channel.id,
    {
      ticketNumber:
        getTicketNumber(
          channel.name
        ),
      ticketType:
        getTicketType(
          channel.topic
        ),
      clientId:
        interaction.user.id,
      rating,
      comment: '',
      anonymous: true
    }
  );

  /*
   * Désactive les boutons de notation afin d'éviter
   * qu'un client change plusieurs fois sa note.
   */
  await interaction.message.edit({
    components: [
      new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          ...[1, 2, 3, 4, 5].map(
            value =>
              new ButtonBuilder()
                .setCustomId(
                  `ticket:rate:disabled:${value}`
                )
                .setLabel(
                  String(value)
                )
                .setEmoji('⭐')
                .setStyle(
                  value === rating
                    ? ButtonStyle.Success
                    : ButtonStyle.Secondary
                )
                .setDisabled(true)
          )
        )
    ]
  }).catch(() => null);

  const modal =
    new ModalBuilder()
      .setCustomId(
        'ticket:review'
      )
      .setTitle(
        '⭐ Votre avis'
      );

  const commentInput =
    new TextInputBuilder()
      .setCustomId(
        'comment'
      )
      .setLabel(
        'Votre commentaire (facultatif)'
      )
      .setPlaceholder(
        'Votre retour nous aide à progresser...'
      )
      .setStyle(
        TextInputStyle.Paragraph
      )
      .setRequired(false)
      .setMaxLength(1000);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>()
      .addComponents(
        commentInput
      )
  );

  await interaction.showModal(
    modal
  );
}

export async function handleReviewSubmit(
  interaction: ModalSubmitInteraction
): Promise<void> {
  const channel =
    interaction.channel;

  if (
    !channel ||
    channel.type !==
      ChannelType.GuildText
  ) {
    return;
  }

  const review =
    pendingReviews.get(
      channel.id
    );

  if (!review) {
    await interaction.reply({
      content:
        '❌ Cette évaluation n’est plus disponible.',
      ephemeral: true
    });

    return;
  }

  if (
    review.clientId !==
    interaction.user.id
  ) {
    await interaction.reply({
      content:
        '❌ Cette évaluation ne vous appartient pas.',
      ephemeral: true
    });

    return;
  }

  review.comment =
    interaction.fields
      .getTextInputValue(
        'comment'
      )
      .trim();

  const row =
    new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(
            'ticket:publish:name'
          )
          .setLabel(
            'Afficher mon nom'
          )
          .setEmoji('👤')
          .setStyle(
            ButtonStyle.Primary
          ),

        new ButtonBuilder()
          .setCustomId(
            'ticket:publish:anonymous'
          )
          .setLabel(
            'Rester anonyme'
          )
          .setEmoji('🕶️')
          .setStyle(
            ButtonStyle.Secondary
          )
      );

  await interaction.reply({
    content:
      '👤 **Dernière étape**\n\nSouhaitez-vous afficher votre nom Discord dans le salon des avis ?',
    components: [row],
    ephemeral: true
  });
}

function sanitizeComment(
  comment: string
): string {
  return comment
    .replace(
      /@everyone/gi,
      '@\u200Beveryone'
    )
    .replace(
      /@here/gi,
      '@\u200Bhere'
    )
    .replace(
      /<@&\d+>/g,
      '[mention de rôle]'
    )
    .replace(
      /<@!?\d+>/g,
      '[mention]'
    );
}

export async function publishReview(
  interaction: ButtonInteraction
): Promise<void> {
  const channel =
    interaction.channel;

  if (
    !channel ||
    channel.type !==
      ChannelType.GuildText ||
    !interaction.guild
  ) {
    return;
  }

  const review =
    pendingReviews.get(
      channel.id
    );

  if (!review) {
    await interaction.reply({
      content:
        '❌ Cette évaluation n’est plus disponible.',
      ephemeral: true
    });

    return;
  }

  if (
    review.clientId !==
    interaction.user.id
  ) {
    await interaction.reply({
      content:
        '❌ Vous ne pouvez pas publier cet avis.',
      ephemeral: true
    });

    return;
  }

  review.anonymous =
    interaction.customId ===
    'ticket:publish:anonymous';

  const reviewChannel =
    await getOrCreateReviewChannel(
      interaction.guild
    );

  const clientName =
    review.anonymous
      ? 'Client anonyme'
      : interaction.user.username;

  const stars =
    '⭐'.repeat(
      review.rating
    );

  const safeComment =
    sanitizeComment(
      review.comment
    );

  const reviewEmbed =
    new EmbedBuilder()
      .setTitle(
        '⭐ Nouvel avis client'
      )
      .setDescription(
        [
          `### ${stars} **${review.rating}/5**`,
          '',
          `👤 **Client :** ${clientName}`,
          `📂 **Service :** ${review.ticketType}`,
          '',
          safeComment
            ? `💬 **Avis :**\n> ${safeComment}`
            : '💬 **Avis :** Aucun commentaire.',
          '',
          `🎫 **Ticket :** #${review.ticketNumber}`
        ].join('\n')
      )
      .setFooter({
        text:
          "Tom's Développement • Avis clients"
      })
      .setTimestamp();

  await reviewChannel.send({
    embeds: [reviewEmbed],
    allowedMentions: {
      parse: []
    }
  });

  const archiveCategory =
    await getOrCreateArchiveCategory(
      interaction.guild
    );

  /*
   * Le client ne peut plus voir le ticket après
   * publication de son avis.
   */
  await channel.permissionOverwrites.edit(
    review.clientId,
    {
      ViewChannel: false,
      SendMessages: false
    }
  );

  /*
   * Le staff peut consulter l'archive mais ne peut
   * plus écrire dedans.
   */
  const staffRoles =
    getStaffRoles(
      interaction.guild
    );

  for (
    const role of staffRoles.values()
  ) {
    await channel.permissionOverwrites.edit(
      role.id,
      {
        ViewChannel: true,
        SendMessages: false,
        ReadMessageHistory: true,
        ManageChannels: true
      }
    );
  }

  await channel.setParent(
    archiveCategory.id
  );

  await channel.setName(
    `closed-ticket-${review.ticketNumber}`
  );

  await channel.setTopic(
    `${channel.topic ?? ''} | review:${review.rating} | published:true`
  );

  await channel.send({
    embeds: [
      new EmbedBuilder()
        .setTitle(
          '🗄️ Ticket archivé'
        )
        .setDescription(
          [
            'Ce ticket a été clôturé et archivé.',
            '',
            `⭐ Satisfaction : **${review.rating}/5**`,
            `👤 Avis : **${review.anonymous ? 'Anonyme' : 'Nom affiché'}**`,
            '',
            'Merci pour votre confiance !'
          ].join('\n')
        )
        .setTimestamp()
    ]
  });

  await sendLog(
    interaction.guild,
    new EmbedBuilder()
      .setTitle(
        '⭐ Avis client publié'
      )
      .setDescription(
        [
          `Ticket : **#${review.ticketNumber}**`,
          `⭐ Note : **${review.rating}/5**`,
          `👤 Client : **${clientName}**`,
          `📂 Service : **${review.ticketType}**`
        ].join('\n')
      )
      .setTimestamp()
  );

  pendingReviews.delete(
    channel.id
  );

  await interaction.update({
    content:
      '✅ Merci ! Votre avis a été publié dans **💬・avis-clients**.',
    components: []
  });
}