import { Devvit } from "@devvit/public-api";
import * as chrono from 'chrono-node';
import { TIMEZONES } from "../../constants/timezones.js";
import { getFormattedDueDate ,createDatetime} from "../../utils/utils.js";

const gameReminderForm = Devvit.createForm(
    {
      fields: [
        { name: 'gameTitle', label: 'Game Title', type: 'string', required: true },
        { name: 'gameTime', label: 'Game Time', type: 'string', required: true },
        { 
          name: 'timezone', 
          label: 'Your Timezone', 
          type: 'select',
          options: TIMEZONES.map(tz => ({ label: tz, value: tz })),
          required: true
        },
        { name: 'skillLevel', label: 'Your Skill Level (1-10)', type: 'number', required: true },
        { name: 'preferredGameMode', label: 'Preferred Game Mode', type: 'string', required: true },
      ],
      title: 'Set Game Reminder and Preferences',
      acceptLabel: 'Set Reminder',
    },
    async (event, context) => {
      const { gameTitle, gameTime, timezone, skillLevel, preferredGameMode } = event.values;
      const userId = context.userId!;
  
      const parsedTime = chrono.parseDate(`${gameTime} ${timezone}`);
      if (!parsedTime) {
        context.ui.showToast('Invalid time. Please try again.');
        return;
      }
  
      const reminderTime = new Date(parsedTime.getTime() - 30 * 60 * 1000); // 30 minutes before
      const formattedGameTime = createDatetime(
        parsedTime.toISOString().split('T')[0],
        parsedTime.toTimeString().split(' ')[0],
        timezone
      );
  
      // Check for existing reminder
      const existingReminder = await getUserReminder(userId, context.redis);
      if (existingReminder) {
        context.ui.showToast('You already have a reminder set. Please cancel it first if you want to set a new one.');
        return;
      }
  
      const jobId = await context.scheduler.runJob({
        name: GAME_REMINDER,
        data: { userId, gameTime: formattedGameTime, timezone, gameTitle },
        runAt: reminderTime,
      });
  
      // Store reminder in Redis
      await setUserReminder(userId, jobId, context.redis);
  
      // Group user based on game time
      await groupUserByTime(userId, parsedTime, skillLevel, preferredGameMode, gameTitle, context.redis);
  
      context.ui.showToast(`Reminder set for ${getFormattedDueDate(formattedGameTime, timezone)}`);
    }
  );