import { Devvit } from '@devvit/public-api';
import * as chrono from 'chrono-node';
import { TIMEZONES, createDatetime, getFormattedDueDate, getFormattedTimeLeft } from './utils';

const GAME_REMINDER = 'game_reminder';
const USER_REMINDERS_KEY = 'user_reminders';
const GAME_GROUPS_KEY = 'game_groups';



Devvit.configure({
  redditAPI: true,
  redis: true,
});

Devvit.addSchedulerJob({
  name: GAME_REMINDER,
  onRun: async (event, context) => {
    const { userId, gameTime, timezone, gameTitle } = event.data!;
    const user = await context.reddit.getUserById(userId);
if (user) {
  // Now TypeScript knows that user is defined
  await context.reddit.sendPrivateMessage({
    to: user.username,
    subject: 'Game Reminder',
    text: `Don't forget! The game starts soon!`,
  });
} else {
  console.error('User not found');
  // Handle the case where the user is not found
}

    await context.reddit.sendPrivateMessage({
      to: user.username,
      subject: 'Game Reminder',
      text: `Don't forget! The game "${gameTitle}" starts at ${getFormattedDueDate(gameTime, timezone)}. Get ready to play!`,
    });
    
    // Remove the reminder from Redis after it's sent
    await removeUserReminder(userId, context.redis);
  },
});

Devvit.addMenuItem({
  label: 'Set Game Reminder',
  location: 'subreddit',
  onPress: async (_, context) => {
    context.ui.showForm(gameReminderForm);
  },
});



async function getUserReminder(userId: string, redis: Devvit.RedisClient): Promise<string | null> {
  return redis.hGet(USER_REMINDERS_KEY, userId);
}

async function setUserReminder(userId: string, jobId: string, redis: Devvit.RedisClient): Promise<void> {
  await redis.hSet(USER_REMINDERS_KEY, userId, jobId);
}

async function removeUserReminder(userId: string, redis: Devvit.RedisClient): Promise<void> {
  await redis.hDel(USER_REMINDERS_KEY, userId);
}

async function groupUserByTime(
  userId: string, 
  time: Date, 
  skillLevel: number, 
  preferredGameMode: string,
  gameTitle: string,
  redis: Devvit.RedisClient
): Promise<void> {
  const timeKey = time.toISOString().split('T')[0]; // Group by date
  const userInfo = JSON.stringify({ userId, skillLevel, preferredGameMode, gameTitle });
  await redis.hSet(GAME_GROUPS_KEY, timeKey, userInfo);
}

Devvit.addMenuItem({
  label: 'View Game Groups',
  location: 'subreddit',
  onPress: async (_, context) => {
    const groups = await context.redis.hGetAll(GAME_GROUPS_KEY);
    let message = 'Game Groups:\n\n';
    for (const [date, usersJson] of Object.entries(groups)) {
      const users = JSON.parse(usersJson);
      message += `${date}:\n`;
      for (const user of users) {
        message += `- ${user.gameTitle}: ${user.preferredGameMode} (Skill: ${user.skillLevel})\n`;
      }
      message += '\n';
    }
    context.ui.showToast(message);
  },
});

export default Devvit;