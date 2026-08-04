# Atlas InternAI – Database Schema Reference

## PostgreSQL Entity-Relationship Overview

The database is built on Supabase PostgreSQL with strict foreign keys, indexes, and normalized tables.

---

## Table Specifications

### 1. `sources`
Stores target crawl locations, plugin mapping, and rate limits.
- `id` (UUID, Primary Key)
- `name` (VARCHAR)
- `type` (GOVT, UNIVERSITY, CORPORATE, GITHUB, RSS, SITEMAP, PUBLIC_API, DIRECTORY)
- `url` (TEXT, Unique)
- `plugin_id` (VARCHAR)
- `requests_per_minute` (INTEGER, Default: 30)
- `max_concurrency` (INTEGER, Default: 2)
- `crawl_delay_ms` (INTEGER, Default: 2000)

### 2. `internships`
Central storage for normalized and ranked opportunities.
- `id` (UUID, Primary Key)
- `title` (VARCHAR)
- `company_id` (FK -> companies.id)
- `apply_url` (TEXT)
- `canonical_url` (TEXT, Unique Index)
- `content_hash` (VARCHAR, Unique Index)
- `overall_score` (NUMERIC)
- `status` (DISCOVERED, NORMALIZED, ENRICHED, MATCHED, RANKED, NOTIFIED, ARCHIVED)

### 3. `preferences`
Stores dynamic weight configurations and user priorities.
- `key` (VARCHAR, Unique)
- `value_json` (JSONB)

### 4. `observability_metrics`
Tracks operational performance metrics.
- `metric_name` (VARCHAR)
- `metric_value` (NUMERIC)
- `tags_json` (JSONB)
- `recorded_at` (TIMESTAMPTZ)
