import type { PartOfSpeech } from "./types";

type Hit = { topicId: string; confidence: number; reason: string };

/** Suffix / whole-word patterns for untagged lemmas. */
export function patternClassify(
  word: string,
  pos: PartOfSpeech,
): Hit | null {
  const w = word.toLowerCase();

  // Colors
  if (
    /^(black|white|red|blue|green|yellow|brown|grey|gray|pink|orange|purple|gold|golden|silver)$/.test(
      w,
    )
  ) {
    return { topicId: "Appearance", confidence: 0.9, reason: "color word" };
  }

  // Clear adjective domains
  if (pos === "adjective") {
    const rules: Array<[RegExp, string, string, number]> = [
      [/^(medical|ill|sick|healthy|fit|allergic|pregnant|mental|physical)$/, "Health", "health adj", 0.88],
      [/^(academic|educational|elementary|literary|historical|scientific|intellectual)$/, "School", "school adj", 0.88],
      [/^(electric|electronic|automatic|mechanical|digital|mobile|nuclear|technical|hand-held)$/, "Technology", "tech adj", 0.85],
      [/^(financial|commercial|corporate|economic|industrial|professional|full-time|part-time|well-paid|administrative)$/, "Work", "work adj", 0.85],
      [/^(environmental|agricultural|rural|urban|organic|global|natural)$/, "Nature", "nature adj", 0.85],
      [/^(cultural|democratic|civil|federal|military|religious|political|legal|illegal|ethnic|colonial|royal)$/, "Society", "society adj", 0.85],
      [/^(musical|classical|narrative|romantic|visual|dramatic)$/, "Media", "media adj", 0.8],
      [/^(married|aged|elderly|female|male|grown-up|middle-aged|pregnant)$/, "People", "people adj", 0.85],
      [/^(emotional|confused|concerned|surprised|surprising|sorry|bad-tempered|heart-warming|self-confident|easy-going|devoted|determined)$/, "Feelings", "feelings adj", 0.82],
      [/^(dressed|good-looking|well-dressed|well-built|old-fashioned|brand-new)$/, "Appearance", "appearance adj", 0.85],
      [/^(half-price|duty-free|second-hand|self-service)$/, "Shopping", "shopping adj", 0.88],
      [/^(first-floor|next-door|domestic)$/, "Home", "home adj", 0.8],
      [/^(international|long-distance|last-minute)$/, "Travel", "travel adj", 0.75],
      [/^(christian|holy|divine|spiritual)$/, "Society", "religion adj", 0.8],
      [/^(interesting|nice|pleasant|terrible|excellent|perfect|wonderful|awful|fantastic)$/, "Feelings", "evaluative feeling", 0.7],
    ];
    for (const [re, topic, reason, conf] of rules) {
      if (re.test(w)) return { topicId: topic, confidence: conf, reason };
    }
    if (/(?:ical|ological)$/.test(w) && /(?:bio|chem|phys|geo|psych|soci)/.test(w)) {
      return { topicId: "School", confidence: 0.75, reason: "academic -ical" };
    }
  }

  if (pos === "verb") {
    const rules: Array<[RegExp, string, string, number]> = [
      [/^(eat|drink|cook|bake|boil|fry|grill|taste|chew|swallow|serve)$/, "Food", "food verb", 0.9],
      [/^(run|swim|jump|kick|throw|catch|score|train|compete|race|ski|skate|climb|hike)$/, "Sports", "sport verb", 0.88],
      [/^(fly|travel|drive|ride|sail|land|depart|arrive|board|pack)$/, "Travel", "travel verb", 0.85],
      [/^(teach|study|learn|read|write|calculate|examine|graduate)$/, "School", "school verb", 0.85],
      [/^(heal|cure|treat|bleed|cough|sneeze|injure|recover)$/, "Health", "health verb", 0.85],
      [/^(buy|sell|pay|spend|cost|charge|refund|owe|borrow|lend)$/, "Shopping", "money verb", 0.88],
      [/^(hire|fire|resign|retire|manage|employ|negotiate|promote)$/, "Work", "work verb", 0.88],
      [/^(love|hate|fear|worry|enjoy|prefer|hope|wish|trust|doubt)$/, "Feelings", "feeling verb", 0.85],
      [/^(speak|talk|tell|ask|answer|listen|whisper|shout|translate|announce)$/, "Communication", "comms verb", 0.85],
      [/^(marry|divorce|date|adopt|birth)$/, "People", "people verb", 0.85],
      [/^(clean|wash|sweep|mop|iron|decorate|repair|paint)$/, "Home", "home verb", 0.8],
      [/^(download|upload|install|click|type|code|program|hack)$/, "Technology", "tech verb", 0.85],
      [/^(sing|act|film|publish|broadcast|record)$/, "Media", "media verb", 0.8],
      [/^(vote|elect|govern|arrest|punish|protest)$/, "Society", "society verb", 0.85],
      [/^(rain|snow|blow|shine|grow|plant|bloom)$/, "Nature", "nature verb", 0.85],
      [/^(wear|dress|undress|shave)$/, "Appearance", "clothes verb", 0.85],
    ];
    for (const [re, topic, reason, conf] of rules) {
      if (re.test(w)) return { topicId: topic, confidence: conf, reason };
    }
  }

  if (pos === "adverb") {
    if (
      /^(happily|sadly|angrily|nervously|proudly|gladly|eagerly|anxiously|calmly|bitterly)$/.test(
        w,
      )
    ) {
      return { topicId: "Feelings", confidence: 0.8, reason: "emotion adverb" };
    }
    if (/^(online|offline|digitally)$/.test(w)) {
      return { topicId: "Technology", confidence: 0.85, reason: "tech adverb" };
    }
    // Place / time discourse → Daily life with mid confidence (not low)
    if (
      /^(above|below|behind|before|after|along|away|down|up|here|there|inside|outside|nearby|ahead|abroad)$/.test(
        w,
      )
    ) {
      return { topicId: "Daily life", confidence: 0.75, reason: "place/time adverb" };
    }
    if (/^(also|almost|always|never|often|usually|sometimes|already|still|yet|even|just|only|quite|rather|very|too|enough|really|actually|probably|perhaps|maybe|however|therefore|moreover)$/.test(w)) {
      if (/^(however|therefore|moreover)$/.test(w)) {
        return { topicId: "Grammar words", confidence: 0.9, reason: "discourse marker" };
      }
      return { topicId: "Daily life", confidence: 0.72, reason: "common adverb" };
    }
  }

  // Noun leftovers
  if (pos === "noun" || pos === "phrase") {
    if (/ism$/.test(w)) {
      return { topicId: "Society", confidence: 0.65, reason: "-ism noun" };
    }
  }

  return null;
}
