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

// WebSocket support for real-time progress updates
import http from 'http';
import { Server } from 'socket.io';

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store active jobs
const activeJobs = {};

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  socket.on('join_job', (jobId) => {
    socket.join(jobId);
    console.log(`Socket ${socket.id} joined job ${jobId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});

// Update the crawlWebsite function to accept a callback for progress updates
import { crawlWebsiteWithProgress } from './crawler.js';

// Modified POST route to emit progress updates
app.post("/convert", async (req, res) => {
  const { url, maxPages } = req.body;
  
  if (!url) return res.status(400).json({ error: "URL required" });
  
  if (!isValidUrl(url)) return res.status(400).json({ error: "Invalid URL format" });

  try {
    // Create a unique directory for this conversion job
    const jobId = uuidv4();
    const jobDir = path.join(OUTPUT_DIR, jobId);
    if (!fs.existsSync(jobDir)) fs.mkdirSync(jobDir, { recursive: true });

    // Initialize job status
    activeJobs[jobId] = {
      status: 'started',
      total: 0,
      processed: 0,
      currentUrl: '',
      pages: []
    };

    // Emit initial status
    io.to(jobId).emit('status_update', { status: 'started', message: 'Starting crawl...' });

    // Crawl with progress updates
    const pages = await crawlWebsiteWithProgress(url, maxPages || 10, (progressData) => {
      // Update job status
      activeJobs[jobId].total = progressData.total;
      activeJobs[jobId].processed = progressData.processed;
      activeJobs[jobId].currentUrl = progressData.currentUrl;
      
      // Emit progress update
      io.to(jobId).emit('progress_update', progressData);
    });

    activeJobs[jobId].status = 'processing_pages';
    io.to(jobId).emit('status_update', { status: 'processing_pages', message: `Found ${pages.length} pages, starting PDF generation...` });

    const results = [];
    const pdfPaths = [];

    // Process pages sequentially to avoid overwhelming the server
    for (let i = 0; i < pages.length; i++) {
      const pageUrl = pages[i];
      const pdfName = sanitizeFilename(`page_${i + 1}.pdf`);
      const pdfPath = path.join(jobDir, pdfName);

      activeJobs[jobId].currentUrl = pageUrl;
      io.to(jobId).emit('page_processing', { 
        current: i + 1, 
        total: pages.length, 
        url: pageUrl,
        message: `Generating PDF for page ${i + 1} of ${pages.length}`
      });

      const videoDetected = await generatePDF(pageUrl, pdfPath);

      results.push({
        pageUrl,
        pdf: `${jobId}/${pdfName}`,
        videoDetected
      });

      pdfPaths.push(pdfPath);
    }

    activeJobs[jobId].status = 'merging';
    io.to(jobId).emit('status_update', { status: 'merging', message: 'Merging PDFs...' });

    const mergedPdfPath = path.join(jobDir, "merged.pdf");
    await mergePDFs(pdfPaths, mergedPdfPath);

    activeJobs[jobId].status = 'completed';
    io.to(jobId).emit('status_update', { status: 'completed', message: 'Processing completed!' });

    res.json({
      jobId,
      pages: results,
      mergedPdf: `${jobId}/merged.pdf`
    });

  } catch (error) {
    console.error('Conversion error:', error);
    const jobId = req.body.jobId || uuidv4();
    io.to(jobId).emit('status_update', { status: 'error', message: error.message });
    res.status(500).json({ error: "Conversion failed" });
  }
});

// Endpoint to get job status
app.get('/status/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = activeJobs[jobId];
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  res.json(job);
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () =>
  console.log(`✅ Backend running at http://${HOST}:${PORT}`)
);