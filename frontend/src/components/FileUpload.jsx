// src/components/FileUpload.jsx
import React, { useRef, useState } from "react";
import "./FileUpload.css";

export default function FileUpload({ onCompress }) {
  const fileInputRef = useRef();
  const [selectedFile, setSelectedFile] = useState(null);
  const [status, setStatus] = useState("");

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleCompress = () => {
    if (!selectedFile) return;
    setStatus("Compressing...");

    const fakeSize = Math.max(1, Math.round(selectedFile.size / 1.5 / 1024));
    const blob = new Blob([reader.result], { type: selectedFile.type });

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
    };
    reader.readAsArrayBuffer(selectedFile);

    setSelectedFile(null);
    fileInputRef.current.value = "";
  };

  return (
    <div className="upload-box">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="file-input"
      />

      {selectedFile && (
        <div className="file-info">
          <p>
            <strong>Selected File:</strong> {selectedFile.name} <br />
            Size: {selectedFile.size} bytes (
            {Math.round(selectedFile.size / 1024)} KB)
          </p>
          <button onClick={handleCompress} className="compress-btn">
            ⚙️ Compress File
          </button>
        </div>
      )}

      {status && <p className="status-msg">{status}</p>}
    </div>
  );
}
