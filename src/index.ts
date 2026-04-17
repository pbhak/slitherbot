import { By, Builder, Browser, WebDriver, Origin } from 'selenium-webdriver';
import type { Pellet, Snake } from './types';

const ANGLE_OFFSET = 0.02454369260617028;
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

  while (true) {
    await moveAtAngle(driver, await getAngleToClosestPellet(driver));
  }
} catch (e) {
  console.log(e);
} finally {
  // await driver.quit();
}

async function foodsExist(driver: WebDriver): Promise<boolean> {
  const isFoodsDefined = await driver.executeScript('return !!window.foods');
  if (!isFoodsDefined) return false;
  return await driver.executeScript(
    'return Array.isArray(window.foods) && window.foods.length > 0',
  );
}

async function getPellets(driver: WebDriver): Promise<Pellet[]> {
  await driver.wait(foodsExist);
  return await driver.executeScript(
    'return window.foods.filter(Boolean).map(f => ({ id: f.id, x: f.xx, y: f.yy, size: f.sz }))',
  );
}

async function getClosestPellet(
  driver: WebDriver,
): Promise<Pellet | undefined> {
  const snake: Snake = await getSnake(driver);
  const pellets: Pellet[] = await getPellets(driver);
  const distanceMap: number[] = pellets.map((pellet: Pellet) =>
    Math.sqrt((pellet.x - snake.x) ** 2 + (pellet.y - snake.y) ** 2),
  );
  return pellets[distanceMap.indexOf(Math.min(...distanceMap))];
}

async function getAngleToClosestPellet(driver: WebDriver): Promise<number> {
  const snake: Snake = await getSnake(driver);
  const closestPellet: Pellet | undefined = await getClosestPellet(driver);
  if (!closestPellet) return -1;
  const angle = Math.atan2(
    closestPellet.y - snake.y,
    closestPellet.x - snake.x,
  );
  if (angle < 0) return angle + 2 * Math.PI;
  return angle;
}

async function getSnake(driver: WebDriver): Promise<Snake> {
  await driver.wait(
    async () => await driver.executeScript('return !!window.slither'),
  );

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
  driver: WebDriver,
  angleRads: number,
  magnitude: number = 50,
): Promise<void> {
  // get viewport center
  const center = {
    x: ((await driver.executeScript('return window.innerWidth')) as number) / 2,
    y:
      ((await driver.executeScript('return window.innerHeight')) as number) / 2,
  };
  // oo look trig!
  await driver
    .actions({ async: true })
    .move({
      x: center.x + Math.cos(angleRads + ANGLE_OFFSET) * magnitude,
      y: center.y + Math.sin(angleRads + ANGLE_OFFSET) * magnitude,
      origin: Origin.VIEWPORT,
    })
    .perform();
}
