

"use client";

import React, { useMemo, useRef, useState } from "react";
import styles from "./Wrapped.module.css";

const CELL_SIZE = 10;
const CELL_GAP = 3;
const MONTH_GAP = 12; // horizontal gap between months (px)

// Color scale
const getDateKey = (date, timeZone) =>
    new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(date);

const getDateLabel = (date, timeZone) =>
    date.toLocaleDateString("en-US", {
        timeZone,
        month: "short",
        day: "numeric",
        year: "numeric",
    });

function getColor(count, maxCount) {
    if (!count || maxCount === 0) return "#f5ebe7";
    const ratio = count / maxCount;
    if (ratio > 0.75) return "#ff7f66";
    if (ratio > 0.5) return "#ff9d85";
    if (ratio > 0.25) return "#ffc2b3";
    return "#ffe4de";
}

export default function ActivityHeatmap({
    posts,
    loading,
    year = new Date().getFullYear(),
}) {
    const [tooltip, setTooltip] = useState(null);
    const wrapperRef = useRef(null);
    const timeZone = useMemo(
        () => Intl.DateTimeFormat().resolvedOptions().timeZone,
        []
    );

    const { monthBlocks, maxCount, svgWidth, svgHeight } = useMemo(() => {
        const countsMap = {};

        (posts || []).forEach(post => {
            const raw = post?.createdAt;
            if (!raw) return;
            const d = new Date(raw);
            if (isNaN(d)) return;
            const key = getDateKey(d, timeZone);
            if (!key.startsWith(`${year}-`)) return;
            countsMap[key] = (countsMap[key] || 0) + 1;
        });

        const monthBlocks = [];

        for (let m = 0; m < 12; m++) {
            const first = new Date(year, m, 1);
            const daysInMonth = new Date(year, m + 1, 0).getDate();

            const monthDays = [];

            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(year, m, day);
                const key = getDateKey(date, timeZone);

                monthDays.push({
                    date,
                    dateKey: key,
                    dayOfWeek: date.getDay(),
                    count: countsMap[key] || 0,
                });
            }

            // group into week columns
            const weeks = [];
            let currentWeek = [];

            // starting offset: which weekday the month starts on
            const startDay = first.getDay();
            for (let i = 0; i < startDay; i++) {
                currentWeek.push(null);
            }

            monthDays.forEach((dayObj) => {
                currentWeek.push(dayObj);
                if (currentWeek.length === 7) {
                    weeks.push(currentWeek);
                    currentWeek = [];
                }
            });

            if (currentWeek.length > 0) {
                while (currentWeek.length < 7) currentWeek.push(null);
                weeks.push(currentWeek);
            }

            monthBlocks.push({
                month: m,
                weeks,
                width: weeks.length * (CELL_SIZE + CELL_GAP),
            });
        }

        const maxCount = Math.max(0, ...Object.values(countsMap));

        const svgWidth =
            monthBlocks.reduce((s, b) => s + b.width, 0) +
            MONTH_GAP * (monthBlocks.length - 1);

        const svgHeight = 7 * (CELL_SIZE + CELL_GAP) + 20;

        return { monthBlocks, maxCount, svgWidth, svgHeight };
    }, [posts, year, timeZone]);


    // Empty states
    if (loading) {
        return (
            <section className={styles.activitySection}>
                <h2 className={styles.sectionTitle}>Your Activity Map</h2>
                <p className={styles.activitySubtleText}>Loading your year…</p>
            </section>
        );
    }

    if (!posts?.length) {
        return (
            <section className={styles.activitySection}>
                <h2 className={styles.sectionTitle}>Your Activity Map</h2>
                <p className={styles.activitySubtleText}>
                    No memories yet for this year ✨
                </p>
            </section>
        );
    }

    return (
        <section className={styles.activitySection}>
            <h2 className={styles.sectionTitle}>Your Activity Map</h2>
            <p className={styles.activitySubtleText}>
                Each square shows how many memories you captured that day.
            </p>

            <div className={styles.heatmapWrapper} ref={wrapperRef}>
                <svg
                    width={svgWidth}
                    height={svgHeight}
                    className={styles.heatmapSvg}
                >
                    {(() => {
                        let cursorX = 0;
                        const rendered = [];

                        monthBlocks.forEach((block, i) => {
                            const blockX = cursorX;

                            // Month label centered over block
                            rendered.push(
                                <text
                                    key={`label-${i}`}
                                    x={blockX + block.width / 2}
                                    y={7 * (CELL_SIZE + CELL_GAP) + 15}
                                    textAnchor="middle"
                                    className={styles.heatmapMonthLabel}
                                >
                                    {new Date(year, block.month, 1).toLocaleString("en-US", {
                                        month: "short",
                                    })}
                                </text>
                            );

                            // Render each week
                            block.weeks.forEach((week, w) => {
                                const weekX = blockX + w * (CELL_SIZE + CELL_GAP);

                                week.forEach((day, dow) => {
                                    if (!day) {
                                        // Do not render anything for padding days
                                        return;
                                    }


                                    rendered.push(
                                        <rect
                                            key={day.dateKey}
                                            x={weekX}
                                            y={day.dayOfWeek * (CELL_SIZE + CELL_GAP)}
                                            width={CELL_SIZE}
                                            height={CELL_SIZE}
                                            rx={2}
                                            ry={2}
                                            fill={getColor(day.count, maxCount)}
                                            className={styles.heatmapCell}
                                            onMouseEnter={(e) => {
                                                const wrapper = wrapperRef.current;
                                                if (!wrapper) return;
                                                const cellRect = e.currentTarget.getBoundingClientRect();
                                                const wrapperRect = wrapper.getBoundingClientRect();
                                                const dayLabel = getDateLabel(day.date, timeZone);
                                                setTooltip({
                                                    x:
                                                        cellRect.left -
                                                        wrapperRect.left +
                                                        wrapper.scrollLeft +
                                                        cellRect.width / 2,
                                                    y:
                                                        cellRect.top -
                                                        wrapperRect.top +
                                                        wrapper.scrollTop -
                                                        8,
                                                    label: `${day.count} submission${day.count === 1 ? "" : "s"} on ${dayLabel}`,
                                                });
                                            }}
                                            onMouseLeave={() => setTooltip(null)}
                                        >
                                            <title>
                                                {`${getDateLabel(day.date, timeZone)}: ${day.count
                                                    } memorie${day.count === 1 ? "" : "s"}`}
                                            </title>
                                        </rect>
                                    );
                                });

                            });

                            cursorX += block.width + MONTH_GAP;
                        });

                        return rendered;
                    })()}
                </svg>

                {tooltip && (
                    <div
                        className={styles.heatmapTooltip}
                        style={{ left: tooltip.x, top: tooltip.y }}
                        role="status"
                    >
                        {tooltip.label}
                    </div>
                )}
            </div>
        </section>
    );
}
