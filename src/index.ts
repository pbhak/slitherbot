import { By, Builder, Browser, Origin } from 'selenium-webdriver';
import type { GameState, Pellet, Snake } from './types';

const ANGLE_OFFSET = 0.02454369260617028;
const MIN_DISTANCE = 40;
const TARGET_SCORE_SWITCH_MULTIPLIER = 1.25;
const CLUSTER_RADIUS = 180;
const LOOP_TIME_MS = 65;
const MIN_TURN_RATE = 0.35;
const MAX_TURN_RATE = 0.95;

const nickname = 'slither (bot)';
let currentTarget: Pellet;

const driver = await new Builder().forBrowser(Browser.CHROME).build();

try {
  await driver.get('https://slither.io');

  const nicknameTextbox = await driver.findElement(By.id('nick'));
  const playButton = await driver.findElement(By.id('playh'));

  await nicknameTextbox.sendKeys(nickname);
  await playButton.click();

  // wait for the snake to exist before starting the game loop
  await getSnake(true);

  setInterval(async () => {
    const currentState: GameState = {
      snake: await getSnake(false),
      pellets: await getPellets(false),
    };
    const targetPoint = getTargetPoint(currentState);
    if (!targetPoint) return;
    await moveToward(targetPoint, currentState);
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

function doesPelletExist(pellet: Pellet, state: GameState) {
  const pelletIds = state.pellets.map(pellet => pellet.id);
  return pelletIds.includes(pellet.id);
}

async function getSnake(wait: boolean = true): Promise<Snake> {
  if (wait) {
    await driver.wait(
      async () => await driver.executeScript('return !!window.slither'),
    );
  }

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

async function moveToward(
  target: Pellet,
  state: GameState,
  magnitude: number = 50,
): Promise<void> {
  // get viewport center
  const center = {
    x: ((await driver.executeScript('return window.innerWidth')) as number) / 2,
    y:
      ((await driver.executeScript('return window.innerHeight')) as number) / 2,
  };
  const targetAngle = Math.atan2(
    target.y - state.snake.y,
    target.x - state.snake.x,
  );
  const distance = distanceBetween(state.snake, target);
  const turnRate = Math.min(
    MAX_TURN_RATE,
    Math.max(MIN_TURN_RATE, 1 - distance / CLUSTER_RADIUS),
  );
  const aimAngle =
    state.snake.angle +
    turnRate * normalizeAngle(targetAngle - state.snake.angle);
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

function getBestPellet(state: GameState): Pellet | undefined {
  const scoredPellets = state.pellets
    .filter(pellet => distanceBetween(pellet, state.snake) > MIN_DISTANCE)
    .map(pellet => ({
      ...pellet,
      score: getPelletScore(pellet, state),
    }));
  if (scoredPellets.length === 0) return undefined;
  return scoredPellets.reduce((prev, curr) =>
    curr.score > prev.score ? curr : prev,
  );
}

function getTargetPoint(state: GameState): Pellet | undefined {
  const bestPellet: Pellet | undefined = getBestPellet(state);
  if (!bestPellet) return undefined;
  if (
    !currentTarget ||
    !doesPelletExist(currentTarget, state) ||
    getPelletScore(bestPellet, state) >
      getPelletScore(currentTarget, state) * TARGET_SCORE_SWITCH_MULTIPLIER
  )
    currentTarget = bestPellet;
  return currentTarget;
}

function normalizeAngle(angle: number): number {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

function getPelletScore(pellet: Pellet, state: GameState) {
  const distance = distanceBetween(state.snake, pellet);
  const angleToPellet = Math.atan2(
    pellet.y - state.snake.y,
    pellet.x - state.snake.x,
  );
  const angleDelta = Math.abs(normalizeAngle(angleToPellet - state.snake.angle));
  const headingMultiplier = Math.max(0.25, 1 - angleDelta / Math.PI);
  return (
    (pellet.size * headingMultiplier) /
    distance
  );
}

function distanceBetween(a: Snake | Pellet, b: Snake | Pellet) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}
