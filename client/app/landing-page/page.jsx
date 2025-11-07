import Link from "next/link";
import { CameraIcon, HeartIcon, SparklesIcon } from "lucide-react";
import styles from "./Landing.module.css";

export default function Landing() {
  const sampleMemories = [
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
    "https://explorerchick.com/wp-content/uploads/2023/08/hiking_groups1.jpg",
    "https://i0.pickpik.com/photos/58/125/279/nature-mountains-hiking-outddors-preview.jpg",
  ];

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.centerText}>
          <h1 className={styles.title}>Memento</h1>
          <h2 className={styles.subtitle}>Capture. Reflect. Relive.</h2>
        </div>

        <div className={styles.features}>
          <div className={styles.card}>
            <div className={`${styles.iconCircle} ${styles.capture}`}>
              <CameraIcon color="#FF8559" size={35} />
            </div>
            <h3 className={styles.cardTitle}>Capture</h3>
            <p className={styles.cardText}>
              Preserve your precious moments with photos and heartfelt captions
            </p>
          </div>

          <div className={styles.card}>
            <div className={`${styles.iconCircle} ${styles.reflect}`}>
              <HeartIcon color="#069494" size={35} />
            </div>
            <h3 className={styles.cardTitle}>Reflect</h3>
            <p className={styles.cardText}>
              Add meaning to your memories with personal notes and reflections
            </p>
          </div>

          <div className={styles.card}>
            <div className={`${styles.iconCircle} ${styles.relive}`}>
              <SparklesIcon color="#c096e6" size={35} />
            </div>
            <h3 className={styles.cardTitle}>Relive</h3>
            <p className={styles.cardText}>
              Journey through your timeline and rediscover cherished moments
            </p>
          </div>
        </div>

        <div className={styles.gallery}>
          {sampleMemories.map((image, index) => (
            <img
              key={index}
              src={image}
              alt={`Memory ${index + 1}`}
              className={styles.memoryImg}
            />
          ))}
        </div>

        <div className={styles.buttonGroup}>
          <Link href="/signup">
            <button className={`${styles.btn} ${styles.getStarted}`}>
              Get Started
            </button>
          </Link>
          <Link href="/login">
            <button className={`${styles.btn} ${styles.login}`}>Login</button>
          </Link>
        </div>
      </div>
    </div>
  );
}
