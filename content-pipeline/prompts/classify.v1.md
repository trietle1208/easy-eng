# Prompt — classify.v1

Classify each English headword into exactly one topic from the Easy English taxonomy.

## Input
A JSON array of items: `{ "id", "word", "partOfSpeech", "level" }`.

## Taxonomy
Use only these `topicId` values (exact strings from `content/topics.json`):

{{TOPICS_BLOCK}}

## Rules
1. Choose the topic where a learner would most naturally meet **this sense** of the word at this part of speech.
2. Prepositions, conjunctions, and interjections → `Grammar words` (also discourse markers like *however*, *therefore*).
3. If nothing fits well → `Daily life` with **low** confidence (≤ 0.5). Never invent a topic.
4. Prefer a specific topic over Daily life when reasonable (Food, Travel, Health, …).
5. Multi-word phrases: classify by the phrase’s usual domain (`bank account` → Shopping, `according to` → Grammar words).

## Output
JSON array, same order/length as input. Each item:

```json
{
  "id": "w-…",
  "topicId": "Food",
  "confidence": 0.85,
  "reason": "≤10 words"
}
```

- `topicId` must be one of the taxonomy ids
- `confidence` is 0–1
- `reason` ≤ 10 words, English
