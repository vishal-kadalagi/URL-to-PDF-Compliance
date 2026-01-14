import { chromium } from "playwright";

// Simple script to ensure Playwright browsers are installed
async function installBrowsers() {
  try {
    console.log("Checking Playwright browsers...");
    const browser = await chromium.launch();
    await browser.close();
    console.log("Playwright browsers are properly installed!");
  } catch (error) {
    console.error("Playwright browsers not installed. Run: npx playwright install");
    process.exit(1);
  }
}

installBrowsers();