import {
  EmbedBuilder,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type TextChannel
} from 'discord.js';

import type { Command } from '../../types/command.js';

const REVIEW_CHANNEL_NAME = '💬・avis-clients';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('avis')
    .setDescription(
      'Affiche les statistiques de satisfaction des clients.'
    ),

  async execute(
    interaction: ChatInputCommandInteraction
  ) {
    const guild = interaction.guild;

    if (!guild) {
      await interaction.reply({
        content:
          '❌ Cette commande doit être utilisée sur un serveur.',
        ephemeral: true
      });

      return;
    }

    const channel = guild.channels.cache.find(
      channel =>
        channel.type === 0 &&
        channel.name === REVIEW_CHANNEL_NAME
    );

    if (!channel || channel.type !== 0) {
      await interaction.reply({
        content:
          '❌ Le salon des avis clients n’existe pas encore.',
        ephemeral: true
      });

      return;
    }

    const messages = await channel.messages.fetch({
      limit: 100
    });

    const ratings: number[] = [];

    for (const message of messages.values()) {
      const embed = message.embeds[0];

      if (!embed) {
        continue;
      }

      const description = embed.description;

      if (!description) {
        continue;
      }

      const match = description.match(
        /(\d(?:\.\d)?)\/5/
      );

      if (!match) {
        continue;
      }

      const rating = Number(match[1]);

      if (
        Number.isInteger(rating) &&
        rating >= 1 &&
        rating <= 5
      ) {
        ratings.push(rating);
      }
    }

    const total = ratings.length;

    if (total === 0) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('⭐ Satisfaction clients')
            .setDescription(
              [
                'Aucun avis client n’a encore été publié.',
                '',
                'Les statistiques apparaîtront automatiquement dès qu’un premier avis sera disponible.'
              ].join('\n')
            )
            .setFooter({
              text:
                "Tom's Développement • Statistiques"
            })
            .setTimestamp()
        ]
      });

      return;
    }

    const totalRating =
      ratings.reduce(
        (sum, rating) => sum + rating,
        0
      );

    const average =
      totalRating / total;

    const count5 =
      ratings.filter(rating => rating === 5).length;

    const count4 =
      ratings.filter(rating => rating === 4).length;

    const count3 =
      ratings.filter(rating => rating === 3).length;

    const count2 =
      ratings.filter(rating => rating === 2).length;

    const count1 =
      ratings.filter(rating => rating === 1).length;

    const averageStars =
      '⭐'.repeat(
        Math.round(average)
      );

    const embed =
      new EmbedBuilder()
        .setTitle('⭐ Satisfaction clients')
        .setDescription(
          [
            '## Note moyenne',
            '',
            `${averageStars} **${average.toFixed(1)} / 5**`,
            '',
            `📊 **${total} avis publiés**`
          ].join('\n')
        )
        .addFields(
          {
            name: '⭐⭐⭐⭐⭐ 5/5',
            value:
              `${count5} avis`,
            inline: true
          },
          {
            name: '⭐⭐⭐⭐ 4/5',
            value:
              `${count4} avis`,
            inline: true
          },
          {
            name: '⭐⭐⭐ 3/5',
            value:
              `${count3} avis`,
            inline: true
          },
          {
            name: '⭐⭐ 2/5',
            value:
              `${count2} avis`,
            inline: true
          },
          {
            name: '⭐ 1/5',
            value:
              `${count1} avis`,
            inline: true
          }
        )
        .setFooter({
          text:
            "Tom's Développement • Satisfaction client"
        })
        .setTimestamp();

    await interaction.reply({
      embeds: [embed]
    });
  }
};

export default command;