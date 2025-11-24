"use client";
import styles from "../Upload.module.css";

export default function StepIndicator({ stage }) {
  return (
    <div className={styles.stepIndicator}>
      <div className={`${styles.step} ${stage >= 1 ? styles.active : ""}`}>
        1
      </div>
      <div
        className={`${styles.stepLine} ${stage >= 2 ? styles.active : ""}`}
      ></div>
      <div className={`${styles.step} ${stage >= 2 ? styles.active : ""}`}>
        2
      </div>
      <div
        className={`${styles.stepLine} ${stage >= 3 ? styles.active : ""}`}
      ></div>
      <div className={`${styles.step} ${stage >= 3 ? styles.active : ""}`}>
        3
      </div>
      <div
        className={`${styles.stepLine} ${stage >= 4 ? styles.active : ""}`}
      ></div>
      <div className={`${styles.step} ${stage >= 4 ? styles.active : ""}`}>
        4
      </div>
    </div>
  );
}
