"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { adminInputClass } from "@/components/admin/entity-form";
import { Button } from "@/components/ui/button";
import {
  saveGrammarFamilyAction,
  saveGrammarGroupAction,
} from "@/lib/actions/admin-taxonomy";

type Family = { id: string; title: string };

export function TaxonomyForms({ families }: { families: Family[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [fam, setFam] = useState({ id: "", title: "", sortOrder: "1" });
  const [grp, setGrp] = useState({
    id: "",
    title: "",
    sortOrder: "1",
    familyId: families[0]?.id ?? "",
  });

  function run(
    fn: () => Promise<{ ok: boolean; message?: string }>,
    reset: () => void,
  ) {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fn();
        if (!res.ok) {
          setError(res.message ?? "Failed");
          return;
        }
        reset();
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  return (
    <details className="border-line rounded-lg border-2 border-dashed p-4">
      <summary className="cursor-pointer text-sm font-extrabold">
        Families &amp; groups ({families.length} families)
      </summary>
      <div className="mt-4 grid gap-6 md:grid-cols-2">
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            run(
              () =>
                saveGrammarFamilyAction({
                  id: fam.id,
                  title: fam.title,
                  sortOrder: Number(fam.sortOrder) || 0,
                }),
              () => setFam({ id: "", title: "", sortOrder: "1" }),
            );
          }}
        >
          <h3 className="m-0 text-sm font-extrabold">Add / update family</h3>
          <input aria-label="Family id" placeholder="id (slug)" className={adminInputClass} value={fam.id} onChange={(e) => setFam({ ...fam, id: e.target.value })} />
          <input aria-label="Family title" placeholder="Title" className={adminInputClass} value={fam.title} onChange={(e) => setFam({ ...fam, title: e.target.value })} />
          <input aria-label="Family sort order" type="number" className={adminInputClass} value={fam.sortOrder} onChange={(e) => setFam({ ...fam, sortOrder: e.target.value })} />
          <Button type="submit" size="sm" variant="ink" disabled={pending}>
            Save family
          </Button>
        </form>

        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            run(
              () =>
                saveGrammarGroupAction({
                  id: grp.id,
                  title: grp.title,
                  familyId: grp.familyId,
                  sortOrder: Number(grp.sortOrder) || 0,
                }),
              () => setGrp({ ...grp, id: "", title: "", sortOrder: "1" }),
            );
          }}
        >
          <h3 className="m-0 text-sm font-extrabold">Add / update group</h3>
          <select aria-label="Group family" className={adminInputClass} value={grp.familyId} onChange={(e) => setGrp({ ...grp, familyId: e.target.value })}>
            {families.map((f) => (
              <option key={f.id} value={f.id}>
                {f.title}
              </option>
            ))}
          </select>
          <input aria-label="Group id" placeholder="id (slug)" className={adminInputClass} value={grp.id} onChange={(e) => setGrp({ ...grp, id: e.target.value })} />
          <input aria-label="Group title" placeholder="Title" className={adminInputClass} value={grp.title} onChange={(e) => setGrp({ ...grp, title: e.target.value })} />
          <input aria-label="Group sort order" type="number" className={adminInputClass} value={grp.sortOrder} onChange={(e) => setGrp({ ...grp, sortOrder: e.target.value })} />
          <Button type="submit" size="sm" variant="ink" disabled={pending}>
            Save group
          </Button>
        </form>
      </div>
      {error ? (
        <p role="alert" className="text-danger m-0 mt-3 text-sm font-bold">
          {error}
        </p>
      ) : null}
    </details>
  );
}
