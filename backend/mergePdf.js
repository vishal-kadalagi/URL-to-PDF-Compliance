import fs from "fs";
import { PDFDocument } from "pdf-lib";
import path from "path";

export async function mergePDFs(pdfFiles, outputFilePath) {
  // Validate inputs
  if (!Array.isArray(pdfFiles) || pdfFiles.length === 0) {
    throw new Error("PDF files array is required and cannot be empty");
  }

  if (!outputFilePath) {
    throw new Error("Output file path is required");
  }

  // Check if all input files exist
  for (const file of pdfFiles) {
    if (!fs.existsSync(file)) {
      throw new Error(`Input PDF file does not exist: ${file}`);
    }
  }

  const mergedPdf = await PDFDocument.create();

  for (const file of pdfFiles) {
    try {
      const pdfBytes = fs.readFileSync(file);
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
  fs.writeFileSync(outputFilePath, mergedBytes);
  
  console.log(`✅ Merged PDF saved: ${outputFilePath}`);
}