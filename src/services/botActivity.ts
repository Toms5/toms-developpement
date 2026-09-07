import {
  ActivityType,
  type Client
} from 'discord.js';

const activities = [
  {
    name: "vos projets",
    type: ActivityType.Playing
  },
  {
    name: "Tom's Développement",
    type: ActivityType.Watching
  },
  {
    name: "vos tickets",
    type: ActivityType.Playing
  },
  {
    name: "vos idées",
    type: ActivityType.Listening
  },
  {
    name: "de nouveaux projets",
    type: ActivityType.Watching
  },
  {
    name: "le serveur",
    type: ActivityType.Playing
  }
];

let currentIndex = 0;

export function startBotActivity(
  client: Client
): void {
  const updateActivity = () => {
    const activity =
      activities[currentIndex];

    client.user?.setActivity(
      activity.name,
      {
        type: activity.type
      }
    );

    currentIndex =
      (currentIndex + 1) %
      activities.length;
  };

  updateActivity();

  setInterval(
    updateActivity,
    30_000
  );
}