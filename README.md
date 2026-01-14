# URL to PDF Compliance Tool

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-blue)](https://nextjs.org/)

**Transform any website into audit-ready PDFs in seconds** ✨

_A perfect tool for compliance teams, auditors, and quality assurance professionals_

</div>

---

## 🚀 What is This?

The URL to PDF Compliance Tool is a powerful full-stack application that crawls websites and converts them into organized PDF documents. Perfect for compliance audits, quality checks, and documentation purposes.

### ✨ Key Features
- 🕷️ **Smart Website Crawling** - Automatically discovers and processes all internal pages
- 📄 **High-Quality PDF Generation** - Converts web pages to professional PDFs
- 📊 **Media Detection** - Identifies videos and multimedia content for review
- 🔒 **Secure Processing** - Built-in protections against malicious URLs
- 🔄 **Batch Processing** - Handle multiple pages in a single request
- 📋 **Organized Output** - Individual PDFs plus a merged report

---

## 🛠️ Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Frontend** | Next.js 14 | User-friendly interface |
| **Backend** | Node.js + Express | API and processing engine |
| **Browser Automation** | Playwright | PDF generation from web content |
| **PDF Manipulation** | PDF-lib | Merging and organizing documents |
| **Styling** | CSS Modules | Beautiful responsive UI |

---

## 📋 Requirements

- **Node.js** v16 or higher
- **npm** or **yarn** package manager
- **Playwright** browsers (automatically installed)

---

## 🚀 Quick Start

### 1. Clone and Navigate
```bash
git clone <repository-url>
cd url-to-pdf-compliance
```

### 2. Install Dependencies
```bash
# Backend setup
cd backend
npm install

# Frontend setup
cd ../frontend
npm install
```

### 3. Start the Applications
```bash
# Terminal 1: Start backend
cd backend
npm start

# Terminal 2: Start frontend
cd frontend
npm run dev
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

---

## ⚙️ Configuration

### Environment Variables
Create `.env.local` in the frontend directory:
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
NEXT_PUBLIC_BACKEND_PORT=5000
```

### Custom Settings
- **Max Pages**: Control how many pages to process (default: 10)
- **Timeout**: Adjust page load timeouts as needed
- **Output Format**: PDFs saved in A4 format with proper margins

---

## 🌐 Vercel Deployment

> ⚠️ **Important Note for Vercel Deployment**

Due to the nature of Playwright (which requires browser binaries) and the heavy processing involved in PDF generation, this application has specific deployment requirements:

### Option 1: Separate Deployment (Recommended)
- Deploy the **frontend** to Vercel
- Deploy the **backend** to a platform that supports Playwright (like Railway, Render, DigitalOcean, etc.)

### Option 2: Vercel with Docker
- Use Vercel's container-based deployment with Playwright pre-installed
- Requires a custom Dockerfile with Playwright dependencies

### Deployment Steps for Option 1:

1. **Deploy Frontend to Vercel**
   - Connect your GitHub repository to Vercel
   - Add environment variables:
     ```
     NEXT_PUBLIC_BACKEND_URL=https://your-backend-domain.com
     ```

2. **Deploy Backend Separately**
   - Deploy the backend to a platform like Railway:
     ```bash
     # In the backend directory
     git init
     git add .
     git commit -m "Initial backend commit"
     # Push to your chosen platform
     ```

3. **Configure CORS**
   - Update your backend's CORS settings to allow your Vercel domain

### Why This Approach?
- Playwright requires significant resources and specific dependencies
- Serverless functions (like Vercel's) have limitations on binary installations
- Heavy PDF processing is better suited for dedicated servers

---

## 🖥️ Usage Guide

### Getting Started
1. Open the application at http://localhost:3000
2. Enter a website URL (must start with http:// or https://)
3. Set the maximum number of pages to process (optional)
4. Click "Convert" and wait for processing to complete

### Review Results
- 📄 **Individual Pages**: Browse each page as a separate PDF
- 🎬 **Media Flags**: Pages with videos/multimedia are flagged
- 📋 **Merged Report**: Download the complete combined PDF
- 📊 **Summary**: See statistics and processing details

---

## 🏗️ Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   User      │    │  Frontend   │    │   Backend   │
│  Browser    │◄──►│   (Next.js) │◄──►│  (Node.js)  │
│             │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
                                           │
                                    ┌─────────────┐
                                    │   Playwright│
                                    │   Browser   │
                                    │   Engine    │
                                    └─────────────┘
```

### Core Components
- **Crawler**: Discovers and queues website pages
- **PDF Generator**: Converts pages to PDF format
- **Merger**: Combines all PDFs into a single document
- **API Server**: Manages requests and responses
- **Frontend**: Provides user interface and controls

---

## 🔧 API Endpoints

### POST /convert
Converts a website to PDFs

**Request Body:**
```json
{
  "url": "https://example.com",
  "maxPages": 10
}
```

**Response:**
```json
{
  "jobId": "unique-job-id",
  "pages": [
    {
      "pageUrl": "https://example.com/page1",
      "pdf": "job-id/page_1.pdf",
      "videoDetected": false
    }
  ],
  "mergedPdf": "job-id/merged.pdf"
}
```

### Static Assets
- **GET /output/:filename** - Serve generated PDFs

---

## 🛡️ Security Features

- 🔍 **URL Validation**: Prevents SSRF attacks
- 🛡️ **Path Sanitization**: Prevents directory traversal
- 🚫 **Rate Limiting**: Prevents server overload
- 🔒 **Input Validation**: Sanitizes all user inputs

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Development Setup
```bash
# Fork the repository
git clone https://github.com/yourusername/url-to-pdf-compliance.git
cd url-to-pdf-compliance

# Install dependencies
cd backend && npm install && cd ../frontend && npm install

# Make your changes and test
```

### Pull Request Guidelines
1. Fork the repository
2. Create a feature branch
3. Add your changes with tests
4. Submit a pull request with clear description

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support

Need help? Feel free to reach out:

- 📧 **Issues**: Use the GitHub Issues tab
- 📝 **Documentation**: Check our wiki for detailed guides
- 💬 **Community**: Join our developer community

---

<div align="center">

Made with ❤️ for compliance professionals everywhere

⭐ **Star this repo if you found it helpful!**

</div>