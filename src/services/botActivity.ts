import {
  ActivityType,
  type Client
} from 'discord.js';

const ACTIVITIES = [
  '🚀 Développement en cours',
  '🧠 Des idées deviennent des projets',
  '⚙️ Construction de nouveaux projets',
  '💻 Création & développement',
  '🔧 Optimisation des systèmes',
  '📦 Préparation de nouvelles fonctionnalités',
  '🛠️ Build. Test. Improve.',
  '🚀 Toujours un projet en cours',
  '💡 Transformation d’idées en réalité',
  '⚡ Innovation en cours',
  '🔍 Analyse & amélioration',
  '📋 Organisation des projets',
  '🌐 Création de solutions digitales',
  '🔥 Le prochain projet se prépare',
  '👑 Tom\'s Développement'
];

let currentIndex = 0;

function updateActivity(client: Client): void {
  const activity =
    ACTIVITIES[currentIndex];

  client.user?.setActivity(
    activity,
    {
      type: ActivityType.Playing
    }
  );

  currentIndex =
    (currentIndex + 1) %
    ACTIVITIES.length;
}

export function startBotActivity(
  client: Client
): void {
  updateActivity(client);

  setInterval(
    () => {
      updateActivity(client);
    },
    30_000
  );
}