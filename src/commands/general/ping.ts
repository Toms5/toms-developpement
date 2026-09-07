import {
    SlashCommandBuilder,
    type ChatInputCommandInteraction
} from 'discord.js';

import type { Command } from '../../types/command.js';

const command: Command = {
    data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Vérifie si Tom\'s Développement répond.'),

    async execute(intercation: ChatInputCommandInteraction) {
        await intercation.reply({
            content: '🏓 Pong ! Tom\'s Développement est opérationnel.'
        });
    }
};

export default command;