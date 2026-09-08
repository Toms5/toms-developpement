import {
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder
} from 'discord.js';

import {
  addPricingItem,
  deletePricingItem,
  getPricing,
  getPricingCategoryLabel,
  getPricingItem,
  updatePricingItem,
  type PricingCategory
} from '../../services/pricingService.js';

import type { Command } from '../../types/command.js';

const CATEGORY_CHOICES = [
  {
    name: '💻 Développement',
    value: 'developpement'
  },
  {
    name: '🎮 FiveM',
    value: 'fivem'
  },
  {
    name: '🤖 Discord',
    value: 'discord'
  },
  {
    name: '🌐 Site web',
    value: 'site'
  },
  {
    name: '🔧 Maintenance',
    value: 'maintenance'
  },
  {
    name: '📦 Autre',
    value: 'autre'
  }
] as const;

function buildPricingEmbed(): EmbedBuilder {
  const items =
    getPricing();

  const embed =
    new EmbedBuilder()
      .setTitle(
        '💰 Tarifs — Tom\'s Développement'
      )
      .setDescription(
        'Voici les tarifs indicatifs des prestations proposées par Tom\'s Développement.'
      )
      .setTimestamp();

  if (items.length === 0) {
    embed.addFields({
      name: 'Aucun tarif',
      value:
        'Aucun tarif n’est actuellement configuré.'
    });

    return embed;
  }

  const categories =
    new Map<
      PricingCategory,
      typeof items
    >();

  for (const item of items) {
    const current =
      categories.get(
        item.category
      ) ?? [];

    current.push(item);

    categories.set(
      item.category,
      current
    );
  }

  for (
    const [
      category,
      categoryItems
    ] of categories
  ) {
    const value =
      categoryItems
        .map(
          item =>
            `**#${item.id} — ${item.name}**\n` +
            `${item.description}\n` +
            `💶 **À partir de ${item.price.toFixed(2)} €**`
        )
        .join('\n\n');

    embed.addFields({
      name:
        getPricingCategoryLabel(
          category
        ),
      value
    });
  }

  embed.setFooter({
    text:
      'Les tarifs peuvent varier selon les besoins du projet.'
  });

  return embed;
}

