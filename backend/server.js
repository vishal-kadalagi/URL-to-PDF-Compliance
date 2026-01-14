import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

import { crawlWebsite } from "./crawler.js";
import { generatePDF } from "./pdfGenerator.js";
import { mergePDFs } from "./mergePdf.js";

const app = express();
app.use(cors({
  origin: '*', // Allow all origins in development, restrict in production
  credentials: true
}));
app.use(express.json());

const OUTPUT_DIR = "./output";
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

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

app.post("/convert", async (req, res) => {
  const { url, maxPages } = req.body;
  
  if (!url) return res.status(400).json({ error: "URL required" });
  
  if (!isValidUrl(url)) return res.status(400).json({ error: "Invalid URL format" });

  try {
    // Create a unique directory for this conversion job
    const jobId = uuidv4();
    const jobDir = path.join(OUTPUT_DIR, jobId);
    if (!fs.existsSync(jobDir)) fs.mkdirSync(jobDir, { recursive: true });

    const pages = await crawlWebsite(url, maxPages || 10);

    const results = [];
    const pdfPaths = [];

    // Process pages sequentially to avoid overwhelming the server
    for (let i = 0; i < pages.length; i++) {
      const pageUrl = pages[i];
      const pdfName = sanitizeFilename(`page_${i + 1}.pdf`);
      const pdfPath = path.join(jobDir, pdfName);

      const videoDetected = await generatePDF(pageUrl, pdfPath);

      results.push({
        pageUrl,
        pdf: `${jobId}/${pdfName}`,
        videoDetected
      });

      pdfPaths.push(pdfPath);
    }

    const mergedPdfPath = path.join(jobDir, "merged.pdf");
    await mergePDFs(pdfPaths, mergedPdfPath);

    res.json({
      jobId,
      pages: results,
      mergedPdf: `${jobId}/merged.pdf`
    });

  } catch (error) {
    console.error('Conversion error:', error);
    res.status(500).json({ error: "Conversion failed" });
  }
});

app.use("/output", express.static(OUTPUT_DIR));

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () =>
  console.log(`✅ Backend running at http://${HOST}:${PORT}`)
);