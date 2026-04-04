"use client";

import { useState, useRef } from "react";
import { FiUploadCloud, FiX, FiImage, FiVideo } from "react-icons/fi";
import styles from "./clientPage.module.css";

export default function FileUploader({ currentFileUrl, onFileSelect }) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState(currentFileUrl || null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    processFile(file);
  };

  const processFile = (file) => {
    if (!file) return;
    
    onFileSelect(file); 

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setPreview("VIDEO_PLACEHOLDER");
    }
  };

  const clearFile = (e) => {
    e.stopPropagation();
    setPreview(null);
    onFileSelect(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div 
      className={`${styles.dropZone} ${isDragging ? styles.dropZoneActive : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className={styles.hiddenInput} 
        accept="video/mp4,video/quicktime,video/webm,image/jpeg,image/png,image/webp"
      />

      {preview ? (
        <div className={styles.previewContainer}>
          {preview === "VIDEO_PLACEHOLDER" || (preview && preview.match(/\.(mp4|mov|webm)(\?.*)?$/i)) ? (
            <div className={styles.videoPreview}>
              <FiVideo size={32} />
              <span>Video Selected</span>
            </div>
          ) : (
            <img src={preview} alt="Preview" className={styles.imagePreview} />
          )}
          <button type="button" onClick={clearFile} className={styles.clearFileBtn}>
            <FiX size={14} />
          </button>
        </div>
      ) : (
        <div className={styles.uploadPrompt}>
          <FiUploadCloud size={28} className={styles.uploadIcon} />
          <p><strong>Click to upload</strong> or drag and drop</p>
          <span>MP4, MOV, JPG, PNG (Max 500MB)</span>
        </div>
      )}
    </div>
  );
}