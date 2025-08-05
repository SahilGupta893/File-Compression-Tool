// src/components/Sidebar.jsx
import React from "react";
import { FiFile, FiDownload, FiTrash2, FiInfo } from "react-icons/fi";
import "./Sidebar.css";

export default function Sidebar({ files, onClearFiles, serverStatus }) {
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const handleDownload = (file) => {
    if (file.downloadUrl) {
      const link = document.createElement('a');
      link.href = file.downloadUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-title">
          <FiFile className="title-icon" />
          Compressed Files
        </h2>
        {files.length > 0 && (
          <button 
            className="clear-btn"
            onClick={onClearFiles}
            title="Clear all files"
          >
            <FiTrash2 />
          </button>
        )}
      </div>

      <div className="server-indicator">
        <div className={`status-indicator ${serverStatus}`}>
          <span className="status-dot"></span>
          {serverStatus === "connected" && "Server Online"}
          {serverStatus === "error" && "Server Offline"}
          {serverStatus === "checking" && "Checking..."}
        </div>
      </div>

      <div className="files-container">
        {files.length === 0 ? (
          <div className="empty-state">
            <FiInfo className="empty-icon" />
            <p>No compressed files yet</p>
            <span>Upload a file to get started</span>
          </div>
        ) : (
          <div className="file-list">
            {files.map((file, idx) => (
              <div key={idx} className="file-item">
                <div className="file-info">
                  <div className="file-header">
                    <FiFile className="file-icon" />
                    <span className="file-name">{file.name}</span>
                  </div>
                  
                  <div className="file-stats">
                    <div className="stat">
                      <span className="stat-label">Original:</span>
                      <span className="stat-value">{formatFileSize(file.originalSize)}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Compressed:</span>
                      <span className="stat-value">{formatFileSize(file.compressedSize)}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Saved:</span>
                      <span className="stat-value saved">{file.compressionRatio}</span>
                    </div>
                    {file.fileType && (
                      <div className="stat">
                        <span className="stat-label">Type:</span>
                        <span className="stat-value">{file.fileType.toUpperCase()}</span>
                      </div>
                    )}
                    {file.compressionType && (
                      <div className="stat">
                        <span className="stat-label">Method:</span>
                        <span className="stat-value">{file.compressionType}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="file-meta">
                    <span className="timestamp">{formatDate(file.timestamp)}</span>
                  </div>
                </div>
                
                <button
                  className="download-btn"
                  onClick={() => handleDownload(file)}
                  title="Download compressed file"
                >
                  <FiDownload />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {files.length > 0 && (
        <div className="summary">
          <div className="summary-item">
            <span className="summary-label">Total Files:</span>
            <span className="summary-value">{files.length}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Total Saved:</span>
            <span className="summary-value">
              {formatFileSize(
                files.reduce((total, file) => total + (file.originalSize - file.compressedSize), 0)
              )}
            </span>
          </div>
        </div>
      )}
    </aside>
  );
}