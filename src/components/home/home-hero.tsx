import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Mascot } from "@/components/mascot/mascot";
import { Button } from "@/components/ui/button";
import type { Greeting } from "@/types/home";

type HomeHeroProps = {
  greeting: Greeting;
  wordsLeft: number;
};

export function HomeHero({ greeting, wordsLeft }: HomeHeroProps) {
  return (
    <section className="flex flex-col gap-6 sm:flex-row sm:items-end sm:gap-3">
      <div className="flex min-w-0 flex-1 flex-col gap-3.5">
        <span className="font-hand self-start rounded-[var(--radius-pill)] border border-dashed border-soft-border px-3.5 py-1 text-lg text-on-glass">
          {greeting.en} · {greeting.vi}
        </span>
        <h1 className="font-hand m-0 text-[clamp(2.75rem,8vw,4.875rem)] leading-[0.95] font-black tracking-tight text-headline [text-shadow:0_4px_18px_rgba(0,0,0,.25)]">
          Hi {greeting.userName},
        </h1>
        <p className="font-hand m-0 text-[clamp(1.35rem,3vw,1.95rem)] leading-[1.12] text-on-glass">
          let&apos;s fill one more page of your English notebook.
        </p>
        <p className="m-0 text-base leading-relaxed text-on-glass-2 sm:text-[17px]">
          Mỗi ngày một trang — ngữ pháp và từ vựng theo trình độ CEFR.
        </p>
        <div className="mt-2 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/grammar">
              Start learning
              <ArrowRight aria-hidden className="size-5" strokeWidth={2.4} />
            </Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/quiz/level-test">Take the level test</Link>
          </Button>
        </div>
      </div>

      <div className="flex w-full shrink-0 flex-col items-center gap-3.5 sm:w-[220px]">
        <div className="font-hand relative rounded-[18px] bg-surface px-4 py-3 text-center text-[21px] leading-[1.12] text-ink shadow-[0_8px_18px_rgba(0,0,0,.25)]">
          Only{" "}
          <span className="text-danger">{wordsLeft} words</span> left for
          today&apos;s goal!
          <span
            aria-hidden
            className="absolute bottom-[-8px] left-1/2 ml-[-8px] size-4 rotate-45 bg-surface"
          />
        </div>
        <Mascot pose="wave" size={172} className="max-w-[172px]" />
      </div>
    </section>
  );
}
