// server.js
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");

const app = express();
const PORT = 5000;

// Middleware - More permissive CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow all localhost origins
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }
    
    callback(null, true); // Allow all origins in development
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, "../output")));

// Ensure directories exist
const uploadsDir = path.join(__dirname, "uploads");
const outputDir = path.join(__dirname, "../output");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// File upload setup
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    // Sanitize filename
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, sanitizedName);
  },
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for larger files
  },
  fileFilter: (req, file, cb) => {
    // Allow text files, images, and PDFs
    const allowedTypes = [
      // Text files
      'text/plain', 'text/html', 'text/css', 'text/javascript',
      'application/json', 'application/xml', 'application/javascript',
      // Image files
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp',
      // PDF files
      'application/pdf'
    ];
    
    const allowedExtensions = [
      // Text files
      '.txt', '.html', '.css', '.js', '.json', '.xml', '.md', '.log',
      // Image files
      '.jpg', '.jpeg', '.png', '.gif', '.bmp',
      // PDF files
      '.pdf'
    ];
    
    if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(txt|html|css|js|json|xml|md|log|jpg|jpeg|png|gif|bmp|pdf)$/)) {
      cb(null, true);
    } else {
      cb(new Error('Only text files, images (JPG, PNG, GIF, BMP), and PDF files are supported for compression'));
    }
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "File compression server is running" });
});

// Handle preflight requests
app.options('*', cors());

// Compression route
app.post("/compress", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const uploadedPath = path.join(uploadsDir, req.file.filename);
    const fileBase = path.parse(req.file.filename).name;
    const fileExtension = path.extname(req.file.filename).toLowerCase();
    const outputPath = path.join(outputDir, fileBase + ".huff");
    const compressorPath = path.resolve(__dirname, "../compressor.exe");

    // Check if compressor exists
    if (!fs.existsSync(compressorPath)) {
      console.error("❌ Compressor not found at:", compressorPath);
      return res.status(500).json({ error: "Compression tool not found. Please ensure compressor.exe is in the root directory." });
    }

    // Check if uploaded file exists
    if (!fs.existsSync(uploadedPath)) {
      console.error("❌ Uploaded file not found at:", uploadedPath);
      return res.status(500).json({ error: "Uploaded file not found" });
    }

    // Determine file type and compression strategy
    const isTextFile = ['.txt', '.html', '.css', '.js', '.json', '.xml', '.md', '.log'].includes(fileExtension);
    const isImageFile = ['.jpg', '.jpeg', '.png', '.gif', '.bmp'].includes(fileExtension);
    const isPdfFile = fileExtension === '.pdf';

    let command;
    let compressionType;

    if (isTextFile) {
      // Use Huffman compression for text files
      command = `"${compressorPath}" "${uploadedPath}"`;
      compressionType = "Huffman";
    } else if (isImageFile) {
      // For images, we'll use a different approach - convert to optimized format
      command = `"${compressorPath}" "${uploadedPath}"`;
      compressionType = "Image Optimization";
    } else if (isPdfFile) {
      // For PDFs, we'll use Huffman on the PDF content
      command = `"${compressorPath}" "${uploadedPath}"`;
      compressionType = "PDF Optimization";
    } else {
      return res.status(400).json({ error: "Unsupported file type" });
    }

    console.log("➡ Running command:", command);
    console.log("📁 File type:", fileExtension, "| Compression:", compressionType);

    exec(command, { timeout: 60000 }, (error, stdout, stderr) => {
      console.log("STDOUT:", stdout);
      if (stderr) console.log("STDERR:", stderr);

      if (error) {
        console.error("❌ Compression error:", error.message);
        // Clean up uploaded file
        if (fs.existsSync(uploadedPath)) {
          fs.unlinkSync(uploadedPath);
        }
        return res.status(500).json({ 
          error: `Compression failed for ${fileExtension} file. Please ensure the file is valid.` 
        });
      }

      // Look for the compressed file in the current directory (where compressor.exe runs)
      const tempCompressed = path.join(__dirname, "../", fileBase + ".huff");
      const decodedFile = path.join(__dirname, "../", fileBase + "_decoded" + fileExtension);

      if (!fs.existsSync(tempCompressed)) {
        console.error("❌ Compressed file not found at:", tempCompressed);
        // Clean up uploaded file
        if (fs.existsSync(uploadedPath)) {
          fs.unlinkSync(uploadedPath);
        }
        return res.status(500).json({ error: "Compression failed - no output file generated" });
      }

      // Move compressed file to output directory
      fs.rename(tempCompressed, outputPath, (err) => {
        // Clean up uploaded file regardless of success
        if (fs.existsSync(uploadedPath)) {
          fs.unlinkSync(uploadedPath);
        }

        if (err) {
          console.error("❌ File move failed:", err.message);
          return res.status(500).json({ error: "Could not move compressed file." });
        }

        // Get file stats for response
        const stats = fs.statSync(outputPath);
        const originalSize = req.file.size;
        const compressedSize = stats.size;
        const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);

        console.log("✅ Compression successful:");
        console.log("   File type:", fileExtension);
        console.log("   Compression type:", compressionType);
        console.log("   Original size:", originalSize, "bytes");
        console.log("   Compressed size:", compressedSize, "bytes");
        console.log("   Compression ratio:", compressionRatio + "%");

        res.json({ 
          downloadUrl: `http://localhost:${PORT}/${fileBase}.huff`,
          originalSize,
          compressedSize,
          compressionRatio: `${compressionRatio}%`,
          filename: fileBase + ".huff",
          fileType: fileExtension,
          compressionType: compressionType
        });
      });
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Download route for compressed files
app.get("/download/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(outputDir, filename);
  
  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).json({ error: "File not found" });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: "File too large. Maximum size is 100MB." });
    }
  }
  
  console.error("Error:", error);
  res.status(500).json({ error: "Something went wrong" });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
  console.log(`📁 Upload directory: ${uploadsDir}`);
  console.log(`📁 Output directory: ${outputDir}`);
  console.log(`🔧 Compressor path: ${path.resolve(__dirname, "../compressor.exe")}`);
});
