import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder
} from 'discord.js';

import type { Command } from '../../types/command.js';

import {
  createQuote,
  deleteQuote,
  getQuote,
  getQuoteStatusLabel,
  getQuotes,
  getQuoteTotal,
  type QuoteLine,
  type QuoteStatus,
  updateQuoteStatus
} from '../../services/quoteService.js';

function isStaff(
  interaction: {
    memberPermissions:
      Readonly<{
        has: (
          permission: bigint
        ) => boolean;
      }> | null;
  }
): boolean {
  return Boolean(
    interaction.memberPermissions?.has(
      PermissionFlagsBits.Administrator
    )
  );
}

function parseLines(
  input: string
): QuoteLine[] {
  const lines =
    input
      .split('\n')
      .map(
        line =>
          line.trim()
      )
      .filter(
        Boolean
      );

  const result: QuoteLine[] = [];

  for (
    let index = 0;
    index < lines.length;
    index++
  ) {
    const parts =
      lines[index]
        .split('|')
        .map(
          value =>
            value.trim()
        );

    if (
      parts.length !== 3
    ) {
      throw new Error(
        `Ligne ${index + 1} invalide. Format attendu : Nom | quantité | prix`
      );
    }

    const [
      name,
      quantityRaw,
      priceRaw
    ] = parts;

    const quantity =
      Number(
        quantityRaw
      );

    const unitPrice =
      Number(
        priceRaw.replace(
          ',',
          '.'
        )
      );

    if (
      !name ||
      !Number.isFinite(
        quantity
      ) ||
      quantity <= 0 ||
      !Number.isFinite(
        unitPrice
      ) ||
      unitPrice < 0
    ) {
      throw new Error(
        `Ligne ${index + 1} invalide.`
      );
    }

    result.push({
      id: index + 1,
      name,
      quantity,
      unitPrice
    });
  }

  if (
    result.length === 0
  ) {
    throw new Error(
      'Le devis doit contenir au moins une ligne.'
    );
  }

  return result;
}

export function buildQuoteEmbed(
  quoteId: number
): EmbedBuilder {
  const quote =
    getQuote(
      quoteId
    );

  if (!quote) {
    return new EmbedBuilder()
      .setTitle(
        '❌ Devis introuvable'
      );
  }

  const total =
    getQuoteTotal(
      quote
    );

  const lines =
    quote.lines
      .map(
        line =>
          `**${line.quantity}× ${line.name}** — ` +
          `${(line.quantity * line.unitPrice).toFixed(2)} €`
      )
      .join('\n');

  const embed =
    new EmbedBuilder()
      .setTitle(
        `🧾 ${quote.number} — ${quote.title}`
      )
      .setDescription(
        quote.description
      )
      .addFields(
        {
          name: '👤 Client',
          value:
            `<@${quote.clientId}>`,
          inline: true
        },
        {
          name: '📊 Statut',
          value:
            getQuoteStatusLabel(
              quote.status
            ),
          inline: true
        },
        {
          name: '📅 Créé le',
          value:
            `<t:${Math.floor(
              new Date(
                quote.createdAt
              ).getTime() / 1000
            )}:d>`,
          inline: true
        },
        {
          name: '📦 Prestations',
          value:
            lines
        },
        {
          name: '💰 Total',
          value:
            `**${total.toFixed(2)} €**`
        },
        {
          name: '⚠️ Conditions de paiement',
          value:
            '**L’acceptation de ce devis engage le client à effectuer le paiement à la livraison du projet.**'
        }
      )
      .setTimestamp();

  if (
    quote.expiresAt
  ) {
    embed.addFields({
      name: '⏰ Validité',
      value:
        `<t:${Math.floor(
          new Date(
            quote.expiresAt
          ).getTime() / 1000
        )}:d>`
    });
  }

  embed.setFooter({
    text:
      'Les prestations et leurs prix sont définis spécifiquement pour ce devis.'
  });

  return embed;
}

