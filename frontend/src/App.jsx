import React, { useState, useEffect } from "react";
import Sidebar from "./components/sidebar";
import FileUpload from "./components/FileUpload";
import "./App.css";

export default function App() {
  const [compressedFiles, setCompressedFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState("checking");

  // Check server status on mount
  useEffect(() => {
    checkServerStatus();
  }, []);

  const checkServerStatus = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      const response = await fetch('http://localhost:5000/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        mode: 'cors'
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        setServerStatus("connected");
      } else {
        setServerStatus("error");
      }
    } catch (error) {
      console.error('Server status check failed:', error);
      setServerStatus("error");
    }
  };

  // Check server status periodically
  useEffect(() => {
    checkServerStatus();
    
    // Check every 5 seconds
    const interval = setInterval(checkServerStatus, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const handleFileCompressed = (fileInfo) => {
    setCompressedFiles((prev) => [fileInfo, ...prev]);
  };

  const handleClearFiles = () => {
    setCompressedFiles([]);
  };

  return (
    <div className="app-container">
      <Sidebar 
        files={compressedFiles} 
        onClearFiles={handleClearFiles}
        serverStatus={serverStatus}
      />
      <main className="main-content">
        <div className="header">
          <h1 className="title">
            <span className="title-icon">🗜️</span>
            FileCompressor
          </h1>
          <p className="subtitle">Advanced Huffman Compression Tool</p>
          
          <div className={`server-status ${serverStatus}`}>
            <span className="status-dot"></span>
            {serverStatus === "connected" && "Server Connected"}
            {serverStatus === "error" && "Server Disconnected"}
            {serverStatus === "checking" && "Checking Server..."}
          </div>
        </div>

        <div className="content-area">
          <FileUpload 
            onCompress={handleFileCompressed}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            serverStatus={serverStatus}
          />
          
          {compressedFiles.length > 0 && (
            <div className="stats-section">
              <h3>Compression Statistics</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <span className="stat-number">{compressedFiles.length}</span>
                  <span className="stat-label">Files Compressed</span>
                </div>
                <div className="stat-card">
                  <span className="stat-number">
                    {compressedFiles.reduce((total, file) => total + file.originalSize, 0).toLocaleString()} bytes
                  </span>
                  <span className="stat-label">Total Original Size</span>
                </div>
                <div className="stat-card">
                  <span className="stat-number">
                    {compressedFiles.reduce((total, file) => total + file.compressedSize, 0).toLocaleString()} bytes
                  </span>
                  <span className="stat-label">Total Compressed Size</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}