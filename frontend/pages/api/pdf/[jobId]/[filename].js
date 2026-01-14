import { tmpdir } from "os";
import { join } from "path";
import { promises as fs } from "fs";

export default async function handler(req, res) {
  const { jobId, filename } = req.query;

  // Construct the file path in the temporary directory
  const filePath = join(tmpdir(), 'pdf-converter', jobId, filename);

  try {
    // Check if file exists
    await fs.access(filePath);

    // Read the file
    const fileBuffer = await fs.readFile(filePath);

    // Set appropriate headers for PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Cache-Control', 'public, max-age=3600');

    // Send the file
    res.send(fileBuffer);
  } catch (error) {
    console.error('Error serving PDF:', error);
    res.status(404).json({ error: 'File not found' });
  }
}

export const config = {
  api: {
    responseLimit: '100mb',
  }
};