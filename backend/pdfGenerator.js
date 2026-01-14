import { chromium } from "playwright";

export async function generatePDF(url, outputPath) {
  // Validate URL
  try {
    new URL(url);
  } catch (error) {
    throw new Error("Invalid URL for PDF generation");
  }

  let browser;
  try {
    browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
    });

    const page = await context.newPage();

    console.log(`🧾 Generating PDF: ${url}`);

    await page.goto(url, {
      waitUntil: "networkidle", // Changed from domcontentloaded to networkidle for better loading
      timeout: 45000
    });

    // Wait for dynamic content to load
    await page.waitForTimeout(3000);

    // Check for videos or other problematic elements
    const videoDetected = await page.evaluate(() => {
      return (
        document.querySelector("video") !== null ||
        document.querySelector("iframe[src*='youtube']") !== null ||
        document.querySelector("iframe[src*='vimeo']") !== null ||
        document.querySelector("audio") !== null
      );
    });

    // Generate PDF with better settings for compliance
    await page.pdf({
      path: outputPath,
      format: "A4",
      printBackground: true,
      margin: {
        top: "20px",
        bottom: "20px",
        left: "20px",
        right: "20px"
      },
      preferCSSPageSize: false
    });

    console.log(`✅ PDF saved: ${outputPath}`);
    return videoDetected;

  } catch (error) {
    console.error(`❌ PDF failed for ${url}:`, error.message);
    throw error; // Re-throw the error to be handled upstream
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}