export function buildQuoteButtons(
  quoteId: number
): ActionRowBuilder<ButtonBuilder>[] {
  const quote =
    getQuote(
      quoteId
    );

  if (!quote) {
    return [];
  }

  const rows: ActionRowBuilder<ButtonBuilder>[] =
    [];

  if (
    quote.status === 'envoye'
  ) {
    rows.push(
      new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(
              `quote:accept:${quoteId}`
            )
            .setLabel(
              'Accepter'
            )
            .setEmoji(
              '✅'
            )
            .setStyle(
              ButtonStyle.Success
            ),

          new ButtonBuilder()
            .setCustomId(
              `quote:refuse:${quoteId}`
            )
            .setLabel(
              'Refuser'
            )
            .setEmoji(
              '❌'
            )
            .setStyle(
              ButtonStyle.Danger
            )
        )
    );
  }

  return rows;
}

const command: Command = {
  data:
    new SlashCommandBuilder()
      .setName(
        'devis'
      )
      .setDescription(
        'Créer et gérer les devis.'
      )
      .addSubcommand(
        subcommand =>
          subcommand
            .setName(
              'creer'
            )
            .setDescription(
              'Créer un devis.'
            )
            .addUserOption(
              option =>
                option
                  .setName(
                    'client'
                  )
                  .setDescription(
                    'Client du devis.'
                  )
                  .setRequired(
                    true
                  )
            )
            .addStringOption(
              option =>
                option
                  .setName(
                    'titre'
                  )
                  .setDescription(
                    'Objet du devis.'
                  )
                  .setRequired(
                    true
                  )
            )
            .addStringOption(
              option =>
                option
                  .setName(
                    'description'
                  )
                  .setDescription(
                    'Description du projet.'
                  )
                  .setRequired(
                    true
                  )
            )
            .addStringOption(
              option =>
                option
                  .setName(
                    'lignes'
                  )
                  .setDescription(
                    'Nom | quantité | prix — plusieurs lignes séparées par ;'
                  )
                  .setRequired(
                    true
                  )
            )
            .addIntegerOption(
              option =>
                option
                  .setName(
                    'validite'
                  )
                  .setDescription(
                    'Durée de validité en jours.'
                  )
                  .setMinValue(
                    1
                  )
                  .setRequired(
                    false
                  )
            )
      )
      .addSubcommand(
        subcommand =>
          subcommand
            .setName(
              'liste'
            )
            .setDescription(
              'Lister les devis.'
            )
      )
      .addSubcommand(
        subcommand =>
          subcommand
            .setName(
              'voir'
            )
            .setDescription(
              'Voir un devis.'
            )
            .addIntegerOption(
              option =>
                option
                  .setName(
                    'id'
                  )
                  .setDescription(
                    'Identifiant du devis.'
                  )
                  .setMinValue(
                    1
                  )
                  .setRequired(
                    true
                  )
            )
      )
      .addSubcommand(
        subcommand =>
          subcommand
            .setName(
              'statut'
            )
            .setDescription(
              'Modifier le statut d’un devis.'
            )
            .addIntegerOption(
              option =>
                option
                  .setName(
                    'id'
                  )
                  .setDescription(
                    'Identifiant du devis.'
                  )
                  .setMinValue(
                    1
                  )
                  .setRequired(
                    true
                  )
            )
            .addStringOption(
              option =>
                option
                  .setName(
                    'statut'
                  )
                  .setDescription(
                    'Nouveau statut.'
                  )
                  .addChoices(
                    {
                      name: '📝 Brouillon',
                      value: 'brouillon'
                    },
                    {
                      name: '📤 Envoyé',
                      value: 'envoye'
                    },
                    {
                      name: '✅ Accepté',
                      value: 'accepte'
                    },
                    {
                      name: '❌ Refusé',
                      value: 'refuse'
                    },
                    {
                      name: '⏰ Expiré',
                      value: 'expire'
                    },
                    {
                      name: '🚫 Annulé',
                      value: 'annule'
                    }
                  )
                  .setRequired(
                    true
                  )
            )
      )
      .addSubcommand(
        subcommand =>
          subcommand
            .setName(
              'supprimer'
            )
            .setDescription(
              'Supprimer un devis.'
            )
            .addIntegerOption(
              option =>
                option
                  .setName(
                    'id'
                  )
                  .setDescription(
                    'Identifiant du devis.'
                  )
                  .setMinValue(
                    1
                  )
                  .setRequired(
                    true
                  )
            )
      ),

  async execute(
    interaction
  ) {
    const subcommand =
      interaction.options.getSubcommand();

    if (
      subcommand === 'creer'
    ) {
      if (
        !isStaff(
          interaction
        )
      ) {
        await interaction.reply({
          content:
            '❌ La création d’un devis est réservée à l’équipe.',
          ephemeral: true
        });

        return;
      }

      const client =
        interaction.options.getUser(
          'client',
          true
        );

      const title =
        interaction.options.getString(
          'titre',
          true
        );

      const description =
        interaction.options.getString(
          'description',
          true
        );

      const linesInput =
        interaction.options.getString(
          'lignes',
          true
        );

      const validity =
        interaction.options.getInteger(
          'validite',
          false
        );

      let linesInputNormalized =
        linesInput;

      if (
        linesInput.includes(';')
      ) {
        linesInputNormalized =
          linesInput
            .split(';')
            .join('\n');
      }

      let lines: QuoteLine[];

      try {
        lines =
          parseLines(
            linesInputNormalized
          );
      } catch (error) {
        await interaction.reply({
          content:
            `❌ ${error instanceof Error ? error.message : 'Format des lignes invalide.'}`,
          ephemeral: true
        });

        return;
      }

      const quote =
        await createQuote(
          client.id,
          title,
          description,
          lines,
          interaction.user.id,
          validity ??
            undefined
        );

      await interaction.reply({
        content:
          `✅ Le devis **${quote.number}** a été créé.`,
        embeds: [
          buildQuoteEmbed(
            quote.id
          )
        ],
        components:
          buildQuoteButtons(
            quote.id
          )
      });

      return;
    }

    if (
      subcommand === 'liste'
    ) {
      if (
        !isStaff(
          interaction
        )
      ) {
        await interaction.reply({
          content:
            '❌ Cette commande est réservée à l’équipe.',
          ephemeral: true
        });

        return;
      }

      const quotes =
        getQuotes();

      const description =
        quotes.length === 0
          ? 'Aucun devis.'
          : quotes
              .slice(
                0,
                20
              )
              .map(
                quote =>
                  `**${quote.number}** — ${quote.title}\n` +
                  `👤 <@${quote.clientId}> • ` +
                  `${getQuoteStatusLabel(quote.status)} • ` +
                  `**${getQuoteTotal(quote).toFixed(2)} €**`
              )
              .join('\n\n');

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle(
              '🧾 Liste des devis'
            )
            .setDescription(
              description
            )
            .setTimestamp()
        ],
        ephemeral: true
      });

      return;
    }

    const id =
      interaction.options.getInteger(
        'id',
        true
      );

    const quote =
      getQuote(
        id
      );

    if (!quote) {
      await interaction.reply({
        content:
          `❌ Le devis **#${id}** n’existe pas.`,
        ephemeral: true
      });

      return;
    }

    if (
      subcommand === 'voir'
    ) {
      await interaction.reply({
        embeds: [
          buildQuoteEmbed(
            id
          )
        ],
        components:
          buildQuoteButtons(
            id
          )
      });

      return;
    }

    if (
      !isStaff(
        interaction
      )
    ) {
      await interaction.reply({
        content:
          '❌ Cette action est réservée à l’équipe.',
        ephemeral: true
      });

      return;
    }

    if (
      subcommand === 'statut'
    ) {
      const status =
        interaction.options.getString(
          'statut',
          true
        ) as QuoteStatus;

      const updated =
        await updateQuoteStatus(
          id,
          status,
          interaction.user.id
        );

      if (!updated) {
        await interaction.reply({
          content:
            '❌ Impossible de modifier le devis.',
          ephemeral: true
        });

        return;
      }

      await interaction.reply({
        content:
          `✅ Le statut de **${updated.number}** est maintenant **${getQuoteStatusLabel(status)}**.`,
        embeds: [
          buildQuoteEmbed(
            id
          )
        ],
        components:
          buildQuoteButtons(
            id
          )
      });

      return;
    }

    if (
      subcommand === 'supprimer'
    ) {
      const deleted =
        await deleteQuote(
          id,
          interaction.user.id
        );

      if (!deleted) {
        await interaction.reply({
          content:
            '❌ Impossible de supprimer le devis.',
          ephemeral: true
        });

        return;
      }

      await interaction.reply({
        content:
          `🗑️ Le devis **${deleted.number}** a été supprimé.`
      });

      return;
    }
  }
};

export default command;