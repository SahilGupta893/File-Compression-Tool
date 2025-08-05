// src/components/FileUpload.jsx
import React, { useRef, useState, useCallback } from "react";
import { FiUpload, FiFile, FiCheckCircle, FiAlertCircle, FiX } from "react-icons/fi";
import "./FileUpload.css";

export default function FileUpload({ onCompress, isLoading, setIsLoading, serverStatus }) {
  const fileInputRef = useRef();
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  const handleFileSelect = useCallback((file) => {
    if (!file) return;

    // Validate file type
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
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      setStatus({
        type: "error",
        message: "Only text files, images (JPG, PNG, GIF, BMP), and PDF files are supported for compression"
      });
      return;
    }

    // Validate file size (100MB limit for larger files)
    if (file.size > 100 * 1024 * 1024) {
      setStatus({
        type: "error",
        message: "File size must be less than 100MB"
      });
      return;
    }

    setSelectedFile(file);
    setStatus({ type: "success", message: `File selected: ${file.name}` });
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleCompress = async () => {
    if (!selectedFile || serverStatus !== "connected") return;

    setIsLoading(true);
    setStatus({ type: "info", message: "Compressing file..." });

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      console.log('Attempting to compress file:', selectedFile.name);
      console.log('Server status:', serverStatus);

      const response = await fetch('http://localhost:5000/compress', {
        method: 'POST',
        body: formData,
        headers: {
          // Don't set Content-Type header for FormData, let browser set it
        },
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Compression successful:', data);

      onCompress({
        name: data.filename,
        originalSize: data.originalSize,
        compressedSize: data.compressedSize,
        compressionRatio: data.compressionRatio,
        downloadUrl: data.downloadUrl,
        timestamp: new Date().toISOString(),
      });

      setStatus({
        type: "success",
        message: `Compression complete! Saved ${data.compressionRatio} space`
      });

      // Clear selected file after successful compression
      setTimeout(() => {
        setSelectedFile(null);
        setStatus({ type: "", message: "" });
      }, 3000);

    } catch (error) {
      console.error('Compression error:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      let errorMessage = "Compression failed. Please try again.";
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = "Network error: Unable to connect to server. Please ensure the backend server is running on http://localhost:5000";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setStatus({
        type: "error",
        message: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setStatus({ type: "", message: "" });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="upload-container">
      <div className="upload-section">
        <div
          className={`upload-area ${isDragOver ? 'drag-over' : ''} ${selectedFile ? 'has-file' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="file-input"
            accept=".txt,.html,.css,.js,.json,.xml,.md,.log,.jpg,.jpeg,.png,.gif,.bmp,.pdf"
          />
          
          <div className="upload-content">
            {selectedFile ? (
              <div className="file-preview">
                <FiFile className="file-icon" />
                <div className="file-details">
                  <h3>{selectedFile.name}</h3>
                  <p>{formatFileSize(selectedFile.size)}</p>
                </div>
                <button 
                  className="clear-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFile();
                  }}
                >
                  <FiX />
                </button>
              </div>
            ) : (
              <>
                <FiUpload className="upload-icon" />
                <h3>Drop your file here</h3>
                <p>or click to browse</p>
                <div className="supported-formats">
                  <span>Supported: .txt, .html, .css, .js, .json, .xml, .md, .log, .jpg, .jpeg, .png, .gif, .bmp, .pdf</span>
                </div>
              </>
            )}
          </div>
        </div>

        {selectedFile && serverStatus === "connected" && (
          <button 
            onClick={handleCompress} 
            className={`compress-btn ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="spinner"></div>
                Compressing...
              </>
            ) : (
              <>
                <FiCheckCircle />
                Compress File
              </>
            )}
          </button>
        )}

        {serverStatus !== "connected" && (
          <div className="server-warning">
            <FiAlertCircle />
            <span>Server not connected. Please start the backend server.</span>
          </div>
        )}
      </div>

      {status.message && (
        <div className={`status-message ${status.type}`}>
          {status.type === "error" && <FiAlertCircle />}
          {status.type === "success" && <FiCheckCircle />}
          <span>{status.message}</span>
        </div>
      )}
    </div>
  );
}
