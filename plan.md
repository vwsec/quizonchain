# Pre-Generated Quizzes — Implementation Plan

## Overview

Replace on-demand LLM quiz generation with a pre-generated pool served from a static JSON file. Quizzes are generated locally by Hermes Agent, pushed to the app, and served to all wallets from a shared sequential pool. Progress per wallet is tracked by a simple counter in Upstash Redis that increments only on successful verify. No API calls at request time.

---

## Phase 1: Pool Files

### 1.1 Per-ecosystem pool files

Each chain gets its own pool file:

```
data/quizzes-litvm.json       # LitVM
data/quizzes-base.json         # Base
data/quizzes-ink.json          # Ink
data/quizzes-soneium.json      # Soneium
data/quizzes-unichain.json     # Unichain
data/quizzes-megaeth.json      # MegaETH
data/quizzes-arc.json          # Arc Testnet
```

The `generate-quiz` endpoint selects the file by `chainId` — same mapping already exists. If a chain's pool file doesn't exist, fallback to hardcoded questions.

### 1.2 Pool size

**1,000 questions per chain.** At 5 questions per session that's 200 sessions per user before repeat. When the dashboard shows a pool running low, Hermes generates a fresh 1,000-question batch.

### 1.3 Pool file format

File: `data/quizzes-{ecosystem}.json`

```json
{
  "meta": {
    "ecosystem": "LitVM",
    "batchId": "litvm-2026-07-09-001",
    "generatedAt": "2026-07-09T12:00:00Z",
    "totalQuizzes": 1000,
    "questionsPerSession": 5
  },
  "quizzes": [
    {
      "id": 0,
      "question": "What is the chain ID of LitVM?",
      "options": ["4441", "8453", "1", "137"],
      "correctIndex": 0
    }
  ]
}
```

- `correctIndex` is 0-3 — the server shuffles options at serving time and updates the index accordingly
- `batchId` tracks which batch is active

### 1.4 New batch = overwrite + reset

When a new batch is needed:
1. Overwrite the same `data/quizzes-{ecosystem}.json` file with fresh questions
2. Reset all wallet counters for that chain back to 0
3. Simple. No auto-detection, no versioning.

---

## Phase 2: Wallet Progress Tracking — Upstash Redis

**File-based tracking doesn't work on Vercel** (no persistent filesystem). Use Upstash Redis through the Vercel Marketplace.

Setup:
1. Install **Upstash Redis** from Vercel Marketplace → free database created
2. Environment variables auto-injected
3. Import and use in API routes:

```typescript
import { Redis } from '@upstash/redis'
const redis = Redis.fromEnv()

// On quiz fetch — read progress
const completed = await redis.get<number>(`progress:litvm:0xabc`) ?? 0

// On verify — increment atomically
await redis.incrby(`progress:litvm:0xabc`, 5)
```

**Why Redis fits:**
- Key `progress:{ecosystem}:{address}` → value `number`
- Atomic `INCRBY` — no race conditions, no lost writes
- ~5ms latency, HTTP-based, no connection pooling needed
- 500K free commands/month — 27x your traffic
- Survives deploys, cold starts, container swaps

---

## Phase 3: Submission Flow (with signature + dedup)

### 3.1 The three problems this solves

| Problem | Solution |
|---------|----------|
| Anyone can fake a wallet address | Wallet must sign a message to prove ownership |
| Two tabs submitting the same questions | Dedup: mark startIndex as used per wallet |
| Bad actor advancing someone else's counter | Signature proves you own the address you claim |

### 3.2 Full trace: Wallet 0xabc first visit

```
Step 1: User clicks "Start Quiz"
  → Frontend reads address from wagmi useAccount()
  → GET /api/generate-quiz?chainId=4441&address=0xabc

Step 2: Server reads progress from Redis
  → redis.get("progress:litvm:0xabc") = 0
  → Picks quizzes[0], [1], [2], [3], [4]

Step 3: Server shuffles options, builds JWT
  → JWT payload: { answers: [correctIndices], address: "0xabc", startIndex: 0, chainId: 4441 }
  → Returns { questions (without correctIndex), quizToken }

Step 4: Frontend asks wallet to sign a message
  → Message: "QuizonChain:4441:0"
  → User approves in wallet → signature is "0x..."
  → User answers questions

Step 5: User submits
  → POST /api/verify-quiz { answers: [2,0,3,1,2], quizToken, signature }

Step 6: Server verifies signature
  → viem verifyMessage({ address: "0xabc", message: "QuizonChain:4441:0", signature })
  → If fails → reject (not the real wallet owner)

Step 7: Server checks dedup
  → redis.exists("submitted:litvm:0xabc:0")
  → If exists → reject (already used this session)
  → If not → redis.set("submitted:litvm:0xabc:0", true)

Step 8: Server scores and advances counter
  → Compare answers → score = 4/5
  → redis.incrby("progress:litvm:0xabc", 5)
  → Return score
```

### 3.3 The dedup key

Key: `submitted:{ecosystem}:{address}:{startIndex}` → `true` (with 24h TTL)

This prevents both tab races and replay attacks. Even if someone captures the JWT and signature, they can't submit the same session twice.

### 3.4 Pool exhaustion

When `progress[address] >= poolQuizzes`:
- If this chain has a pool file → wrap around: reset counter to 0
- User sees same questions with different option order

---

## Phase 4: App Changes

### 4.1 Generate-quiz route changes

