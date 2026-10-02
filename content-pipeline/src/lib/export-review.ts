import { mkdirSync, writeFileSync } from "node:fs";

import { PATHS } from "../../config";
import {
  buildReviewRows,
  buildSetTitleMap,
  catalogBrowseRows,
  readValidatedWords,
  REVIEW_DECISIONS,
  REVIEW_SHEET_HEADERS,
  rowsToCsv,
  rowToCells,
  selectReviewSheet,
  type ReviewSheetRow,
  type SelectionResult,
} from "./human-review";
import type { ValidatedWord } from "./review";
import { buildXlsx } from "./xlsx-minimal";

export type ExportReviewResult = {
  reviewRows: ReviewSheetRow[];
  catalogRows: ReviewSheetRow[];
  selection: SelectionResult;
  paths: {
    xlsx: string;
    reviewCsv: string;
    catalogCsv: string;
  };
};

export function exportReviewSheet(
  words: ValidatedWord[] = readValidatedWords(),
  opts: {
    xlsxPath?: string;
    reviewCsvPath?: string;
    catalogCsvPath?: string;
    dryRun?: boolean;
  } = {},
): ExportReviewResult {
  const setTitles = buildSetTitleMap();
  const selection = selectReviewSheet(words);
  const reviewRows = buildReviewRows(words, selection, setTitles);
  const catalogRows = catalogBrowseRows(words, setTitles);

  const xlsxPath = opts.xlsxPath ?? PATHS.reviewSheetXlsx;
  const reviewCsvPath = opts.reviewCsvPath ?? PATHS.reviewSheetCsv;
  const catalogCsvPath = opts.catalogCsvPath ?? PATHS.catalogSheetCsv;

  if (!opts.dryRun) {
    mkdirSync(PATHS.workDir, { recursive: true });
    writeFileSync(reviewCsvPath, rowsToCsv(reviewRows), "utf8");
    writeFileSync(catalogCsvPath, rowsToCsv(catalogRows), "utf8");

    const header = [...REVIEW_SHEET_HEADERS];
    const decisionCol = REVIEW_SHEET_HEADERS.indexOf("decision");
    const xlsx = buildXlsx([
      {
        name: "review",
        rows: [header, ...reviewRows.map(rowToCells)],
        listValidation:
          reviewRows.length > 0
            ? {
                col: decisionCol,
                startRow: 2,
                endRow: reviewRows.length + 1,
                options: [...REVIEW_DECISIONS],
              }
            : undefined,
        colWidths: [
          22, 14, 10, 6, 14, 22, 14, 28, 32, 28, 28, 28, 28, 24, 20, 28, 10, 10,
          20, 20, 20, 20, 20, 20, 24,
        ],
      },
      {
        name: "catalog",
        rows: [header, ...catalogRows.map(rowToCells)],
        colWidths: [
          22, 14, 10, 6, 14, 22, 14, 28, 32, 28, 28, 28, 28, 24, 20, 28, 10, 10,
          20, 20, 20, 20, 20, 20, 24,
        ],
      },
    ]);
    writeFileSync(xlsxPath, xlsx);
  }

  return {
    reviewRows,
    catalogRows,
    selection,
    paths: { xlsx: xlsxPath, reviewCsv: reviewCsvPath, catalogCsv: catalogCsvPath },
  };
}
