import React, { useRef, useState } from 'react';
import { Upload, File, AlertCircle } from 'lucide-react';
import './FileUpload.css';

function FileUpload({ onFileUpload, isLoading }) {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [fileSize, setFileSize] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
  };

  const handleChange = (e) => {
    const files = e.target.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
  };

  const processFile = (file) => {
    // Validate file type
    if (!file.name.endsWith('.csv')) {
      alert('Please upload a CSV file');
      return;
    }

    setFileName(file.name);
    setFileSize((file.size / 1024).toFixed(2)); // Convert to KB
    onFileUpload(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="file-upload">
      <div
        className={`upload-zone ${dragActive ? 'active' : ''} ${isLoading ? 'disabled' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleChange}
          disabled={isLoading}
          className="file-input"
        />

        <div className="upload-content">
          <div className="upload-icon">
            <Upload size={48} />
          </div>

          <h3>Drag and drop your CSV file</h3>
          <p>or click to browse from your computer</p>

          <div className="file-info">
            <p className="file-type">CSV file format required</p>
            <p className="file-columns">Must include: Buy Date, P&L Amt (₹)</p>
          </div>

          {fileName && !isLoading && (
            <div className="selected-file">
              <File size={20} />
              <div>
                <p className="file-name">{fileName}</p>
                <p className="file-size">{fileSize} KB</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="upload-requirements">
        <AlertCircle size={20} />
        <div>
          <h4>Requirements</h4>
          <ul>
            <li>File format: CSV</li>
            <li>Must contain "Buy Date" column (DD MM YY format)</li>
            <li>Must contain "P&L Amt (₹)" column (numeric values)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default FileUpload;
