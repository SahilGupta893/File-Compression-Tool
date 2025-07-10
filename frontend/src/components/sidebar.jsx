// src/components/Sidebar.jsx
import React from "react";
import { FaFileArchive, FaDownload } from "react-icons/fa";
import "./Sidebar.css";

export default function Sidebar({ files }) {
  return (
    <aside className="sidebar">
      <h2 className="sidebar-title">📁 Compressed Files</h2>
      <ul className="file-list">
        {files.map((file, idx) => (
          <li key={idx} className="file-item">
            <FaFileArchive className="icon" /> {file.name} ({file.size} KB)
            <a
              href={file.downloadUrl || "#"}
              className="download-link"
              download={file.name}
              title="Download Compressed File"
            >
              <FaDownload />
            </a>
          </li>
        ))}
        {files.length === 0 && <p className="empty">No files yet</p>}
      </ul>
    </aside>
  );
}