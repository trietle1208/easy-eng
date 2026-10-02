import "server-only";

import type { AdminListRow } from "@/lib/admin/common";
import { entityToValues, type FormContext, type FormValues } from "@/lib/admin/forms";
import { getGrammar, getGrammarTaxonomy, listGrammar } from "@/lib/admin/grammar";
import { getListening, listListening } from "@/lib/admin/listening";
import { getQuizForAdmin, listQuizzes } from "@/lib/admin/quiz";
import { getReading, listReading } from "@/lib/admin/reading";
import type { ContentKind, ContentStatus } from "@/lib/admin/validate";
import { getWordSetBundle, listWordSets } from "@/lib/admin/vocabulary";

export async function listByKind(
  kind: ContentKind,
  filters?: { status?: ContentStatus | "all"; topic?: string | "all" },
): Promise<AdminListRow[]> {
  switch (kind) {
    case "grammar":
      return listGrammar();
    case "reading":
      return listReading();
    case "listening":
      return listListening();
    case "quiz":
      return listQuizzes();
    case "vocabulary":
      return listWordSets(filters);
  }
}

export async function loadFormContext(kind: ContentKind): Promise<FormContext> {
  if (kind !== "grammar") return { groups: [] };
  const { families, groups } = await getGrammarTaxonomy();
  const titles = new Map(families.map((f) => [f.id, f.title]));
  return {
    groups: groups.map((g) => ({
      id: g.id,
      familyId: g.familyId,
      title: g.title,
      familyTitle: titles.get(g.familyId) ?? g.familyId,
    })),
  };
}

export type EditPayload = {
  id: string;
  title: string;
  status: ContentStatus;
  values: FormValues;
};

export async function loadForEdit(
  kind: ContentKind,
  id: string,
): Promise<EditPayload | null> {
  switch (kind) {
    case "grammar": {
      const hit = await getGrammar(id);
      return hit
        ? { id, title: hit.entity.title, status: hit.status, values: entityToValues(kind, hit.entity) }
        : null;
    }
    case "reading": {
      const hit = await getReading(id);
      return hit
        ? { id, title: hit.entity.title, status: hit.status, values: entityToValues(kind, hit.entity) }
        : null;
    }
    case "listening": {
      const hit = await getListening(id);
      return hit
        ? { id, title: hit.entity.title, status: hit.status, values: entityToValues(kind, hit.entity) }
        : null;
    }
    case "quiz": {
      const hit = await getQuizForAdmin(id);
      return hit
        ? { id, title: hit.entity.title, status: hit.status, values: entityToValues(kind, hit.entity) }
        : null;
    }
    case "vocabulary": {
      const hit = await getWordSetBundle(id);
      return hit
        ? { id, title: hit.bundle.set.title, status: hit.status, values: entityToValues(kind, hit.bundle) }
        : null;
    }
  }
}
