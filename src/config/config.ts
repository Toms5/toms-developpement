import 'dotenv/config';

const requiredEnv = [
  'DISCORD_TOKEN',
  'CLIENT_ID',
  'GUILD_ID',
  'GITHUB_TOKEN',
  'GITHUB_OWNER',
  'GITHUB_REPO',
  'GITHUB_BRANCH'
] as const;

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(
      `❌ Variable d'environnement manquante : ${key}`
    );
  }
}

export const config = {
  discordToken: process.env.DISCORD_TOKEN!,
  clientId: process.env.CLIENT_ID!,
  guildId: process.env.GUILD_ID!,

  githubToken: process.env.GITHUB_TOKEN!,
  githubOwner: process.env.GITHUB_OWNER!,
  githubRepo: process.env.GITHUB_REPO!,
  githubBranch: process.env.GITHUB_BRANCH!
};