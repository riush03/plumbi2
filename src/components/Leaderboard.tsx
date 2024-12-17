import { Devvit, useAsync, ZMember, useState  } from '@devvit/public-api';
import { formatTime } from '../utils/utils.js';
import  WelcomePage  from '../main.js';

const getLeaderboard = async (context: Devvit.Context) => {
    const leaderboardData: ZMember[] = await context.redis.zRange('leaderboard', 0, -1, { 
        by: 'rank',
        reverse: true 
    });
    const leaderboard = [];

    for (const entry of leaderboardData) {
        const username = entry.member;
        const score = entry.score;
        
        // Store points in Redis
        await context.redis.set(`user:${username}:points`, score.toString());
        
        const points = await context.redis.get(`user:${username}:points`) || '0';
        const time = await context.redis.get(`user:${username}:solvingTime`) || '0';
        leaderboard.push({ username, points: parseInt(points), time: parseInt(time) });
    }
    // Sort by points (descending) and then by time (ascending)
    return leaderboard.sort((a, b) => {
        if (b.points !== a.points) {
            return b.points - a.points;
        }
        return a.time - b.time;
    });
};


export const Leaderboard = (context: Devvit.Context): JSX.Element => {
    const [isOpen, setIsOpen] = useState(true);
    const { data: leaderboard, loading, error } = useAsync(async () => {
        return await getLeaderboard(context);
    }, { depends: { } });

    if (!isOpen) {
        return null;
    }

    if (loading) {
        return (
            <vstack height="100%" alignment="center middle">
                <hstack gap="small" alignment="center middle">
                    <image url="gameloading.gif" imageWidth={160} imageHeight={160} />
                    <text>Loading leaderboard...</text>
                </hstack>
            </vstack>
        );
    }

    if (error) {
        return <text color="red">Error loading leaderboard: {String(error)}</text>;
    }

    return (
        <vstack gap="medium" backgroundColor="AlienBlue-100" padding="large" cornerRadius="medium">
                 <hstack gap="medium" alignment="center middle">
                <text size="xlarge" weight="bold">Leaderboard</text>
                <button 
                    appearance="primary"
                    size="small"
                    onPress={() => setIsOpen(false)}
                >
                    Close
                </button>
            </hstack>
            <text size="xlarge" weight="bold">Leaderboard</text>
            <hstack gap="small" padding="small" backgroundColor="AlienBlue-200">
                <text weight="bold" width="10%">Rank</text>
                <text weight="bold" width="40%">Username</text>
                <text weight="bold" width="25%">Points</text>
                <text weight="bold" width="25%">Time</text>
            </hstack>
            {leaderboard && leaderboard.map((entry, index) => (
                <hstack key={entry.username} gap="small" padding="small" backgroundColor={index % 2 === 0 ? "AlienBlue-50" : "white"}>
                    <text width="10%">{index + 1}</text>
                    <text width="40%">{entry.username}</text>
                    <text width="25%">{entry.points}</text>
                    <text width="25%">{formatTime(entry.time)}</text>
                </hstack>
            ))}
        </vstack>
    );
};