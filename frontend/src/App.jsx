import React, { useState } from "react";
import Sidebar from "./components/sidebar";
import FileUpload from "./components/FileUpload";
import "./App.css";

export default function App() {
  const [compressedFiles, setCompressedFiles] = useState([]);

  const handleFileCompressed = (fileInfo) => {
    setCompressedFiles((prev) => [...prev, fileInfo]);
  };

  return (
    <div className="app-container">
      <Sidebar files={compressedFiles} />
      <main className="main-content">
        <h1 className="title">FileCompressor</h1>
        <FileUpload onCompress={handleFileCompressed} />
      </main>
    </div>
  );
}