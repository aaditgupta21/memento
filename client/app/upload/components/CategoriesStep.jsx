"use client";
import { useEffect, useState } from "react";
import styles from "../Upload.module.css";

export default function CategoriesStep({
  categories,
  setCategories,
  availableCategories,
  onBack,
  onNext,
}) {
  const [isOpen, setIsOpen] = useState(false);

  // close on escape / outside
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e) => e.key === "Escape" && setIsOpen(false);
    const handleOutside = (e) => {
      const dropdown = document.querySelector(`.${styles.categoriesWrap}`);
      if (dropdown && !dropdown.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    document.addEventListener("click", handleOutside);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("click", handleOutside);
    };
  }, [isOpen]);

  return (
    <>
      <h2>Step 3: Categories</h2>
      <div className={styles.categoriesWrap}>
        <label className={styles.catLabel}>Categories (optional)</label>
        <button
          type="button"
          className={styles.catDropdownBtn}
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
        >
          {categories.length === 0 ? (
            <span className={styles.catPlaceholder}>Select categories...</span>
          ) : (
            <div className={styles.catBadges}>
              {categories.map((cat) => (
                <span key={cat} className={styles.catBadge}>
                  {cat}
                </span>
              ))}
            </div>
          )}
          <span className={styles.catCaret}>▾</span>
        </button>
        {isOpen && (
          <div className={styles.catDropdownPanel}>
            {availableCategories.map((cat) => {
              const checked = categories.includes(cat);
              return (
                <label key={cat} className={styles.catOption}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      if (e.target.checked)
                        setCategories((prev) => [...prev, cat]);
                      else
                        setCategories((prev) => prev.filter((c) => c !== cat));
                    }}
                  />
                  <span>{cat}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>
      <div className={styles.stepButtons}>
        <button onClick={onBack} className={styles.backBtn}>
          Back
        </button>
        <button onClick={onNext} className={styles.saveBtn}>
          Review & Submit
        </button>
      </div>
    </>
  );
}
