# Atlas InternAI – Architecture Guide

## Overview

Atlas InternAI is an event-driven, plugin-based autonomous internship intelligence platform designed for high scalability and zero-cost operation.

---

## 1. Domain Data Pipeline

The pipeline implements strict stage isolation:

```
[CollectedPage] (Raw HTTP/HTML/RSS payload)
       ↓
[RawInternship] (Plugin parsed fields)
       ↓
[CanonicalInternship] (ISO dates, sanitized URLs, MD5 hashes, normalized stipends)
       ↓
[Database Entity] (Supabase PostgreSQL normalized tables)
```

### Key Principles:
- **Plugin Independence**: Plugins produce `RawInternship` models and do not interact directly with database schemas.
- **Deterministic Deduplication**: Fast check using canonicalized URL hashing (`canonical_url`) and content MD5 fingerprinting (`content_hash`).
- **AI Scoping**: Gemini API is strictly limited to complex extraction fallbacks, resume qualitative matching, summary generation, and ranking explanations.

---

## 2. Plugin Ecosystem (`SourcePlugin`)

All source collectors inherit from the `SourcePlugin` contract:

```typescript
export interface SourcePlugin {
  id: string;
  name: string;
  supports(url: string): boolean;
  discover(sourceUrl: string): Promise<string[]>;
  collect(url: string): Promise<CollectedPage>;
  normalize(page: CollectedPage): Promise<RawInternship[]>;
  healthCheck(sourceUrl: string): Promise<boolean>;
}
```

---

## 3. Dynamic Weighted Ranking Engine

The ranking score formula evaluates:

$$ \text{Score} = w_{\text{resume}} S_{\text{resume}} + w_{\text{company}} S_{\text{company}} + w_{\text{growth}} S_{\text{growth}} + w_{\text{deadline}} S_{\text{deadline}} + w_{\text{stipend}} S_{\text{stipend}} $$

Weights and user priorities (e.g. `prefer_government`, `prefer_remote`, `prefer_high_stipend`, `target_domains`) are read dynamically from the `preferences` database table without requiring code deployments.
