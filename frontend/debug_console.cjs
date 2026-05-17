const { chromium } = require('playwright-chromium');

(async () => {
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    page.on('console', msg => console.log('CONSOLE:', msg.type(), msg.text()));
    page.on('pageerror', err => console.log('PAGEERROR:', err.message, '\n', err.stack));
    page.on('requestfailed', req => console.log('REQFAILED:', req.url(), req.failure()?.errorText));
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    console.log('URL:', page.url());
    await browser.close();
  } catch (err) {
    console.error('ERROR:', err);
    process.exit(1);
  }
})();
