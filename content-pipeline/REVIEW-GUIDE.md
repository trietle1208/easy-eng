# Hướng dẫn review từ vựng (Phase 6)

File này dành cho người điền sheet `work/review-sheet.xlsx` (hoặc CSV UTF-8 BOM).

## Mục tiêu

Chỉ quyết định trên các dòng trong sheet **review**. Sheet **catalog** chỉ để xem, không điền.

Mỗi dòng đã quyết định → `reviewStatus = human_reviewed` sau khi import. Dòng để trống `decision` → giữ nguyên (`ai_checked` / `needs_human`), **không** bị đánh dấu đã review.

## Cột cần điền

| Cột | Giá trị |
|---|---|
| `decision` | `ok` · `fix` · `drop` (dropdown trong Excel) |
| `fixed_*` | Chỉ khi `decision = fix` — điền phần cần sửa; cột trống = giữ bản gốc |
| `comment` | Ghi ngắn lý do (bắt buộc hữu ích khi `fix` / `drop`) |

Các cột còn lại chỉ đọc.

## Checklist từng trường

1. **meaningVi** — Có dấu tiếng Việt đúng; khớp `pos`; 1–2 nghĩa cốt lõi; không lẫn tiếng Anh; không dài dòng giải thích.
2. **definitionEn** — ≤ 15 từ; không chứa headword; từ vựng không vượt level quá nhiều (LEVEL_LEAK chỉ là cảnh báo — nếu câu vẫn dạy được cho level đó thì có thể `ok`).
3. **examples** — 2 câu tự nhiên; có headword (hoặc dạng chia); bản dịch Việt tự nhiên; không tên người/thương hiệu thật; không nội dung nhạy cảm.
4. **ipa** — Nếu trống (`warning:IPA_MISSING`): có thể `ok` + comment `ipa_missing` (sẽ xử lý sau) hoặc `fix` nếu muốn đề xuất IPA trong comment (IPA không có cột fixed — ghi comment).
5. **level / topic** — Nghĩa và ví dụ có phù hợp level không; topic có “lạc” quá không (low_confidence).
6. **An toàn** — Không nội dung phản cảm / kỳ thị / tự hại. Cờ `warning:BANNED` hoặc headword nhạy cảm → đọc kỹ; `drop` nếu không phù hợp catalog học.

## Ví dụ quyết định

### ok
Nghĩa đúng, ví dụ ổn, chỉ có cảnh báo LEVEL_LEAK nhẹ.

```
decision = ok
comment  = (trống hoặc "level_leak_ok")
```

### fix
Sai nghĩa / dịch máy / ví dụ gượng.

```
decision          = fix
fixed_meaningVi   = mua, mua sắm
fixed_example1_vi = Tôi muốn mua một chiếc áo mới.
comment           = meaning_vi_diacritics
```

Chỉ cần điền các `fixed_*` thực sự đổi; phần còn lại để trống.

### drop
Không nên có trong catalog (nhạy cảm, lỗi POS không sửa được, trùng ý vô ích).

```
decision = drop
comment  = sensitive_headword
```

Từ `drop` bị xóa khỏi `validated.jsonl` và ghi vào `review-dropped.jsonl`. Phase 6 sẽ bù quota từ skeleton nếu cần.

## Cột `flags` / `inclusion`

- `needs_human`, `warning:…`, `low_confidence:…`, `error:…`, `ai:…` — lý do bắt buộc vào sheet.
- `sample` — nằm trong mẫu ngẫu nhiên phân tầng (≥15% phần còn lại).
- `inclusion = must` — bắt buộc review; `sample` — dùng tính **error rate** (quality gate).

## Quality gate (chỉ trên `inclusion = sample`)

`error rate = (fix + drop) / số dòng sample`

| Tỷ lệ | Hành động |
|---|---|
| ≤ 3% | Chấp nhận; phần chưa review giữ `ai_checked` |
| 3–8% | Báo cáo + đề xuất sửa prompt/rule; chạy lại Phase 4–5 vùng lỗi; sample thêm 10% |
| > 8% | Dừng, phân tích nguyên nhân gốc |

## Cách nộp

1. Điền sheet → Save as CSV UTF-8 (hoặc giữ XLSX rồi export CSV sheet `review`).
2. `pnpm content:import-review -- path/to/filled.csv`
3. Script từ chối nếu: id lạ, `decision` sai, `fix` mà không có `fixed_*`, ví dụ chỉ sửa một phía en/vi.

Không import database ở phase này.
