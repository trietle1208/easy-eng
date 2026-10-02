# Quality gate (Phase 6)

Generated: 2026-10-02T09:55:20.365Z

## Summary

| Metric | Value |
|---|---:|
| Decided rows | 904 |
| Fixes applied | 4 |
| Dropped | 5 |
| Catalog kept | 2995 |
| Sample size | 371 |
| Sample fix\|drop | 3 |
| **Error rate** | **0.81%** |
| Band | `accept` |
| Accept ≤ | 3.00% |
| Warn ≤ | 8.00% |

## By level (sample only)

| Level | Sample | fix\|drop | Error rate |
|---|---:|---:|---:|
| A1 | 71 | 1 | 1.41% |
| A2 | 112 | 0 | 0.00% |
| B1 | 113 | 2 | 1.77% |
| B2 | 75 | 0 | 0.00% |

## Error / comment types (sample fix\|drop)

| Note | Count |
|---|---:|
| awkward_vi_and_ungrammatical_def | 1 |
| boilerplate_mot_cach | 1 |
| sensitive_terrorism | 1 |

## Band meaning

- `accept` (≤3%): unreviewed remainder may stay `ai_checked` and publish.
- `warn` (3–8%): propose prompt/rule changes; re-run Phases 4–5 for affected slices; second sample 10%.
- `stop` (>8%): stop and report root causes.
