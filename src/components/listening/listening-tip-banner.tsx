"use client";

import { useState } from "react";
import { X } from "lucide-react";

export function ListeningTipBanner() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <div
      role="note"
      className="flex shrink-0 flex-wrap items-center gap-2 rounded-[14px] border-[1.5px] border-dashed border-soft-border py-2 pr-1.5 pl-5 text-[15px] text-on-glass sm:flex-nowrap sm:gap-3"
    >
      <span className="font-hand text-[23px] text-headline">#Tip:</span>
      <span>
        Listen twice before you open the transcript — your ears learn faster
        that way.
      </span>
      <span className="text-on-glass-2 italic">
        Nghe 2 lần rồi mới xem lời thoại.
      </span>
      <div className="hidden flex-1 sm:block" />
      <button
        type="button"
        aria-label="Dismiss tip"
        onClick={() => setVisible(false)}
        className="ml-auto flex size-10 items-center justify-center rounded-[10px] text-on-glass"
      >
        <X className="size-[18px]" strokeWidth={2.2} aria-hidden />
      </button>
    </div>
  );
}
