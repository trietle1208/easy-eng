"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { SelectField } from "@/components/ui/select-field";
import { WORD_SET_TOPICS } from "@/types/vocabulary";

type VocabListFiltersProps = {
  status: string;
  topic: string;
};

export function VocabListFilters({ status, topic }: VocabListFiltersProps) {
  const router = useRouter();
  const params = useSearchParams();

  function update(key: "status" | "topic", value: string) {
    const next = new URLSearchParams(params.toString());
    if (value === "all") next.delete(key);
    else next.set(key, value);
    const q = next.toString();
    router.push(q ? `/admin/vocabulary?${q}` : "/admin/vocabulary");
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <SelectField
        variant="soft"
        aria-label="Filter by status"
        className="h-10 !w-auto min-w-[140px] text-sm"
        value={status}
        onValueChange={(v) => update("status", v)}
        options={[
          { value: "all", label: "Status: All" },
          { value: "draft", label: "Draft" },
          { value: "published", label: "Published" },
        ]}
      />
      <SelectField
        variant="soft"
        aria-label="Filter by topic"
        className="h-10 !w-auto min-w-[180px] text-sm"
        value={topic}
        onValueChange={(v) => update("topic", v)}
        options={[
          { value: "all", label: "Topic: All" },
          ...WORD_SET_TOPICS.map((t) => ({ value: t, label: t })),
        ]}
      />
    </div>
  );
}
