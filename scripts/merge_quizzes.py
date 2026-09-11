#!/usr/bin/env python3
"""Merge chain quiz chunks, verify each correct answer against the fetched
corpus (hallucination guard), dedupe, rebalance correctIndex, emit pool.

Usage:
  python3 merge_quizzes.py --chain ink \
    --corpus-dir /tmp/ink_corpus/text \
    --chunks-dir /tmp/ink_out \
    --pool-out data/quizzes-ink.json

The `fact` field each subagent attaches is a verbatim/near-verbatim excerpt
from its chunk. We assert the first ~60 normalized chars of `fact` appear in
the concatenated corpus; anything that fails is dropped (the subagent is NOT
trusted). This is what caught ~5% hallucinated answers in practice.
"""
import json, glob, os, re, random, argparse
from collections import Counter


def norm(s):
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9 ]", " ", s.lower())).strip()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--chain", required=True)
    ap.add_argument("--corpus-dir", required=True)
    ap.add_argument("--chunks-dir", required=True)
    ap.add_argument("--pool-out", required=True)
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--questions-per-session", type=int, default=5)
    ap.add_argument("--expected-chunks", type=int, default=12)
    args = ap.parse_args()
    random.seed(args.seed)

    # Load corpus (normalized) for fact verification.
    corpus_norm = " ".join(
        norm(open(f, encoding="utf-8").read())
        for f in glob.glob(os.path.join(args.corpus_dir, "*.txt"))
    )

    def fact_in_corpus(fact):
        return norm(fact)[:60] in corpus_norm

    allq, missing = [], []
    for i in range(args.expected_chunks):
        p = os.path.join(args.chunks_dir, f"chunk{i:02d}.json")
        if not os.path.exists(p):
            missing.append(i)
            continue
        try:
            data = json.load(open(p))
        except Exception:
            missing.append(i)
            continue
        if isinstance(data, list):
            allq.extend(data)
    print(f"loaded {len(allq)} questions; missing chunks: {missing}")

    def valid(q):
        if not isinstance(q, dict):
            return False
        if not isinstance(q.get("question"), str) or len(q["question"].strip()) < 6:
            return False
        opts = q.get("options")
        if not isinstance(opts, list) or len(opts) != 4:
            return False
        if any(not isinstance(o, str) or not o.strip() for o in opts):
            return False
        ci = q.get("correctIndex")
        if not isinstance(ci, int) or ci < 0 or ci > 3:
            return False
        return True

    kept, dropped_shape, dropped_fact = [], 0, 0
    for q in allq:
        if not valid(q):
            dropped_shape += 1
            continue
        if not fact_in_corpus(q.get("fact", "")):
            dropped_fact += 1
            continue
        kept.append(q)
    print(f"after shape+fact check: kept={len(kept)} "
          f"dropped_shape={dropped_shape} dropped_fact={dropped_fact}")

    # Dedupe by normalized question.
    seen, deduped = set(), []
    for q in kept:
        key = norm(q["question"])
        if key in seen:
            continue
        seen.add(key)
        deduped.append(q)
    print(f"after dedupe: {len(deduped)}")

    # Rebalance correctIndex to ~25% via uniform option permutation.
    def permute(q):
        opts = list(q["options"])
        order = list(range(4))
        random.shuffle(order)
        new_opts = [opts[i] for i in order]
        return {
            "question": q["question"].strip(),
            "options": [o.strip() for o in new_opts],
            "correctIndex": order.index(q["correctIndex"]),
        }

    balanced = [permute(q) for q in deduped]
    print("correctIndex distribution:",
          dict(sorted(Counter(q["correctIndex"] for q in balanced).items())))

    pool = {
        "meta": {
            "ecosystem": args.chain.capitalize(),
            "batchId": f"{args.chain}-merged",
            "generatedAt": "2026-08-19T00:00:00Z",
            "totalQuizzes": len(balanced),
            "questionsPerSession": args.questions_per_session,
        },
        "quizzes": [{"id": i, **q} for i, q in enumerate(balanced)],
    }
    os.makedirs(os.path.dirname(args.pool_out) or ".", exist_ok=True)
    with open(args.pool_out, "w") as f:
        json.dump(pool, f, indent=2, ensure_ascii=False)
    print(f"WROTE {args.pool_out} with {len(balanced)} quizzes")


if __name__ == "__main__":
    main()
