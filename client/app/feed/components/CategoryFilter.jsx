"use client";
import styles from "../Feed.module.css";

const CATEGORIES = [
  "Travel",
  "Sports",
  "Gaming",
  "Lifestyle",
  "Food",
  "Fitness",
  "Fashion",
  "Beauty",
  "Wellness",
  "Home",
  "Family",
  "Art",
  "Music",
  "Photography",
  "Nature",
];

export default function CategoryFilter({ selectedCategory, onCategoryChange }) {
  return (
    <div className={styles.filterBar}>
      <label className={styles.filterLabel}>Filter by category:</label>
      <select
        value={selectedCategory}
        onChange={(e) => onCategoryChange(e.target.value)}
        className={styles.filterSelect}
      >
        <option value="">All Categories</option>
        {CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>
    </div>
  );
}
