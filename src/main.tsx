import { Devvit, useState,useAsync,useInterval } from '@devvit/public-api';
import { levels } from './constants/levels.js';
import { EmptyPipe,FilledPipe,EmptyToFilledPipe,DirectionPipe } from './constants/pipes.js';
import { Level } from './constants/levels.js';
import { rotatePipe } from './utils/rotatePipe.js';
import { Leaderboard } from './components/Leaderboard.js';
import { Icons } from './constants/icon.js';

Devvit.configure({
  redditAPI: true,
  redis: true,
});

// Add a menu item to the subreddit menu for instantiating the new experience post
Devvit.addMenuItem({
  label: 'Add my post',
  location: 'subreddit',
  forUserType: 'moderator',
  onPress: async (_event, context) => {
    const { reddit, ui } = context;
    const subreddit = await reddit.getCurrentSubreddit();
    await reddit.submitPost({
      title: 'My devvit post',
      subredditName: subreddit.name,
      // The preview appears while the post loads
      preview: (
        <vstack height="100%" width="100%" alignment="middle center">
          <text size="large">Loading ...</text>
        </vstack>
      ),
    });
    ui.showToast({ text: 'Created post!' });
  },
});


Devvit.addCustomPostType({
  name: 'Water Pipe Game',
  render: (context) => {
    const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [timeLeft, setTimeLeft] = useState(60); // 60 seconds timer
    const [showRetry, setShowRetry] = useState(false);
    const [showGame, setShowGame] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);
    const [gameBoard, setGameBoard] = useState<EmptyPipe[][]>(() => {
      return initializeGameBoard(currentLevelIndex);
    });
    const [pipeAngles, setPipeAngles] = useState<number[][]>(() => {
      return gameBoard.map(row => row.map(() => 0));
    });
    const [filledPipes, setFilledPipes] = useState<boolean[][]>(() => {
      return gameBoard.map(row => row.map(() => false));
    });
    const [showCongrats, setShowCongrats] = useState(false);

    const currentLevel: Level = levels[currentLevelIndex];

    function initializeGameBoard(levelIndex: number): EmptyPipe[][] {
      const level = levels[levelIndex];
      if (!level || !level.map) {
        console.error(`Level ${levelIndex} is not properly defined`);
        return [[]];
      }
      return disconnectAndRotatePipes(level.map);
    }

    function initializePipeAngles(board: EmptyPipe[][]): number[][] {
      return board.map(row => row.map(() => 180));
    }

    async function awardPoints(context: Devvit.Context, username: string, levelIndex: number) {
      const pointsForLevel = (levelIndex + 1) * 10; // Award more points for higher levels
      await context.redis.zIncrBy('leaderboard', username, pointsForLevel);
      return pointsForLevel;
    }


    const { data: username, loading: usernameLoading } = useAsync(
      async () => {
        if (!context.userId) return null;
        const cacheKey = 'cache:userId-username';
        const cache = await context.redis.hGet(cacheKey, context.userId);
        if (cache) {
          return cache;
        } else {
          const user = await context.reddit.getUserById(context.userId);
          if (user) {
            await context.redis.hSet(cacheKey, {
              [context.userId]: user.username,
            });
            return user.username;
          }
        }
        return null;
      },
      {
        depends: [],
      }
    );

    const INITIAL_TIME = 60; // Set this to your desired initial time in seconds

const { data: currentTime } = useAsync(async () => {
  return timeLeft;
}, { depends: [timeLeft] });

useAsync(async () => {
  if (currentTime !== null) {
    if (currentTime > 0 && !showCongrats && !showRetry) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setTimeLeft(prevTime => prevTime - 1);
      
      const elapsedTime = INITIAL_TIME - currentTime + 1;
      await context.redis.set(`user:${context.userId}:solvingTime`, elapsedTime.toString());
    } else if (currentTime === 0 && !showCongrats) {
      setShowRetry(true);
      
      await context.redis.set(`user:${context.userId}:solvingTime`, INITIAL_TIME.toString());
    }
  }
  return null;
}, { depends: [currentTime, showCongrats, showRetry] });

const timerInterval = useInterval(() => {
  if (timeLeft > 0 && !showCongrats && !showRetry) {
    setTimeLeft(prevTime => prevTime - 1);
    
    // Store the elapsed time in Redis
    const elapsedTime = INITIAL_TIME - timeLeft + 1;
    context.redis.set(`user:${context.userId}:solvingTime`, elapsedTime.toString());
  } else if (timeLeft === 0 && !showCongrats) {
    setShowRetry(true);
    
    // Store the final time when the timer runs out
    context.redis.set(`user:${context.userId}:solvingTime`, INITIAL_TIME.toString());
  }
}, 1000);
    

    timerInterval.start();

    const retryLevel = () => {
      setGameBoard(initializeGameBoard(currentLevelIndex));
      setPipeAngles(initializePipeAngles(initializeGameBoard(currentLevelIndex)));
      setTimeLeft(60);
      setShowRetry(false);
      timerInterval.start(); // Restart the timer
    };

    function disconnectAndRotatePipes(levelMap: string[]): EmptyPipe[][] {
      return levelMap.map(row => 
        row.split('').map(char => {
          if (char in DirectionPipe) return char as EmptyPipe;
          return rotatePipe(char as EmptyPipe);
        })
      );
    }


    function handlePipeRotation(x: number, y: number) {
      setGameBoard(prevBoard => {
        const newBoard = prevBoard.map(row => [...row]);
        newBoard[y][x] = rotatePipe(newBoard[y][x]);
        return newBoard;
      });
      setPipeAngles(prevAngles => {
        const newAngles = prevAngles.map(row => [...row]);
        newAngles[y][x] = (newAngles[y][x] + 90) % 360;
        return newAngles;
      });
      
      if (checkSolution()) {
        setShowCongrats(true);
      }
    }

    function checkSolution(): boolean {
      const currentLevel = levels[currentLevelIndex];
      if (!currentLevel || !currentLevel.map) return false;
      return gameBoard.every((row, y) => 
        row.every((pipe, x) => pipe === currentLevel.map[y][x])
      );
    }

    const checkDirection = (map: string[], x: number, y: number): string | null => {
      if (y < 0 || y >= map.length || x < 0 || x >= map[y].length) return null;
      const char = map[y][x];
      if (char in DirectionPipe) return char;
      return null;
    };

    async function nextLevel(context: Devvit.Context, username: string) {

      if (currentLevelIndex < levels.length - 1) {
        const pointsEarned = await awardPoints(context, username, currentLevelIndex);
        setCurrentLevelIndex(prevIndex => prevIndex + 1);
        setGameBoard(initializeGameBoard(currentLevelIndex + 1));
        setPipeAngles(initializePipeAngles(initializeGameBoard(currentLevelIndex + 1)));
        setShowCongrats(false);
        context.ui.showToast(`Congratulations! You earned ${pointsEarned} points!`);
      } else {
        const pointsEarned = await awardPoints(context, username, currentLevelIndex);
        context.ui.showToast(`Congratulations! You completed all levels and earned a total of ${pointsEarned} points!`);
      }
    };

    const handleDoneClick = () => {
      if (checkSolution()) {
        setShowCongrats(true);
        timerInterval.stop(); // Stop the timer when the level is completed
      } else {
        context.ui.showToast('The pipes are not correctly connected. Try again!');
      }
    };

    function renderPipe(pipe: EmptyPipe, angle: number, x: number, y: number) {
      const isConnected = pipe === levels[currentLevelIndex].map[y][x];
      const imageUrl = context.assets.getURL(`pipes/${pipe}.png`);
      return (
        <zstack>
            <image
              url={imageUrl}
              imageWidth={60 * currentLevel.scale}
              imageHeight={60 * currentLevel.scale}
              onPress={() => handlePipeRotation(x, y)}
            />
           {isConnected && (
           <vstack
            backgroundColor="rgba(0, 0, 255, 0.5)"
            width={60 * currentLevel.scale}
            height={60 * currentLevel.scale}
          />
      )}
        </zstack>
      );
    }

    const Instructions = () => (
        <vstack gap="medium" alignment="center middle" backgroundColor="AlienBlue-100" padding="large" cornerRadius="medium">
          <text size="large" weight="bold">How to Play</text>
          <text alignment="center">1. Tap on pipe fittings to rotate them.</text>
          <text alignment="center">2. Create a continuous path from start to finish.</text>
          <text alignment="center">3. Click 'Done' when you think you've solved the level.</text>
          <text alignment="center">4. If correct, you'll move to the next level!</text>
          <button
            appearance="secondary"
            onPress={() => setShowInstructions(false)}
          >
            Close Instructions
          </button>
        </vstack>
      );
  
      const WelcomePage = () => (
        <vstack gap="small" alignment="center middle" height="100%" padding="medium">
          <image url="plumbilogo.png" imageWidth={150} imageHeight={150} />
          <text size="small" alignment="center" width="80%">
            Connect pipes to solve levels. Tap to rotate pipes and create a path from start to finish!
          </text>
          <vstack gap="small">
            <button
              appearance="primary"
              size="medium"
              icon="play"
              onPress={() => setShowGame(true)}
            >
              Play Game
            </button>
            <button
              appearance="secondary"
              size="medium"
              icon="info"
              onPress={() => setShowInstructions(true)}
            >
              Instructions
            </button>
            <button
              appearance="secondary"
              size="medium"
              onPress={() => {
                setShowLeaderboard(!showLeaderboard);
              }}
            >
              {showLeaderboard ? "Hide Leaderboard" : "Show Leaderboard"}
            </button>
          </vstack>
        </vstack>
      );
  
      const GamePage = () => (
        <vstack gap="medium" alignment="center middle">
          <vstack 
            backgroundColor="AlienBlue-200" 
            width="100%"
            maxWidth="600px"
            cornerRadius="medium"
          >
            <hstack
              gap="medium"  
              alignment="center middle" 
              backgroundColor="AlienBlue-300" 
              padding="medium" 
              cornerRadius="medium"
              width="100%"
            >
              <spacer grow />
              <button 
                onPress={handleDoneClick}
                textColor="white"
              >
                Done
              </button>
              <spacer grow />
              <text size="xlarge" weight="bold" color="white">Level {currentLevelIndex + 1}</text>
              <spacer grow />
              <vstack 
                backgroundColor="rgba(255, 255, 255, 0.2)" 
                padding="small" 
                cornerRadius="small"
              >
                <text color="white">Time: {timeLeft}s</text>
              </vstack>
            </hstack>
            {showRetry ? (
              <vstack 
                gap="medium" 
                alignment="center middle" 
                backgroundColor="lightyellow" 
                padding="large" 
                width="100%"
              >
                <text size="large" weight="bold" color="orange">Time's Up!</text>
                <text>Would you like to try again?</text>
                <button 
                  onPress={retryLevel}
                  textColor="white"
                >
                  Retry Level
                </button>
              </vstack>
            ) : showCongrats ? (
              <vstack 
                gap="medium"
                alignment="center middle" 
                backgroundColor="lightgreen" 
                padding="large" 
                cornerRadius="medium"
                width="100%"
              >
                <text size="xlarge" weight="bold">Congratulations!</text>
                <hstack gap="small" alignment="center middle">
                  <icon name="user" color="darkgreen" />
                  <text color="green">{username || 'Guest'}</text>
                </hstack>
                <text>You've completed the level!</text>
                <text size="large" color="green">Points earned: {(currentLevelIndex + 1) * 10}</text>
                <button onPress={() => nextLevel(context, username || 'Guest')}>Continue</button>
              </vstack>
            ) : (
              <vstack alignment="center middle" height="100%" width="100%">
                <vstack alignment="center middle" backgroundColor="AlienBlue-200" padding="large"
                  width="100%"
                  maxWidth="600px" >
                  {gameBoard.map((row, y) => (
                    <hstack key={y.toString()}>
                      {row.map((pipe, x) => (
                        <zstack key={x.toString()}>
                          {renderPipe(pipe, pipeAngles[y][x], x, y)}
                        </zstack>
                      ))}
                    </hstack>
                  ))}
                </vstack>
              </vstack>
            )}
          </vstack>
        </vstack>
      );
  
      return (
        <vstack height="100%" backgroundColor="LightBlue-100">
          {showInstructions ? (
            <Instructions />
          ) : showGame ? (
            <GamePage />
          ) : showLeaderboard ? (
            <Leaderboard {...context}  />
          ) : (
            <WelcomePage />
          )}
          <hstack padding="small">
            <button
              onPress={() => {
                setShowInstructions(false);
                setShowGame(false);
                setShowLeaderboard(!showLeaderboard);
              }}
            >
              {showLeaderboard ? "Hide Leaderboard" : "Show Leaderboard"}
            </button>
          </hstack>
        </vstack>
      );
    },
  });
  
  export default Devvit;