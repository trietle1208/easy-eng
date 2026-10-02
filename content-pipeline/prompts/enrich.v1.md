# Prompt — enrich.v1

Enrich English vocabulary entries for **Easy English**: Vietnamese adult learners (CEFR A1–B2).

Audience: adults learning English in Vietnam. Meanings and example translations must be natural Vietnamese (correct diacritics), not word-for-word calques. Examples should feel like everyday adult life (work, family, travel, study) — not children’s textbook fluff.

## Input
A JSON array of items:

```json
{
  "id": "w-…",
  "word": "headword",
  "partOfSpeech": "noun|verb|…",
  "level": "A1|A2|B1|B2",
  "topicId": "Travel",
  "ipa": "/…/" or null,
  "altSpelling": "colour" or null
}
```

Process **every** input id. Output **exactly one** object per input id — no missing ids, no extra ids.

## Output
JSON array (same length as input). Each item:

```json
{
  "id": "w-…",
  "meaningVi": "…",
  "definitionEn": "…",
  "examples": [
    { "en": "…", "vi": "…" },
    { "en": "…", "vi": "…" }
  ],
  "collocations": ["…", "…"] ,
  "notes": null
}
```

- `collocations`: 2–4 genuinely common phrases, **or** `null` if none fit naturally.
- `notes`: short learner tip **or** `null`. If `altSpelling` is set, mention UK/US spelling in notes when useful. Add irregular forms / false friends / typical VN-learner mistakes only when useful.

## Specification (must follow)

### meaningVi
- Vietnamese with correct diacritics.
- 1–2 core meanings that match the given **part of speech**.
- No English words inside.
- One line max.

### definitionEn
- ≤ **15** English words.
- Does **not** contain the headword (or obvious same-stem form).
- Uses only vocabulary at or below the word’s CEFR level.

### examples
- Exactly **2**, each with `en` and `vi`.
- Word count in `en`: **5–12** words for A1–A2; **≤ 16** for B1–B2.
- Natural everyday sentences; contain the headword in any inflected form.
- No real people’s names, no brands, nothing offensive or sensitive.
- Vietnamese translation is natural, not word-for-word.

### collocations
- 2–4 common collocations, or `null`.

### notes
- Only when useful (false friends for Vietnamese speakers, typical mistakes, UK/US difference, irregular forms); otherwise `null`.

### Sense / POS
- Match the given part of speech and primary everyday sense for that topic.
- For multi-word entries, treat the whole phrase as the unit.

## Few-shot examples (DRAFT — awaiting human approval)

> Status: **draft**. Do not treat as gold until approved. Marked `APPROVAL_NEEDED` in notes below.

### A1 drafts

**1. gate (noun) · Travel · A1**

```json
{
  "id": "example-a1-gate",
  "meaningVi": "cổng (sân bay)",
  "definitionEn": "the place where passengers board the plane",
  "examples": [
    { "en": "Our flight leaves from gate 12.", "vi": "Chuyến bay của chúng ta khởi hành từ cổng 12." },
    { "en": "Please wait at the gate.", "vi": "Vui lòng đợi ở cổng." }
  ],
  "collocations": ["boarding gate", "departure gate"],
  "notes": "APPROVAL_NEEDED · airport sense (not garden gate)"
}
```

**2. water (noun) · Food · A1**

```json
{
  "id": "example-a1-water",
  "meaningVi": "nước",
  "definitionEn": "the clear liquid people drink",
  "examples": [
    { "en": "Can I have a glass of water?", "vi": "Cho mình một cốc nước được không?" },
    { "en": "Please drink more water today.", "vi": "Hôm nay nhớ uống nhiều nước hơn nhé." }
  ],
  "collocations": ["a glass of water", "bottled water", "drink water"],
  "notes": "APPROVAL_NEEDED"
}
```

**3. go (verb) · Travel · A1**

```json
{
  "id": "example-a1-go",
  "meaningVi": "đi",
  "definitionEn": "to move or travel to a place",
  "examples": [
    { "en": "I go to work by bus.", "vi": "Tôi đi làm bằng xe buýt." },
    { "en": "Shall we go home now?", "vi": "Chúng ta về nhà luôn nhé?" }
  ],
  "collocations": ["go home", "go to work", "go by bus"],
  "notes": "APPROVAL_NEEDED · irregular: go / went / gone"
}
```

### A2 drafts

**4. boarding pass (phrase) · Travel · A2**

```json
{
  "id": "example-a2-boarding-pass",
  "meaningVi": "thẻ lên máy bay",
  "definitionEn": "a document that lets you board a plane",
  "examples": [
    { "en": "Please show your boarding pass at the gate.", "vi": "Vui lòng xuất trình thẻ lên máy bay tại cổng." },
    { "en": "I lost my boarding pass at the café.", "vi": "Mình làm mất thẻ lên máy bay ở quán cà phê." }
  ],
  "collocations": ["show your boarding pass", "print a boarding pass"],
  "notes": "APPROVAL_NEEDED · multi-word phrase"
}
```

**5. choose (verb) · Daily life · A2**