function isAdmin(
  interaction: {
    memberPermissions: Readonly<{
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

const command: Command = {
  data:
    new SlashCommandBuilder()
      .setName('tarifs')
      .setDescription(
        'Consulter et gérer les tarifs de Tom\'s Développement.'
      )
      .addSubcommand(
        subcommand =>
          subcommand
            .setName('liste')
            .setDescription(
              'Afficher les tarifs.'
            )
      )
      .addSubcommand(
        subcommand =>
          subcommand
            .setName('ajouter')
            .setDescription(
              'Ajouter un tarif.'
            )
            .addStringOption(
              option =>
                option
                  .setName('nom')
                  .setDescription(
                    'Nom de la prestation.'
                  )
                  .setRequired(true)
            )
            .addStringOption(
              option =>
                option
                  .setName('description')
                  .setDescription(
                    'Description de la prestation.'
                  )
                  .setRequired(true)
            )
            .addNumberOption(
              option =>
                option
                  .setName('prix')
                  .setDescription(
                    'Prix de départ en euros.'
                  )
                  .setMinValue(0)
                  .setRequired(true)
            )
            .addStringOption(
              option =>
                option
                  .setName('categorie')
                  .setDescription(
                    'Catégorie du tarif.'
                  )
                  .addChoices(
                    ...CATEGORY_CHOICES
                  )
                  .setRequired(true)
            )
      )
      .addSubcommand(
        subcommand =>
          subcommand
            .setName('modifier')
            .setDescription(
              'Modifier un tarif.'
            )
            .addIntegerOption(
              option =>
                option
                  .setName('id')
                  .setDescription(
                    'Identifiant du tarif.'
                  )
                  .setMinValue(1)
                  .setRequired(true)
            )
            .addStringOption(
              option =>
                option
                  .setName('nom')
                  .setDescription(
                    'Nouveau nom.'
                  )
                  .setRequired(false)
            )
            .addStringOption(
              option =>
                option
                  .setName('description')
                  .setDescription(
                    'Nouvelle description.'
                  )
                  .setRequired(false)
            )
            .addNumberOption(
              option =>
                option
                  .setName('prix')
                  .setDescription(
                    'Nouveau prix.'
                  )
                  .setMinValue(0)
                  .setRequired(false)
            )
            .addStringOption(
              option =>
                option
                  .setName('categorie')
                  .setDescription(
                    'Nouvelle catégorie.'
                  )
                  .addChoices(
                    ...CATEGORY_CHOICES
                  )
                  .setRequired(false)
            )
      )
      .addSubcommand(
        subcommand =>
          subcommand
            .setName('supprimer')
            .setDescription(
              'Supprimer un tarif.'
            )
            .addIntegerOption(
              option =>
                option
                  .setName('id')
                  .setDescription(
                    'Identifiant du tarif.'
                  )
                  .setMinValue(1)
                  .setRequired(true)
            )
      ),

  async execute(interaction) {
    const subcommand =
      interaction.options.getSubcommand();

    if (
      subcommand === 'liste'
    ) {
      await interaction.reply({
        embeds: [
          buildPricingEmbed()
        ]
      });

      return;
    }

    if (
      !isAdmin(interaction)
    ) {
      await interaction.reply({
        content:
          '❌ Cette action est réservée aux administrateurs.',
        ephemeral: true
      });

      return;
    }

    if (
      subcommand === 'ajouter'
    ) {
      const name =
        interaction.options.getString(
          'nom',
          true
        );

      const description =
        interaction.options.getString(
          'description',
          true
        );

      const price =
        interaction.options.getNumber(
          'prix',
          true
        );

      const category =
        interaction.options.getString(
          'categorie',
          true
        ) as PricingCategory;

      const item =
        await addPricingItem(
          name,
          description,
          category,
          price
        );

      await interaction.reply({
        content:
          `✅ Le tarif **#${item.id} — ${item.name}** a été ajouté à **${item.price.toFixed(2)} €**.`
      });

      return;
    }

    if (
      subcommand === 'modifier'
    ) {
      const id =
        interaction.options.getInteger(
          'id',
          true
        );

      const existing =
        getPricingItem(id);

      if (!existing) {
        await interaction.reply({
          content:
            `❌ Aucun tarif ne correspond à l'ID **#${id}**.`,
          ephemeral: true
        });

        return;
      }

      const name =
        interaction.options.getString(
          'nom',
          false
        );

      const description =
        interaction.options.getString(
          'description',
          false
        );

      const price =
        interaction.options.getNumber(
          'prix',
          false
        );

      const categoryValue =
        interaction.options.getString(
          'categorie',
          false
        );

      if (
        name === null &&
        description === null &&
        price === null &&
        categoryValue === null
      ) {
        await interaction.reply({
          content:
            '❌ Indique au moins une valeur à modifier.',
          ephemeral: true
        });

        return;
      }

      const item =
        await updatePricingItem(
          id,
          {
            ...(name !== null
              ? { name }
              : {}),
            ...(description !== null
              ? { description }
              : {}),
            ...(price !== null
              ? { price }
              : {}),
            ...(categoryValue !== null
              ? {
                  category:
                    categoryValue as PricingCategory
                }
              : {})
          }
        );

      if (!item) {
        await interaction.reply({
          content:
            `❌ Le tarif **#${id}** n'existe plus.`,
          ephemeral: true
        });

        return;
      }

      await interaction.reply({
        content:
          `✅ Le tarif **#${item.id} — ${item.name}** a été mis à jour.`
      });

      return;
    }

    if (
      subcommand === 'supprimer'
    ) {
      const id =
        interaction.options.getInteger(
          'id',
          true
        );

      const item =
        await deletePricingItem(
          id
        );

      if (!item) {
        await interaction.reply({
          content:
            `❌ Aucun tarif ne correspond à l'ID **#${id}**.`,
          ephemeral: true
        });

        return;
      }

      await interaction.reply({
        content:
          `🗑️ Le tarif **#${item.id} — ${item.name}** a été supprimé.`
      });

      return;
    }

    await interaction.reply({
      embeds: [
        buildPricingEmbed()
      ]
    });
  }
};

export default command;