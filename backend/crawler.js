import { chromium } from "playwright";

export async function crawlWebsite(startUrl, maxPages = 10) {
  // Validate start URL
  try {
    new URL(startUrl);
  } catch (error) {
    throw new Error("Invalid start URL");
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
  });

  const page = await context.newPage();
  const visited = new Set();
  const queue = [startUrl];
  const origin = new URL(startUrl).origin;

  try {
    while (queue.length && visited.size < maxPages) {
      const currentUrl = queue.shift();
      if (visited.has(currentUrl)) continue;

      try {
        console.log(`🔍 Crawling: ${currentUrl}`);

        await page.goto(currentUrl, {
          waitUntil: "domcontentloaded",
          timeout: 30000
        });

        visited.add(currentUrl);

        // Get links with better error handling
        const links = await page.evaluate(() => {
          try {
            return Array.from(document.querySelectorAll("a[href]"))
              .map(a => {
                try {
                  // Resolve relative URLs
                  const url = new URL(a.href, window.location.href);
                  return url.toString();
                } catch (e) {
                  return null;
                }
              })
              .filter(href => href && href.startsWith(window.location.origin))
              .slice(0, 20); // Limit to 20 links per page to avoid overwhelming
          } catch (e) {
            console.warn("Error extracting links:", e.message);
            return [];
          }
        });

        for (const link of links) {
          if (link && !visited.has(link) && !queue.includes(link)) {
            queue.push(link);
          }
        }
      } catch (error) {
        console.warn(`⚠️ Skipped: ${currentUrl}`, error.message);
      }
    }
  } finally {
    await browser.close();
  }

  console.log(`✅ Crawling completed. Pages found: ${visited.size}`);
  return Array.from(visited);
}