import { TIMEZONES } from "../constants/timezones.js";
import moment from 'moment-timezone';
import { parse } from 'tldts';


export const REDD_IT: string = 'redd.it';
export const REDDIT_STATIC: string = 'redditstatic.com';
export const REDDIT_MEDIA: string = 'redditmedia.com';
export const APPROVED_DOMAINS: string[] = [REDD_IT, REDDIT_STATIC, REDDIT_MEDIA];
export const ApprovedDomainsFormatted: string = APPROVED_DOMAINS.map(
  (domain) => `"${domain}"`
).join(', ');

// async function getUserReminder(userId: string, redis: Devvit.RedisClient): Promise<string | null> {
//     return redis.hGet(USER_REMINDERS_KEY, userId);
//   }
  
//   async function setUserReminder(userId: string, jobId: string, redis: Devvit.RedisClient): Promise<void> {
//     await redis.hSet(USER_REMINDERS_KEY, userId, jobId);
//   }
  
//   async function removeUserReminder(userId: string, redis: Devvit.RedisClient): Promise<void> {
//     await redis.hDel(USER_REMINDERS_KEY, userId);
//   }

// Function to check if an image URL is from an approved Reddit domain
export function isRedditImage(imageUrl: string | undefined): boolean {
  if (!imageUrl) {
    return true;
  }
  const domain = parse(imageUrl).domain;
  return APPROVED_DOMAINS.includes(domain || '');
}

export const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};


export const getTimezones = (): string[] => {
    return [...TIMEZONES];
  };
  
  export const createDatetime = (
    dateString: string, // expected in `yyyy-mm-dd` format
    timeString: string,
    timezoneName: string
  ): string => {
    const date = new Date(`${dateString}T${timeString}`);
    const sameDateInCorrectTimezone = new Date(
      date.toLocaleString('en-US', { timeZone: timezoneName })
    );
    const timeDiff = date.getTime() - sameDateInCorrectTimezone.getTime();
    const timezonedDate = new Date(date.getTime() + timeDiff);
    return timezonedDate.toISOString();
  };
  
  /**
   * Returns a formatted due date string
   * @param dateTime ISO-8601 string
   * @param timeZone Timezone name as in Intl.supportedValuesOf('timeZone'). e.g. Europe/Amsterdam
   */
  export const getFormattedDueDate = (dateTime: string, timeZone: string = 'UTC'): string => {
    // desired date format "October 27, 2023 at 12:00 PM EDT"
    return moment(dateTime).tz(timeZone).format('MMMM D, YYYY [at] h:mm A z');
  };
  
  type CountdownEntry = {
    value: number;
    label: string;
  };
  export type TimeLeft = [CountdownEntry, CountdownEntry, CountdownEntry, CountdownEntry];
  
  export const getFormattedTimeLeft = (timeDiffMs: number): TimeLeft | null => {
    if (timeDiffMs <= 0) {
      return [
        { value: 0, label: 'days' },
        { value: 0, label: 'hours' },
        { value: 0, label: 'mins' },
        { value: 0, label: 'sec' },
      ];
    }
    const timeDiffSeconds = timeDiffMs / 1000;
    const seconds = Math.floor(timeDiffSeconds % 60);
    const minutes = Math.floor((timeDiffSeconds / 60) % 60);
    const hours = Math.floor((timeDiffSeconds / (60 * 60)) % 24);
    const days = Math.floor(timeDiffSeconds / (60 * 60 * 24));
  
    return [
      { value: days, label: 'days' },
      { value: hours, label: 'hours' },
      { value: minutes, label: 'mins' },
      { value: seconds, label: 'sec' },
    ];
  };
  
