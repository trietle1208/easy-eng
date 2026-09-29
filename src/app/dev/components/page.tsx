"use client";

import { useState } from "react";
import { ArrowRight, Info } from "lucide-react";

import { DevThemeToggle } from "@/components/dev/dev-theme-toggle";
import { CorrectionMark } from "@/components/marks/correction-mark";
import { HandCircle } from "@/components/marks/hand-circle";
import { HandUnderline } from "@/components/marks/hand-underline";
import { Highlighter } from "@/components/marks/highlighter";
import { Mascot } from "@/components/mascot/mascot";
import { Doodle } from "@/components/notebook/doodle";
import { GlassPanel } from "@/components/notebook/glass-panel";
import { NotebookPage } from "@/components/notebook/notebook-page";
import { StickyNote } from "@/components/notebook/sticky-note";
import { WashiTape } from "@/components/notebook/washi-tape";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LevelBadge } from "@/components/ui/level-badge";
import { LevelChips } from "@/components/ui/level-chips";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { CefrLevel } from "@/types/cefr";
import { CEFR_LEVELS } from "@/types/cefr";
import { MASCOT_POSES } from "@/types/mascot";

type LevelFilter = "all" | CefrLevel;

export default function DevComponentsPage() {
  const [level, setLevel] = useState<LevelFilter>("all");

  return (
    <TooltipProvider delayDuration={200}>
      <div className="bg-page min-h-dvh px-4 py-8 md:px-10">
        <div className="mx-auto flex max-w-5xl flex-col gap-8">
          <header className="flex flex-col gap-4 text-on-glass md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-kick text-xs font-extrabold tracking-[0.16em] uppercase">
                Easy English · Dev
              </p>
              <h1 className="font-hand text-headline mt-1 text-4xl leading-none md:text-5xl">
                Component gallery
              </h1>
              <p className="mt-2 max-w-xl text-on-glass-2">
                Phase 1 foundation — tokens, fonts, themes, notebook marks and
                UI primitives. Toggle theme to verify both palettes.
              </p>
            </div>
            <DevThemeToggle />
          </header>

          <Section title="Typography" note="Be Vietnam Pro · Patrick Hand · JetBrains Mono">
            <GlassPanel className="space-y-4 p-6">
              <p className="font-sans text-lg text-on-glass">
                Body (Be Vietnam Pro): Luyện đọc hằng ngày — ngữ pháp và từ
                vựng theo trình độ CEFR.
              </p>
              <p className="font-hand text-3xl text-headline">
                Hand (Patrick Hand): Luyện đọc hằng ngày
              </p>
              <p className="font-mono text-base text-on-glass-2">
                Mono (JetBrains): /ˌser.ənˈdɪp.ə.ti/ · 18:42
              </p>
            </GlassPanel>
          </Section>

          <Section title="Notebook">
            <div className="grid gap-6 md:grid-cols-2">
              <NotebookPage
                withMargin
                withRings
                className="min-h-56 rounded-[8px_16px_10px_14px] p-6 pt-8"
              >
                <WashiTape variant="cream" />
                <p className="text-kick text-xs font-extrabold tracking-[0.16em] uppercase">
                  Notebook page
                </p>
                <h2 className="font-hand mt-2 text-3xl">Today&apos;s goal</h2>
                <p className="text-muted mt-2 text-sm">
                  Ruled lines, red margin, binder rings.
                </p>
                <div className="mt-4">
                  <ProgressBar value={60} aria-label="New words" />
                </div>
              </NotebookPage>

              <div className="flex flex-col gap-4">
                <StickyNote>
                  <p className="font-hand text-accent text-sm tracking-wide">
                    WORD OF THE DAY · Từ của ngày
                  </p>
                  <p className="font-hand text-4xl leading-none text-ink-2">
                    serendipity
                  </p>
                  <p className="font-mono text-sm">/ˌser.ənˈdɪp.ə.ti/</p>
                  <p className="text-base font-extrabold">
                    sự tình cờ may mắn
                  </p>
                  <p className="text-sm italic">
                    Finding this café was pure{" "}
                    <Highlighter>serendipity</Highlighter>.
                  </p>
                </StickyNote>
                <GlassPanel className="flex items-center gap-3 p-4">
                  <Doodle />
                  <span className="font-hand text-2xl">Doodle + GlassPanel</span>
                </GlassPanel>
              </div>
            </div>
          </Section>

          <Section title="Marks">
            <GlassPanel className="space-y-4 p-6 text-on-glass">
              <p>
                Circle: I{" "}
                <HandCircle color="danger">goed</HandCircle> to school.
              </p>
              <p>
                Underline:{" "}
                <HandUnderline color="primary">Present perfect</HandUnderline>{" "}
                vs past simple.
              </p>
              <p>
                Correction: I{" "}
                <CorrectionMark
                  wrong="goed"
                  correct="went"
                  note="Động từ bất quy tắc: go → went"
                />{" "}
                home early.
              </p>
            </GlassPanel>
          </Section>

          <Section title="UI · badges, chips, progress, buttons">
            <GlassPanel className="space-y-6 p-6">
              <div className="flex flex-wrap gap-2">
                {CEFR_LEVELS.map((lv) => (
                  <LevelBadge key={lv} level={lv} />
                ))}
              </div>
              <LevelChips value={level} onChange={setLevel} />
              <div className="space-y-2">
                <ProgressBar value={35} />
                <ProgressBar value={60} />
                <ProgressBar value={100} />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button>
                  Start learning <ArrowRight className="size-5" />
                </Button>
                <Button variant="ghost">Take the level test</Button>
                <Button variant="ink">Ink / outline</Button>
                <Button variant="outline">Outline</Button>
              </div>
            </GlassPanel>
          </Section>

          <Section title="Mascot" note="frog (default) / foal Bông (blossom)">
            <GlassPanel className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-4">
              {MASCOT_POSES.map((pose) => (
                <figure
                  key={pose}
                  className="flex flex-col items-center gap-2 rounded-2xl bg-soft p-3"
                >
                  <Mascot pose={pose} size="md" />
                  <figcaption className="font-mono text-xs text-on-glass-2">
                    {pose}
                  </figcaption>
                </figure>
              ))}
            </GlassPanel>
          </Section>

          <Section title="shadcn primitives">
            <GlassPanel className="flex flex-wrap items-start gap-3 p-6">
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm">Dialog</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add a new word</DialogTitle>
                    <DialogDescription>
                      Thêm từ mới vào sổ tay — fields with * are required.
                    </DialogDescription>
                  </DialogHeader>
                  <p className="font-hand text-xl">Luyện đọc hằng ngày</p>
                </DialogContent>
              </Dialog>

              <Popover>
                <PopoverTrigger asChild>
                  <Button size="sm" variant="ghost">
                    Popover
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <p className="font-hand text-lg">Tip</p>
                  <p className="text-muted text-sm">
                    Grammar isn&apos;t about speaking perfectly.
                  </p>
                </PopoverContent>
              </Popover>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ink">
                    Menu
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Theme · Giao diện</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Default · green</DropdownMenuItem>
                  <DropdownMenuItem>Blossom · pink</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Tabs defaultValue="study">
                <TabsList>
                  <TabsTrigger value="study">Study</TabsTrigger>
                  <TabsTrigger value="pomodoro">Pomodoro</TabsTrigger>
                </TabsList>
                <TabsContent value="study" className="font-mono text-on-glass">
                  18:42
                </TabsContent>
                <TabsContent value="pomodoro" className="font-mono text-on-glass">
                  25:00
                </TabsContent>
              </Tabs>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost" aria-label="Info">
                    <Info className="size-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Visible focus + tooltip</TooltipContent>
              </Tooltip>
            </GlassPanel>
          </Section>
        </div>
      </div>
    </TooltipProvider>
  );
}

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline gap-3 text-on-glass">
        <h2 className="font-hand text-3xl leading-none">{title}</h2>
        {note ? <span className="text-sm text-on-glass-2">{note}</span> : null}
      </div>
      {children}
    </section>
  );
}
