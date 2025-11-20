"use client";
import styles from "./GallerySection.module.css";

export default function GallerySection({ posts, onPostClick }) {
  return (
    <section className={styles.gallerySection}>
      <div className={styles.gridContainer}>
        {posts.length === 0 ? (
          <p>No posts yet.</p>
        ) : (
          posts.map((post) => {
            const firstImg = post.images[0];
            return (
              <div
                key={post._id}
                className={styles.thumb}
                onClick={() => onPostClick(post)}
                style={{ cursor: "pointer" }}
              >
                {firstImg ? (
                  <img
                    src={firstImg.url}
                    alt={post.caption || "Post image"}
                    className={styles.thumbImg}
                  />
                ) : (
                  <div className={styles.thumbPlaceholder}>No Image</div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
