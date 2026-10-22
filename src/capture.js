import { chromium } from 'playwright';
import { OutputStore } from './output-store.js';

export async function launchBrowser(options = {}) {
  const launchOptions = {
    headless: options.headless !== undefined ? options.headless : true,
    ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {})
  };

  try {
    return await chromium.launch(launchOptions);
  } catch (err) {
    if (process.platform === 'linux') {
      try {
        return await chromium.launch({ ...launchOptions, executablePath: '/usr/bin/chromium' });
      } catch {}
    }
    return await chromium.launch({ channel: 'chrome', headless: launchOptions.headless });
  }
}

/**
 * Capture screenshots for a list of defined screens/journeys.
 * @param {Array<Object>} screens - Array of { id, title, url, viewport, waitSelector, action }
 * @param {Object} options - { outputDir, runId, metadata }
 */
export async function captureScreens(screens, options = {}) {
  const store = new OutputStore(options.outputDir);
  const { runId, runPath } = store.initRun(options.runId, options.metadata);

  const browser = await launchBrowser(options);

  try {
    for (const screen of screens) {
      const context = await browser.newContext({
        viewport: screen.viewport || { width: 1280, height: 800 },
        deviceScaleFactor: screen.deviceScaleFactor || 2
      });

      const page = await context.newPage();

      try {
        if (screen.url) {
          await page.goto(screen.url, { waitUntil: screen.waitUntil || 'networkidle', timeout: 30000 });
        }

        if (screen.action && typeof screen.action === 'function') {
          await screen.action(page);
        }

        if (screen.waitSelector) {
          await page.waitForSelector(screen.waitSelector, { timeout: 10000 });
        }

        if (screen.waitForTimeout) {
          await page.waitForTimeout(screen.waitForTimeout);
        }

        const filename = screen.filename || `${screen.id}.png`;
        const buffer = await page.screenshot({ fullPage: screen.fullPage !== false });

        store.saveScreenshot(runId, filename, buffer, {
          screenId: screen.id,
          title: screen.title,
          flow: screen.flow,
          viewport: screen.viewport
        });

        console.log(`[lookfeel] 📸 Captured: ${screen.title || screen.id} -> ${filename}`);
      } catch (err) {
        console.error(`[lookfeel] ❌ Failed to capture ${screen.id}:`, err.message);
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }

  return { runId, runPath };
}
