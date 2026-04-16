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

  console.log(await getPellets(driver));

  await moveAtAngle(driver, Math.PI / 2);
  setInterval(async () => console.log((await getSnake(driver)).angle), 500);
} catch (e) {
  console.log(e);
} finally {
  // await driver.quit();
}

async function foodsExist(driver: WebDriver): Promise<boolean> {
  const isFoodsDefined = await driver.executeScript(
    "return typeof window.foods !== 'undefined'",
  );
  if (!isFoodsDefined) return false;
  return await driver.executeScript(
    'return Array.isArray(window.foods) && window.foods.length > 0',
  );
}

async function getPellets(driver: WebDriver): Promise<Pellet[]> {
  await driver.wait(foodsExist);
  return await driver.executeScript(
    'return window.foods.map(f => ({ id: f.id, x: f.xx, y: f.yy, size: f.sz }))',
  );
}

async function getSnake(driver: WebDriver): Promise<Snake> {
  await driver.wait(
    async () =>
      await driver.executeScript(
        "return typeof window.slither !== 'undefined'",
      ),
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
) {
  // get viewport center
  const center = {
    x: await driver.executeScript('return window.innerWidth') as number / 2,
    y: await driver.executeScript('return window.innerHeight') as number / 2
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