```json
{
  "id": "example-a2-choose",
  "meaningVi": "chọn",
  "definitionEn": "to pick one thing from several options",
  "examples": [
    { "en": "You can choose a seat online.", "vi": "Bạn có thể chọn chỗ ngồi trực tuyến." },
    { "en": "It is hard to choose a gift.", "vi": "Chọn quà thì hơi khó." }
  ],
  "collocations": ["choose carefully", "hard to choose", "choose between"],
  "notes": "APPROVAL_NEEDED · irregular: choose / chose / chosen"
}
```

**6. busy (adjective) · Work · A2**

```json
{
  "id": "example-a2-busy",
  "meaningVi": "bận, bận rộn",
  "definitionEn": "having a lot of things to do",
  "examples": [
    { "en": "Sorry, I am busy this afternoon.", "vi": "Xin lỗi, chiều nay mình bận." },
    { "en": "The café is busy on weekends.", "vi": "Cuối tuần quán cà phê lúc nào cũng đông." }
  ],
  "collocations": ["busy day", "keep busy", "too busy"],
  "notes": "APPROVAL_NEEDED"
}
```

### B1 drafts

**7. delay (noun) · Travel · B1**

```json
{
  "id": "example-b1-delay",
  "meaningVi": "sự chậm trễ, trì hoãn",
  "definitionEn": "a period when something happens later than planned",
  "examples": [
    { "en": "There was a two-hour delay on the train.", "vi": "Tàu bị chậm hai tiếng." },
    { "en": "Sorry for the delay in my reply.", "vi": "Xin lỗi vì trả lời chậm." }
  ],
  "collocations": ["flight delay", "without delay", "cause a delay"],
  "notes": "APPROVAL_NEEDED"
}
```

**8. responsible (adjective) · Work · B1**

```json
{
  "id": "example-b1-responsible",
  "meaningVi": "chịu trách nhiệm; đáng tin cậy",
  "definitionEn": "having a duty to take care of something or someone",
  "examples": [
    { "en": "She is responsible for the new project.", "vi": "Cô ấy chịu trách nhiệm cho dự án mới." },
    { "en": "Please be responsible with shared files.", "vi": "Hãy dùng file dùng chung một cách có trách nhiệm." }
  ],
  "collocations": ["responsible for", "feel responsible", "highly responsible"],
  "notes": "APPROVAL_NEEDED · false friend: not the same as ‘response’"
}
```

**9. bank account (phrase) · Shopping · B1**

```json
{
  "id": "example-b1-bank-account",
  "meaningVi": "tài khoản ngân hàng",
  "definitionEn": "an arrangement with a bank to keep and move money",
  "examples": [
    { "en": "I opened a bank account last month.", "vi": "Tháng trước mình mở tài khoản ngân hàng." },
    { "en": "Please transfer the fee to my bank account.", "vi": "Nhờ chuyển phí vào tài khoản ngân hàng của mình." }
  ],
  "collocations": ["open a bank account", "bank account number", "joint bank account"],
  "notes": "APPROVAL_NEEDED · multi-word"
}
```

### B2 drafts

**10. significantly (adverb) · Daily life · B2**

```json
{
  "id": "example-b2-significantly",
  "meaningVi": "một cách đáng kể, rõ rệt",
  "definitionEn": "in a way that is large enough to be important",
  "examples": [
    { "en": "Costs have risen significantly this year.", "vi": "Chi phí năm nay tăng đáng kể." },
    { "en": "Her health improved significantly after rest.", "vi": "Sau khi nghỉ ngơi, sức khỏe cô ấy khá hơn rõ rệt." }
  ],
  "collocations": ["significantly higher", "increase significantly", "differ significantly"],
  "notes": "APPROVAL_NEEDED"
}
```

**11. colleague (noun) · Work · B2**

```json
{
  "id": "example-b2-colleague",
  "meaningVi": "đồng nghiệp",
  "definitionEn": "a person you work with in a job or office",
  "examples": [
    { "en": "I discussed the plan with a colleague.", "vi": "Tôi bàn kế hoạch với một đồng nghiệp." },
    { "en": "My colleagues helped me finish on time.", "vi": "Đồng nghiệp đã giúp tôi hoàn thành đúng hạn." }
  ],
  "collocations": ["close colleague", "former colleague", "discuss with a colleague"],
  "notes": "APPROVAL_NEEDED · not the same as ‘classmate’"
}
```

**12. overlook (verb) · Daily life · B2**

```json
{
  "id": "example-b2-overlook",
  "meaningVi": "bỏ sót, không để ý; nhìn ra (cảnh)",
  "definitionEn": "to fail to notice something, or to have a view of a place",
  "examples": [
    { "en": "Do not overlook the small print in contracts.", "vi": "Đừng bỏ sót phần chữ nhỏ trong hợp đồng." },
    { "en": "Our room overlooks the quiet street.", "vi": "Phòng chúng tôi nhìn ra con phố yên tĩnh." }
  ],
  "collocations": ["easily overlook", "overlook a detail", "room overlooks"],
  "notes": "APPROVAL_NEEDED · two common senses; keep both short"
}
```

## Quality checklist (before returning)
1. Every input `id` present exactly once.
2. `definitionEn` ≤ 15 words and does not contain the headword.
3. Exactly 2 examples; length rules by level; headword (or inflection) in each `en`.
4. Vietnamese has diacritics where needed; no English inside `meaningVi`.
5. No brands, real names, or sensitive content.
