# RFC: Move Assessment Responses from Git to Cloudflare D1 + Dashboard Analytics

**Issue Title**: RFC: Move Assessment Responses from Git to Cloudflare D1 + Dashboard Analytics

---

## Summary

Currently, assessment form responses are stored as markdown files in Git and processed via GitHub Actions. This RFC proposes moving to **Cloudflare D1 (SQLite)** with real-time dashboard analytics.

**Current**: Form → Worker → GitHub Actions → Markdown files in Git  
**Proposed**: Form → Worker → D1 directly → Dashboard queries D1

---

## Problem

- ❌ No ability to query responses (can't filter by score, date, company)
- ❌ No real-time dashboard for engagement tracking
- ❌ GitHub Actions adds latency (10-30s per submission)
- ❌ Hard to analyze trends or generate reports
- ❌ No automated curriculum recommendations
- ❌ Manual markdown file management

---

## Solution: Dashboard-First Architecture

Store responses in **Cloudflare D1 with pre-aggregated analytics tables** for instant dashboard queries.

### Key Metrics

| Metric | Target |
|--------|--------|
| Form submission time | ~200ms (incl. aggregation) |
| Dashboard query (cold) | <50ms |
| Dashboard query (cached) | <5ms |
| Max responses | 100k+ |
| Monthly cost | $0 (free tier) |

### Design Philosophy

**Pre-compute everything on write**, query nothing on read. Dashboards should be instant.

---

## Implementation Details

### Tables (9 total)

**Raw Data**:
- `responses` - One row per form submission
- `answers` - Individual question answers (normalized)

**Pre-Aggregated**:
- `company_daily_metrics` - Daily counts & averages
- `company_maturity_distribution` - Distribution across 5 levels
- `company_score_distribution` - Histogram (8 buckets)
- `company_question_metrics` - Per-question averages
- `company_submission_timeline` - Time series data

**Reference**:
- `companies` - Company metadata
- `questions` - Question definitions (supports versioning)

### API Endpoints

```
POST   /api/responses                          - Submit form
GET    /api/analytics/dashboard?company=X     - Real-time dashboard
GET    /api/responses/:id                     - Get detail
GET    /api/responses?company=X&filters...    - Query with filters
GET    /api/health                            - Health check
```

### Performance

```javascript
// On every form submission (200ms)
1. Validate input
2. Insert into responses table
3. Update 5 pre-aggregated tables (in transaction)
4. Return success

// Dashboard query (<50ms)
1. Query pre-aggregated tables (all computed)
2. Return JSON
3. (Cached by Cloudflare for 5 min)
```

---

## Design Trade-offs

### Why Dashboard-First over Minimalist?
- Need dashboards urgently (engagement tracking, trends)
- Pre-aggregation keeps reads fast at scale
- Slightly heavier writes (200ms), but acceptable

### Why Dashboard-First over Fully-Normalized?
- Faster deployment (1 week vs. 4 weeks)
- Balanced complexity (not over-engineered)
- Dashboard is the critical path

### Hybrid Elements from Flexible Design
- Question versioning (if questions change, history stays consistent)
- Audit trail (created_at timestamps)
- Foundation for webhooks & exports (Phase 2)

---

## Migration Path

### Phase 1 (Week 1) - Core Infrastructure
- [ ] Create D1 database + apply schema
- [ ] Deploy responses-api Worker
- [ ] Update form submission endpoint
- [ ] Test end-to-end

### Phase 2 (Week 2) - Dashboard
- [ ] Build React dashboard component
- [ ] Deploy to Vercel/Pages/Cloudflare
- [ ] Integrate with form data
- [ ] Load test (100+ submissions)

### Phase 3 (Later) - Enhancements
- [ ] Webhooks (Slack notifications)
- [ ] CSV export
- [ ] Advanced filtering
- [ ] Recommendations engine

---

## Files Delivered

All in `/Users/nihat/DevS/ai-next/`:

| File | Purpose |
|------|---------|
| `src/db/schema.sql` | D1 schema (9 tables, indexes) |
| `src/workers/responses-api.ts` | Worker API handler (520 lines) |
| `src/components/Dashboard.tsx` | React dashboard component (400 lines) |
| `DEPLOYMENT_DASHBOARD_FIRST.md` | 7-day deployment guide |
| `API_REFERENCE.md` | API documentation |
| `DASHBOARD_FIRST_SUMMARY.md` | Executive summary |
| `IMPLEMENTATION_README.md` | Quick start guide |

---

## Cost Analysis

| Component | Free Tier | Cost |
|-----------|-----------|------|
| D1 Database | 3 GB storage | Included |
| D1 Queries | 100k/month | Included |
| Worker Requests | 100k/day | Included |
| Cache (Cloudflare) | 5 min TTL | Included |
| **Total** | **All free** | **$0/month** |

---

## Security

- ✅ Bearer token authentication on query endpoints
- ✅ SQL injection prevention (parameterized queries)
- ✅ CORS restricted to allowed origins
- ✅ Rate limiting (5 submissions/IP/5 min)
- ✅ No external data sharing (vs. Google Sheets)
- ✅ Full audit trail (timestamps on all records)

---

## Backward Compatibility

- ✅ No breaking changes to form.html
- ✅ Form submission endpoint stays same
- ✅ Can keep markdown files as backup in Git
- ✅ Easy rollback to GitHub Actions if needed

---

## Questions for Discussion

1. **Data migration**: Should we backfill old markdown responses into D1? (Recommended: No, start fresh)
2. **Public dashboards**: Should dashboards be public (GitHub Pages) or private (Bearer token)? (Recommended: Private for now)
3. **Timeline**: Can we start Phase 1 immediately? (Recommended: Yes)
4. **Webhooks**: Should Phase 2 include Slack notifications? (Recommended: Yes)

---

## Success Criteria

✅ All form submissions stored in D1 within 200ms  
✅ Dashboard queries execute <50ms (cold), <5ms (cached)  
✅ Real-time maturity distribution visible  
✅ Filter by company, date, score range works  
✅ Zero Google Sheets dependency  
✅ Load test passes (100+ rapid submissions)  
✅ GitHub Actions deprecated  

---

## Resources

- **Deployment guide**: `DEPLOYMENT_DASHBOARD_FIRST.md`
- **API docs**: `API_REFERENCE.md`
- **Schema**: `src/db/schema.sql`
- **Worker**: `src/workers/responses-api.ts`
- **Dashboard**: `src/components/Dashboard.tsx`

---

## Recommendation

**Approve and proceed with Phase 1 (Database Setup) immediately.**

This design:
- ✅ Solves the Google Sheets problem completely
- ✅ Provides real-time dashboards
- ✅ Scales to 100k+ responses
- ✅ Costs $0/month
- ✅ Deploys in 1 week
- ✅ Maintains clean architecture

---

## References

- Current flow: `workers/form-submission.js`, `.github/workflows/process-assessment.yml`
- Form files: `projects/*/form.html`
- Related: Fizix AI & Inflow Network company onboarding

---

**Created**: 2026-04-26  
**Author**: Claude (Agent A72, A8e, A97)  
**Status**: Ready for Implementation
