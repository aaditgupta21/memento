"use client";

import { UploadButton } from "@/utils/uploadthing";
import { useState } from "react";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import styles from "./Upload.module.css";

export default function Upload() {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const { user } = useUser();
  const router = useRouter();

  // Redirect if not authenticated
  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <main className={styles.page}>
      <h1>Upload a Photo</h1>

      <div className={styles.uploadForm}>
        <UploadButton
          endpoint="imageUploader"
          onClientUploadComplete={(res) => {
            // Do something with the response
            console.log("Upload complete! Files:", res);
            if (res && res.length > 0) {
              const urls = res.map((file) => file.url);
              console.log("Uploaded image URLs:", urls);
              setUploadedFiles(urls);
              alert("Upload Completed! Check console for URLs.");
            }
          }}
          onUploadError={(error) => {
            // Do something with the error.
            console.error("Upload error:", error);
            alert(`ERROR! ${error.message}`);
          }}
        />

        {uploadedFiles.length > 0 && (
          <div className={styles.previewWrap}>
            {uploadedFiles.map((url, idx) => (
              <div key={idx}>
                <img src={url} alt={`preview ${idx + 1}`} />
                <p>URL: {url}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
