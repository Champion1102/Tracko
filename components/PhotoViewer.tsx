"use client";

import { AnimatePresence, motion } from "motion/react";

/** Full-screen look at one photo, with the only two things she'd want: close, delete. */
export function PhotoViewer({
  url,
  onClose,
  onDelete,
}: {
  url: string | null;
  onClose: () => void;
  onDelete?: () => void;
}) {
  return (
    <AnimatePresence>
      {url && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-ink/92 p-6 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-sm"
            initial={{ scale: 0.94 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="w-full rounded-2xl" />
            <div className="mt-3 flex gap-2">
              <button
                onClick={onClose}
                className="press flex-1 rounded-2xl border-line bg-surface-2 py-3 text-[13px] font-bold text-text"
              >
                Close
              </button>
              {onDelete && (
                <button
                  onClick={onDelete}
                  className="press rounded-2xl border-flame-deep bg-flame px-5 py-3 text-[13px] font-bold text-white"
                >
                  Delete
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
