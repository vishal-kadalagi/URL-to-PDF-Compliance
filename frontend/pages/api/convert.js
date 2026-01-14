import { chromium } from "playwright";
import fs from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";
import { PDFDocument } from "pdf-lib";

// Store active jobs (in a real app, use Redis or database)
const activeJobs = {};

// Validate URL format
function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (_) {
    return false;
  }
}

// Sanitize filename to prevent path traversal attacks
function sanitizeFilename(filename) {
  return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
}

// Crawl website function
async function crawlWebsite(startUrl, maxPages = 10) {
  // Validate start URL
  try {
    new URL(startUrl);
  } catch (error) {
    throw new Error("Invalid start URL");
  }

  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
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

// Generate PDF function
async function generatePDF(url, outputPath) {
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

// Merge PDFs function
async function mergePDFs(pdfFiles, outputFilePath) {
  // Validate inputs
  if (!Array.isArray(pdfFiles) || pdfFiles.length === 0) {
    throw new Error("PDF files array is required and cannot be empty");
  }

  if (!outputFilePath) {
    throw new Error("Output file path is required");
  }

  // Check if all input files exist
  for (const file of pdfFiles) {
    try {
      await fs.access(file);
    } catch {
      throw new Error(`Input PDF file does not exist: ${file}`);
    }
  }

  const mergedPdf = await PDFDocument.create();

  for (const file of pdfFiles) {
    try {
      const pdfBytes = await fs.readFile(file);
      const pdf = await PDFDocument.load(pdfBytes, {
        ignoreEncryption: true
      });

      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      pages.forEach(p => mergedPdf.addPage(p));
    } catch (error) {
      console.error(`Error processing PDF file ${file}:`, error.message);
      throw error;
    }
  }

  const mergedBytes = await mergedPdf.save();
  await fs.writeFile(outputFilePath, mergedBytes);
  
  console.log(`✅ Merged PDF saved: ${outputFilePath}`);
}

// NOTE: This is a placeholder API route for Vercel deployment
// The actual implementation would need to handle Playwright in serverless environments
// which requires special configuration for Vercel

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // In a real Vercel deployment, you would need to implement this differently
  // Playwright in serverless functions requires special handling
  // This is a simplified response for demonstration
  
  res.status(501).json({ 
    error: 'Not implemented for serverless deployment',
    message: 'This feature requires a dedicated backend server with Playwright support. For full functionality, deploy the backend separately.'
  });
}

export const config = {
  api: {
    responseLimit: '100mb',
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
};
