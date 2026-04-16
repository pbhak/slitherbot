import { By, Builder, Browser, WebDriver } from 'selenium-webdriver';
import type { Pellet, Snake } from './types';

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
  await driver.wait(foodsExist);

  const foods: Pellet[] = await getPellets(driver);
  const snake: Snake = await getSnake(driver);
  console.log(snake);
} catch (e) {
  console.log(e);
} finally {
  await driver.quit();
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
  return await driver.executeScript(
    'return window.foods.map(f => ({ id: f.id, x: f.xx, y: f.yy, size: f.sz }))',
  );
}

async function getSnake(driver: WebDriver): Promise<Snake> {
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
