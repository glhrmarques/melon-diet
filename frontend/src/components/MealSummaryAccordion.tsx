"use client";

import { useId, useState, type ReactNode } from "react";

export function MealSummaryAccordion({ title, children }: { title: string; children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();

  return (
    <section className={`overflow-hidden rounded-xl ${expanded ? "bg-white" : "bg-[#f5f5f5]"}`}>
      <h3>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={contentId}
          onClick={() => setExpanded((current) => !current)}
          className="flex min-h-[52px] w-full cursor-pointer items-center justify-between gap-4 px-3 pt-3 pb-4 text-left text-xl font-semibold transition-colors hover:bg-white focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-black"
        >
          {title}
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"
            className={`shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}>
            <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </h3>
      <div id={contentId} hidden={!expanded} className="px-3 pb-3">
        {children}
      </div>
    </section>
  );
}
