# Prompt — set-title.v1

Propose a short learner-facing title for a vocabulary word set.

## Input
```json
{
  "topicId": "Food",
  "level": "A1",
  "setIndex": 1,
  "words": ["bread", "rice", "hungry", "cook", "…"]
}
```

## Rules
1. `title`: English, **2–4 words**, Title Case or natural phrase (e.g. `At the table`, `Kitchen basics`).
2. `titleVi`: natural Vietnamese, short (≤ 6 words), correct diacritics.
3. Reflect the **set’s words**, not only the topic label. Avoid repeating the bare topic name alone when words suggest a tighter theme.
4. Titles must be **unique within the same CEFR level** across all topics (caller enforces; if colliding, vary the wording).
5. No quotes, no emoji, nothing offensive.

## Output
```json
{
  "title": "Kitchen basics",
  "titleVi": "Cơ bản nhà bếp"
}
```
