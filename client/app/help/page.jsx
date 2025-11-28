"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Activity,
  BookMarked,
  ChevronDown,
  Image as ImageIcon,
  Info,
  Lock,
  Mail,
  MapPin,
  Settings,
  Upload,
  UserRound,
} from "lucide-react";
import styles from "./Help.module.css";

const faqItems = [
  {
    question: "What happens if I accidentally upload the wrong photo?",
    answer: "You can delete the photo from your Gallery at any time, or replace it when editing a scrapbook.",
  },
  {
    question: "Do my photos keep their original quality?",
    answer: "Yes. Memento stores photos in high quality so your memories stay crisp and clear.",
  },
  {
    question: "Can I change a post from private to public later?",
    answer: "Absolutely. Just open the post settings and toggle the privacy option anytime.",
  },
  {
    question: "How does the Wrapped feature work?",
    answer: "Wrapped automatically analyzes your uploads, dates, and tags to generate personalized yearly stats.",
  },
  {
    question: "Can I edit a caption after uploading the photo?",
    answer: "Yes. Open the post and click Edit Caption to update it.",
  },
  {
    question: "What types of files can I upload?",
    answer: "Memento currently supports JPG, PNG, and HEIC image formats.",
  },
  {
    question: "Will my scrapbooks be visible to others?",
    answer: "Your scrapbooks are private by default. You can choose to make one public when sharing.",
  },
  {
    question: "Can I restore a deleted post?",
    answer: "No, deleted posts are permanently removed to protect your privacy and storage space.",
  },
  {
    question: "Why can't I upload more than 10 photos at once?",
    answer: "To keep uploads fast and avoid server issues, posts are limited to 10 photos each.",
  },
  {
    question: "Is there a limit to how many scrapbooks I can create?",
    answer: "Nope! You can create as many scrapbooks as you want.",
  },
  {
    question: "Do photo tags affect anything?",
    answer: "Tags help you search, filter, and organize your photos more easily in your gallery.",
  }
];

const postSteps = [
  {
    title: "Click “Upload” in the top navigation bar.",
    detail: "This opens the upload workspace so you can start a memory.",
    imageSrc: "/uploadbuttonstep.png",
    alt: "Navigate to Upload",
  },
  {
    title: "Drag and drop up to 10 photos into the upload box.",
    detail: "Reorder them to tell the story the way you remember it.",
    imageSrc: "/upload.png",
    alt: "Upload photos",
  },
  {
    title: "Add a caption and location (required).",
    detail:
      "Context helps friends follow along, and it powers your map view later.",
    imageSrc: "/captionlocstep.png",
    alt: "Add caption and location",
  },
  {
    title: "Add tags to classify your post (optional)",
    detail: "Users can look through specific memories they want using tags.",
    imageSrc: "/categorystep.png",
    alt: "Tag post",
  },
  {
    title: "Review your memory and click “Create Post”.",
    detail: "Final check: confirm the cover photo, categories, and details.",
    imageSrc: "/reviewstep.png",
    alt: "Review and submit",
  },
];

const scrapbookSteps = [
  {
    title: "Navigate to your Gallery.",
    detail: "Switch from feed to your personal gallery to manage content.",
    imageSrc: "/gallerybutton.png",
    alt: "Gallery view",
  },
  {
    title: "Switch to the “Scrapbooks” tab.",
    detail: "See existing books and the option to make a new one.",
    imageSrc: "/scrapbooktab.png",
    alt: "Scrapbooks tab",
  },
  {
    title: "Click “Create Scrapbook”.",
    detail: "Choose a theme or occasion to keep things organized.",
    imageSrc: "/createbutton.png",
    alt: "Create scrapbook",
  },
  {
    title: "Select posts, choose a title + cover, and save it.",
    detail: "You can rearrange pages anytime to refine the story.",
    imageSrc: "/createscrapbook.png",
    alt: "Select posts and save",
  },
];

export default function HelpPage() {
  const [openSteps, setOpenSteps] = useState(
    () => Array(postSteps.length).fill(false)
  );
  const [openScrapSteps, setOpenScrapSteps] = useState(
    () => Array(scrapbookSteps.length).fill(false)
  );

  const toggleStep = (idx) => {
    setOpenSteps((prev) => prev.map((open, i) => (i === idx ? !open : open)));
  };

  const toggleScrapStep = (idx) => {
    setOpenScrapSteps((prev) =>
      prev.map((open, i) => (i === idx ? !open : open))
    );
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>How to Use Memento</h1>
        </div>

        <section className={styles.card}>
          <div className={styles.sectionHeader}>
            <Upload className={styles.iconAccent} />
            <div>
              <h2>Create a Post</h2>
              <p className={styles.sectionCopy}>
                Upload photos, add captions and locations, tag categories, then
                publish your memory.
              </p>
            </div>
          </div>

          <ol className={styles.stepList}>
            {postSteps.map((step, idx) => (
              <li className={styles.stepItem} key={step.title}>
                <span className={styles.stepBadge}>{idx + 1}</span>
                <div className={styles.stepContent}>
                  <div className={styles.stepHeaderRow}>
                    <p className={styles.stepText}>{step.title}</p>
                    <button
                      type="button"
                      className={`${styles.toggleButton} ${openSteps[idx] ? styles.toggleOpen : ""
                        }`}
                      onClick={() => toggleStep(idx)}
                    >
                      <ChevronDown className={styles.toggleIcon} size={16} />
                    </button>
                  </div>
                  <p className={styles.stepDetail}>{step.detail}</p>
                  {openSteps[idx] && (
                    <div className={styles.stepImageWrap}>
                      <Image
                        src={step.imageSrc}
                        width={200}
                        height={300}
                        alt={step.alt}
                        className={styles.stepImage}
                      />
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.card}>
          <div className={styles.sectionHeader}>
            <BookMarked className={styles.iconAccent} />
            <div>
              <h2>Create a Scrapbook</h2>
              <p className={styles.sectionCopy}>
                Group multiple posts into a themed scrapbook to tell a longer
                story.
              </p>
            </div>
          </div>

          <ol className={styles.stepList}>
            {scrapbookSteps.map((step, idx) => (
              <li className={styles.stepItem} key={step.title}>
                <span className={styles.stepBadge}>{idx + 1}</span>
                <div className={styles.stepContent}>
                  <div className={styles.stepHeaderRow}>
                    <p className={styles.stepText}>{step.title}</p>
                    <button
                      type="button"
                      className={`${styles.toggleButton} ${openScrapSteps[idx] ? styles.toggleOpen : ""
                        }`}
                      onClick={() => toggleScrapStep(idx)}
                    >
                      <ChevronDown className={styles.toggleIcon} size={16} />
                    </button>
                  </div>
                  <p className={styles.stepDetail}>{step.detail}</p>
                  {openScrapSteps[idx] && (
                    <div className={styles.stepImageWrap}>
                      <Image
                        src={step.imageSrc}
                        width={200}
                        height={300}
                        alt={step.alt}
                        className={styles.stepImage}
                      />
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>


        <section className={styles.card}>
          <div className={styles.sectionHeader}>
            <Info className={styles.iconAccent} />
            <div>
              <h2>FAQ</h2>
              <p className={styles.sectionCopy}>
                Quick answers to common questions about uploading and privacy.
              </p>
            </div>
          </div>

          <div className={styles.accordion}>
            {faqItems.map((item) => (
              <details className={styles.accordionItem} key={item.question}>
                <summary>
                  <span>{item.question}</span>
                  <span className={styles.chevron} aria-hidden="true"></span>
                </summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
