"use client";
import styles from "./postImage.module.css";

export default function PostImage({ imageUrls, caption }) {
  return (
    <div>
      {imageUrls.map((url, index) => (
        <img
          key={index}
          src={url}
          alt={`image-${index}`}
          className={styles.postImage}
        />
      ))}
      {caption && <h2 className={styles.caption}>{caption}</h2>}
    </div>
  );
}
