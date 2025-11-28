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
    question: "How many photos can I upload at once?",
    answer: "You can add up to 10 photos to a single post.",
  },
  {
    question: "Are my posts private?",
    answer: "Your memories stay private unless you explicitly set them to public.",
  },
  {
    question: "Can I delete a post?",
    answer: "Yes. Open your Gallery, choose the post, and select Delete.",
  },
  {
    question: "How do I edit a scrapbook?",
    answer: "Open the scrapbook, click Edit, adjust the posts or cover, then save.",
  },
];

const postSteps = [
  {
    title: "Click “Upload” in the top navigation bar.",
    detail: "This opens the upload workspace so you can start a memory.",
    imageSrc: "/client/public/uploadstep.png",
    alt: "Navigate to Upload",
  },
  {
    title: "Drag and drop up to 10 photos into the upload box.",
    detail: "Reorder them to tell the story the way you remember it.",
    imageSrc: "/file.svg",
    alt: "Upload photos",
  },
  {
    title: "Add a caption and location (required).",
    detail:
      "Context helps friends follow along, and it powers your map view later.",
    imageSrc: "/file.svg",
    alt: "Add caption and location",
  },
  {
    title: "Review your memory and click “Create Post”.",
    detail: "Final check: confirm the cover photo, categories, and details.",
    imageSrc: "/file.svg",
    alt: "Review and submit",
  },
];

export default function HelpPage() {
  const [openSteps, setOpenSteps] = useState(
    () => Array(postSteps.length).fill(false)
  );

  const toggleStep = (idx) => {
    setOpenSteps((prev) => prev.map((open, i) => (i === idx ? !open : open)));
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
                      className={`${styles.toggleButton} ${
                        openSteps[idx] ? styles.toggleOpen : ""
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
                        width={300}
                        height={200}
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
              <h2>How to Create a Scrapbook</h2>
              <p className={styles.sectionCopy}>
                Group multiple posts into a themed scrapbook to tell a longer
                story.
              </p>
            </div>
          </div>

          <ol className={styles.stepList}>
            <li className={styles.stepItem}>
              <span className={styles.stepBadge}>1</span>
              <div>
                <p className={styles.stepText}>Navigate to your Gallery.</p>
                <p className={styles.stepDetail}>
                  Switch from feed to your personal gallery to manage content.
                </p>
              </div>
            </li>
            <li className={styles.stepItem}>
              <span className={styles.stepBadge}>2</span>
              <div>
                <p className={styles.stepText}>
                  Switch to the “Scrapbooks” tab.
                </p>
                <p className={styles.stepDetail}>
                  Here you will see existing books and the option to make a new
                  one.
                </p>
              </div>
            </li>
            <li className={styles.stepItem}>
              <span className={styles.stepBadge}>3</span>
              <div>
                <p className={styles.stepText}>Click “Create Scrapbook”.</p>
                <p className={styles.stepDetail}>
                  Choose a theme or occasion to keep things organized.
                </p>
              </div>
            </li>
            <li className={styles.stepItem}>
              <span className={styles.stepBadge}>4</span>
              <div>
                <p className={styles.stepText}>
                  Select posts, choose a title + cover, and save it.
                </p>
                <p className={styles.stepDetail}>
                  You can rearrange pages anytime to refine the story.
                </p>
              </div>
            </li>
          </ol>
        </section>

        <section className={styles.card}>
          <div className={styles.sectionHeader}>
            <Settings className={styles.iconAccent} />
            <div>
              <h2>Editing Your Account Settings</h2>
              <p className={styles.sectionCopy}>
                All account controls live under <strong>Account → Settings</strong>.
                Adjust your identity and security in a few taps.
              </p>
            </div>
          </div>

          <div className={styles.settingsGrid}>
            <div className={styles.settingItem}>
              <div className={styles.iconBadge}>
                <ImageIcon size={18} />
              </div>
              <div>
                <p className={styles.settingTitle}>Change profile picture</p>
                <p className={styles.settingCopy}>
                  Upload a fresh avatar to keep your profile recognizable.
                </p>
              </div>
            </div>
            <div className={styles.settingItem}>
              <div className={styles.iconBadge}>
                <Mail size={18} />
              </div>
              <div>
                <p className={styles.settingTitle}>Update email</p>
                <p className={styles.settingCopy}>
                  Swap to a new inbox and confirm the verification link we send.
                </p>
              </div>
            </div>
            <div className={styles.settingItem}>
              <div className={styles.iconBadge}>
                <UserRound size={18} />
              </div>
              <div>
                <p className={styles.settingTitle}>Change username</p>
                <p className={styles.settingCopy}>
                  Pick a new handle; it updates on your posts and scrapbooks.
                </p>
              </div>
            </div>
            <div className={styles.settingItem}>
              <div className={styles.iconBadge}>
                <Lock size={18} />
              </div>
              <div>
                <p className={styles.settingTitle}>Update password</p>
                <p className={styles.settingCopy}>
                  Choose a strong password to protect your account and memories.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.sectionHeader}>
            <Activity className={styles.iconAccent} />
            <div>
              <h2>Wrapped / Activity Stats Overview</h2>
              <p className={styles.sectionCopy}>
                Track your posting streaks and see a map of your activity over
                time.
              </p>
            </div>
          </div>

          <div className={styles.statsBlock}>
            <p className={styles.stepDetail}>
              Heatmap tiles darken as you post more. Light squares mean fewer
              posts; darker squares show your most active days.
            </p>
            <ul className={styles.statsList}>
              <li className={styles.statItem}>
                <MapPin size={18} />
                <span>Total posts across all memories.</span>
              </li>
              <li className={styles.statItem}>
                <Upload size={18} />
                <span>Hearts received and how people react.</span>
              </li>
              <li className={styles.statItem}>
                <Activity size={18} />
                <span>Most active month plus streak highlights.</span>
              </li>
              <li className={styles.statItem}>
                <BookMarked size={18} />
                <span>Scrapbooks created and most visited sets.</span>
              </li>
            </ul>
          </div>
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
                  <span className={styles.chevron}>+</span>
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
