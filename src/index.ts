import { By, Builder, Browser, WebDriver, Origin } from 'selenium-webdriver';
import type { GameState, Pellet, Snake } from './types';

const ANGLE_OFFSET = 0.02454369260617028;
const MIN_DISTANCE = 60;
const LOOP_TIME_MS = 65;

const nickname = 'slither (bot)';

const driver = await new Builder().forBrowser(Browser.CHROME).build();

try {
  await driver.get('https://slither.io');

  const nicknameTextbox = await driver.findElement(By.id('nick'));
  const playButton = await driver.findElement(By.id('playh'));
  const qualityToggle = await driver.findElement(By.id('grq'));

  await nicknameTextbox.sendKeys(nickname);
  await qualityToggle.click();
  await playButton.click();

  // wait for the snake to exist before starting the game loop
  await getSnake(true);

  setInterval(async () => {
    const currentState: GameState = {
      snake: await getSnake(false),
      pellets: await getPellets(false),
    };
    const angleToClosest = getAngleToClosestPellet(currentState);
    if (!angleToClosest) return;
    await moveAtAngle(angleToClosest, currentState);
  }, LOOP_TIME_MS);
} catch (e) {
  console.log(e);
} finally {
  // await driver.quit();
}

async function foodsExist(): Promise<boolean> {
  const isFoodsDefined = await driver.executeScript('return !!window.foods');
  if (!isFoodsDefined) return false;
  return await driver.executeScript(
    'return Array.isArray(window.foods) && window.foods.length > 0',
  );
}

async function getPellets(wait: boolean = true): Promise<Pellet[]> {
  if (wait) {
    await driver.wait(foodsExist);
  }
  return await driver.executeScript(
    'return window.foods.filter(Boolean).map(f => ({ id: f.id, x: f.xx, y: f.yy, size: f.sz }))',
  );
}

async function getSnake(wait: boolean = true): Promise<Snake> {
  if (wait) {
    await driver.wait(
      async () => await driver.executeScript('return !!window.slither'),
    );
  }

  // :heavysob:
  const { id, ang, kill_count, nk, sp, tl, xx, yy } =
    await driver.executeScript<{
      id: number;
      ang: number;
      kill_count: number;
      nk: string;
      sp: number;
      tl: number;
      xx: number;
      yy: number;
    }>('return window.slither');
  return {
    id,
    angle: ang,
    killCount: kill_count,
    nick: nk,
    speed: sp,
    length: tl,
    x: xx,
    y: yy,
  };
}

async function moveAtAngle(
  targetAngle: number,
  state: GameState,
  magnitude: number = 50,
): Promise<void> {
  // get viewport center
  const center = {
    x: ((await driver.executeScript('return window.innerWidth')) as number) / 2,
    y:
      ((await driver.executeScript('return window.innerHeight')) as number) / 2,
  };
  const aimAngle = state.snake.angle + 0.4 * normalizeAngle(targetAngle - state.snake.angle);
  // oo look trig!
  await driver
    .actions({ async: true })
    .move({
      x: center.x + Math.cos(aimAngle + ANGLE_OFFSET) * magnitude,
      y: center.y + Math.sin(aimAngle + ANGLE_OFFSET) * magnitude,
      origin: Origin.VIEWPORT,
    })
    .perform();
}

function getClosestPellet(state: GameState): Pellet | undefined {
  const distanceMap: (Pellet & { distance: number })[] = state.pellets
    .map((pellet: Pellet) => ({
      ...pellet,
      distance: Math.sqrt(
        (pellet.x - state.snake.x) ** 2 + (pellet.y - state.snake.y) ** 2,
      ),
    }))
    .filter(pellet => pellet.distance > MIN_DISTANCE);
  return distanceMap.reduce((prev, curr) =>
    curr.distance < prev.distance ? curr : prev,
  );
}

function getAngleToClosestPellet(state: GameState): number | undefined {
  const closestPellet: Pellet | undefined = getClosestPellet(state);
  if (!closestPellet) return undefined;
  const angle = Math.atan2(
    closestPellet.y - state.snake.y,
    closestPellet.x - state.snake.x,
  );
  if (angle < 0) return angle + 2 * Math.PI;
  return angle;
}

function normalizeAngle(angle: number): number {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}