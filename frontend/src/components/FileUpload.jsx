// src/components/FileUpload.jsx
import React, { useRef, useState } from "react";
import { FaCloudUploadAlt, FaFileAlt } from "react-icons/fa";
import "./FileUpload.css";

export default function FileUpload({ onCompress }) {
  const fileInputRef = useRef();
  const [selectedFile, setSelectedFile] = useState(null);
  const [status, setStatus] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
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
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleCompress = () => {
    if (!selectedFile) return;
    setStatus("Compressing...");

    const fakeSize = Math.max(1, Math.round(selectedFile.size / 1.5 / 1024));

    const reader = new FileReader();
    reader.onload = () => {
      const blob = new Blob([reader.result], { type: selectedFile.type });
      const url = URL.createObjectURL(blob);

      onCompress({
        name: selectedFile.name + ".compressed",
        size: fakeSize,
        downloadUrl: url,
      });

      setStatus("Compression complete ✅");
      setTimeout(() => {
        setSelectedFile(null);
        setStatus("");
        fileInputRef.current.value = "";
      }, 2000);
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div 
      className={`upload-box ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="file-input"
      />
      
      {!selectedFile ? (
        <>
          <div className="upload-icon">
            <FaCloudUploadAlt />
          </div>
          <div className="upload-text">Drop your file here</div>
          <div className="upload-subtext">or click to browse</div>
          <button 
            className="browse-button" 
            onClick={() => fileInputRef.current?.click()}
          >
            Choose File
          </button>
        </>
      ) : (
        <div className="file-info">
          <div className="file-info-header">
            <FaFileAlt className="file-info-icon" />
            <div className="file-info-details">
              <h3>{selectedFile.name}</h3>
              <p>Size: {formatFileSize(selectedFile.size)}</p>
            </div>
          </div>
          <button onClick={handleCompress} className="compress-btn">
            ⚡ Compress File
          </button>
        </div>
      )}

      {status && <div className="status-msg">{status}</div>}
    </div>
  );
}
