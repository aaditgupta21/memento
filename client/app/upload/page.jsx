"use client";
import React from "react";
import styles from "./Upload.module.css";
import { useState } from "react";
import { useUser } from "@/context/UserContext";

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

export default function Upload() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [uploads, setUploads] = useState([]);

  const { user } = useUser();

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
    const newPost = {
      id: String(Date.now()),
      image: preview, // data URL stored in memory only
      caption: caption.trim(),
      location: location.trim(),
      likes: [],
      createdAt: new Date().toISOString(),
      author: {
        id: user?.id,
        username: user?.displayName || "user",
        avatar:
          user?.avatar || user?.photoURL || "https://i.pravatar.cc/150?img=1",
      },
    };
    setUploads((prev) => [newPost, ...prev]);

    console.log(newPost);

    // TODO: send to backend

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
      <h1>Upload a Photo</h1>

      <div className={styles.uploadForm}>
        <input
          id="upload-file-input"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className={styles.fileInput}
        />

        {preview && (
          <div className={styles.previewWrap}>
            <img src={preview} alt="preview" />
          </div>
        )}

        <input
          type="text"
          placeholder="Caption (optional)"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className={styles.input}
        />

        <input
          type="text"
          placeholder="Location (optional)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className={styles.input}
        />

        <button
          onClick={handleSave}
          className={styles.saveBtn}
          disabled={!preview}
        >
          Save Photo
        </button>
      </div>

      <section className={styles.uploadsSection}>
        <h2 className={styles.uploadsTitle}>Recent Uploads</h2>
        {uploads.length === 0 ? (
          <p className={styles.emptyMessage}>
            No uploads yet. Upload your first photo!
          </p>
        ) : (
          uploads.map((upload) => (
            <div key={upload.id} className={styles.uploadItem}>
              <img
                src={upload.image}
                alt={upload.caption || "Uploaded photo"}
              />
              {upload.caption && <p>{upload.caption}</p>}
              {upload.location && <p> {upload.location}</p>}
              <p>{new Date(upload.createdAt).toLocaleString()}</p>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