Current: LLM pipeline (Jina fetch → Groq → parse → validate)
New flow:
1. Read pool file by chainId
2. Read wallet progress from Redis → startIndex
3. Pick 5 consecutive quizzes: `[startIndex, startIndex+4]`
4. Shuffle options on each (existing `shuffleOptions`)
5. Build JWT with `{ answers, address, startIndex, chainId }`
6. Return questions + quizToken

Fallback: if pool file missing → return hardcoded questions.

### 4.2 Verify-quiz route changes

New flow:
1. Decode JWT → get `answers`, `address`, `startIndex`, `chainId`
2. Verify signature: recover signer from `"QuizonChain:{chainId}:{startIndex}"` and match against JWT `address`
3. Dedup check: `submitted:{ecosystem}:{address}:{startIndex}` exists?
4. Compare submitted vs correct answers → score
5. Mark dedup key
6. `redis.incrby("progress:{ecosystem}:{address}", 5)`
7. Return score

### 4.3 Frontend changes

In `HomeContent.tsx`:

```typescript
// 1. Pass address to generate endpoint
const res = await fetch(`/api/generate-quiz?chainId=${chainId}&address=${address}`)

// 2. After receiving quiz, sign message with wallet
const message = `QuizonChain:${chainId}:${startIndex}`
const signature = await signMessageAsync({ message })

// 3. Include signature in verify request
const res = await fetch("/api/verify-quiz", {
  method: "POST",
  body: JSON.stringify({ quizToken, answers, signature }),
})
```

### 4.4 Dashboard

File: `app/admin/quizzes/page.tsx`

Shows:
- Active batch per chain (batchId from pool file)
- Pool size per chain
- Highest wallet index per chain
- Total wallets tracked per chain
- Quizzes remaining per chain
- Auto-recycle status

Auth: simple password check. Admin visits the page, enters the password (from env var `DASHBOARD_PASSWORD`), sees the data.

---

## Phase 5: Generation Workflow

### 5.1 Manual generation via Hermes

No validator script. Each batch is generated by Hermes Agent:
1. User tells Hermes: "generate 1,000 quizzes for {chain}"
2. Hermes fetches chain docs, generates questions, validates format
3. User reviews the output
4. Writes to `data/quizzes-{chain}.json`

### 5.2 Batch cycle

```
1. Dashboard shows pool running low (e.g. 50 remaining)
2. User asks Hermes to generate 1,000 fresh questions for that chain
3. User pushes the updated pool file
4. All counters for that chain reset to 0
5. Users start fresh with new questions
```

---

## Phase 6: Files to Create / Modify

### New files

| File | Purpose |
|---|---|
| `data/quizzes-*.json` | Quiz pool per chain (created as needed) |
| `lib/redis.ts` | Upstash Redis client singleton |
| `app/admin/quizzes/page.tsx` | Usage dashboard (password-protected) |

### Modified files

| File | Change |
|---|---|
| `app/api/generate-quiz/route.ts` | Serve from pool file instead of calling LLM. Accept `address` param. Embed address + startIndex in JWT. Read progress from Redis. |
| `app/api/verify-quiz/route.ts` | Verify wallet signature. Check dedup. Increment wallet progress in Redis. |
| `app/HomeContent.tsx` | Pass `address` query param. Sign message before submitting. Send signature with verify request. |
| `lib/quiz-data.ts` | Add types for pool format (PoolMeta, PoolQuiz). |
| `package.json` | Add `@upstash/redis` dependency. |

### Not modified

| Unchanged | Reason |
|---|---|
| `app/api/sign-score/route.ts` | Unrelated — on-chain scoring stays as-is |
| `app/api/telegram/route.ts` | Unrelated |
| `app/api/feedback/route.ts` | Unrelated |
| All UI components (QuizScreen, ResultsScreen, etc.) | No changes needed |

---

## Phase 7: Edge Cases & Risks

| Risk | Mitigation |
|---|---|
| Pool file too large (Vercel 10MB limit) | 1,000 quizzes ≈ ~200KB. Even 5,000 is < 1MB. No issue. |
| Redis free tier 500K commands/month | At 300 users/day = ~18K commands/month. Headroom for 27x growth. |
| Two tabs open, same startIndex submitted twice | Dedup key blocks the second submission. Counter only moves once. |
| User closes tab mid-quiz | Counter unchanged. Same questions served next time. No permanent skip. |
| Redis goes down | Fallback: serve from pool file without per-wallet tracking (use index 0 for everyone). |
| Docs change → old answers wrong | Generate fresh batch. Overwrite file. Reset counters. |
| Bad actor fakes wallet address | Signature verification at submit time prevents this. Only real wallet owners can advance their counter. |
| Pool file missing at deploy time | Fallback to hardcoded questions (already exists as `getFallbackQuestions`). |
| User submits same session twice (replay) | Dedup key with 24h TTL. Same signature + same startIndex = rejected. |

---

## Priority Order

1. **Install Upstash Redis + create `lib/redis.ts`**
2. **Define pool types in `lib/quiz-data.ts`**
3. **Modify `generate-quiz` route** — read from pool file, read Redis progress, embed address + startIndex in JWT
4. **Modify `HomeContent.tsx`** — pass address, sign message, send signature
5. **Modify `verify-quiz` route** — verify signature, check dedup, increment Redis
6. **Build dashboard** — read pool + Redis, password-protected
7. **Generate first batch** — Hermes generates 1,000 LitVM quizzes
