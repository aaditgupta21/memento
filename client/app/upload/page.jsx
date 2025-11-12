"use client";
import React from "react";
import styles from "./Upload.module.css";
import { useState } from "react";

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

function handleSave() {
  if (!preview) return;
  const newItem = {
    id: String(Date.now()),
    image: preview, // data URL stored in memory only
    caption: caption.trim(),
    location: location.trim(),
    createdAt: new Date().toISOString(),
  };
  setUploads((prev) => [newItem, ...prev]);
  // reset form (transient only)
  setFile(null);
  setPreview(null);
  setCaption("");
  setLocation("");
  const input = document.getElementById("upload-file-input");
  if (input) input.value = "";
}

export default function Upload() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [uploads, setUploads] = useState([]);

  async function handleFileChange(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      alert("Please select an image file.");
      e.target.value = "";
      return;
    }
    const dataUrl = await readFileAsDataURL(f);
    setFile(f);
    setPreview(dataUrl);
  }

  function handleSave() {
    if (!preview) return;
    const newItem = {
      id: String(Date.now()),
      image: preview, // data URL stored in memory only
      caption: caption.trim(),
      location: location.trim(),
      createdAt: new Date().toISOString(),
    };
    setUploads((prev) => [newItem, ...prev]);
    // reset form
    setFile(null);
    setPreview(null);
    setCaption("");
    setLocation("");
    const input = document.getElementById("upload-file-input");
    if (input) input.value = "";
  }

  return (
    <main className={styles.page}>
      <h1>Upload Page</h1>
      <input
        id="upload-file-input"
        type="file"
        accept="image/*"
        onChange={handleFileChange}
      />
      {preview && (
        <div className={styles.previewWrap}>
          <img src={preview} alt="preview" />
        </div>
      )}
      <input
        type="text"
        placeholder="Caption"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
      />
      <input
        type="text"
        placeholder="Location"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
      />
      <button onClick={handleSave}>Save</button>

      {uploads.map((upload) => (
        <div key={upload.id} className={styles.uploadItem}>
          <img src={upload.image} alt={upload.caption} />
          <p>{upload.caption}</p>
          <p>{upload.location}</p>
          <p>{new Date(upload.createdAt).toLocaleString()}</p>
        </div>
      ))}
    </main>
  );
}
