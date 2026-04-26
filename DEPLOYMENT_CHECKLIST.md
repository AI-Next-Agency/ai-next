# Inflow Network Assessment - Deployment Checklist

**Status**: Ready to Deploy  
**Date**: 2026-04-24  
**Owner**: Nihat (nihtavci@gmail.com)

---

## Phase 1: Cloudflare Setup (Estimated Time: 15 minutes)

### KV Namespace Creation
- [ ] Log in to Cloudflare Dashboard
- [ ] Navigate to Workers → KV
- [ ] Click "Create namespace"
- [ ] Name: `FORM_SUBMISSIONS`
- [ ] Copy Namespace ID for later
- [ ] Note: `preview_id` for local testing

**Saved Namespace ID**: ________________

### GitHub Token Configuration
- [ ] Generate new GitHub Personal Access Token
  - Go to GitHub → Settings → Developer settings → Personal access tokens
  - Scopes: `repo` (full control of repositories)
  - Set expiration: 90 days (or longer)
  - Copy token immediately (can't view again)
- [ ] In Cloudflare Dashboard → Workers → Settings
- [ ] Add Environment Variable (Secret):
  - **Name**: `GITHUB_TOKEN`
  - **Value**: [Paste GitHub token]
  - Click "Encrypt"
  - Click "Save"

**GitHub Token Created**: ✅ (Stored in Cloudflare Secrets)

### Worker Deployment
- [ ] Install Wrangler CLI:
  ```bash
  npm install -g wrangler
  ```
- [ ] In repository root, create `wrangler.toml`:
  ```toml
  name = "form-submission"
  type = "javascript"
  account_id = "YOUR_ACCOUNT_ID"
  workers_dev = true

  [[kv_namespaces]]
  binding = "FORM_SUBMISSIONS"
  id = "YOUR_NAMESPACE_ID"
  preview_id = "YOUR_NAMESPACE_ID"
  ```
- [ ] Replace placeholders:
  - `YOUR_ACCOUNT_ID`: From Cloudflare Account Settings
  - `YOUR_NAMESPACE_ID`: From KV Namespace creation
- [ ] Deploy worker:
  ```bash
  wrangler login
  wrangler deploy
  ```
- [ ] Copy deployed Worker URL (format: `form-submission.YOUR_ACCOUNT.workers.dev`)

**Worker URL**: `https://form-submission.YOUR_ACCOUNT.workers.dev`  
**Custom Domain (optional)**: `https://form-submission.inflownetwork.com`

### Custom Domain Setup (Optional)
- [ ] In Cloudflare Dashboard → Workers → form-submission
- [ ] Click Settings → Routes
- [ ] Add new route:
  - Pattern: `form-submission.inflownetwork.com/*`
  - Zone: Select `inflownetwork.com`
- [ ] Add DNS CNAME in inflownetwork.com DNS settings:
  - Name: `form-submission`
  - Target: `form-submission.YOUR_ACCOUNT.workers.dev`
  - Proxied: Yes

**Custom Domain Status**: [ ] Configured / [ ] Skipped (using workers.dev)

---

## Phase 2: GitHub Setup (Estimated Time: 10 minutes)

### Repository Configuration
- [ ] Clone/navigate to: https://github.com/AI-Next-Agency/ai-next
- [ ] Ensure you have push access to main branch
- [ ] Verify `.github/workflows/` directory exists

### GitHub Secrets
- [ ] Go to Repository → Settings → Secrets and variables → Actions
- [ ] Create new secret:
  - **Name**: `FORM_SUBMISSION_TOKEN`
  - **Value**: Same GitHub PAT from Cloudflare setup
  - Click "Add secret"

**GitHub Secret Created**: ✅

### Workflow File
- [ ] File exists: `.github/workflows/process-inflow-assessment.yml`
- [ ] Verify workflow listens for: `repository_dispatch` with type `assessment-submission`
- [ ] Verify workflow writes to: `projects/inflow-network/responses/`
- [ ] Verify directories exist:
  ```bash
  mkdir -p projects/inflow-network/responses
  ```

**Workflow Verified**: ✅  
**Directories Created**: ✅

### Initial Commit
- [ ] Add new directories to git:
  ```bash
  git add projects/inflow-network/responses/.gitkeep
  git commit -m "Create responses directory for assessment submissions"
  git push origin main
  ```

**Initial Commit**: ✅

---

## Phase 3: Form Configuration (Estimated Time: 5 minutes)

### Worker URL Update
- [ ] Edit: `projects/inflow-network/3-FORM_INDEX.html`
- [ ] Find line ~1155: `const workerUrl = '...'`
- [ ] Update with your Worker URL:
  ```javascript
  const workerUrl = 'https://form-submission.inflownetwork.com';
  // OR if using workers.dev:
  // const workerUrl = 'https://form-submission.YOUR_ACCOUNT.workers.dev';
  ```
- [ ] Save file

**Worker URL Updated**: ✅

### Form Verification
- [ ] Form loads without errors
- [ ] Progress bar appears
- [ ] All 13 steps are clickable
- [ ] localStorage backup is functional
- [ ] Form is mobile responsive

**Form Verified**: ✅

### GitHub Pages Deployment
- [ ] File location: `projects/inflow-network/3-FORM_INDEX.html`
- [ ] GitHub Pages enabled for repo
- [ ] Form accessible at:
  ```
  https://ai-next-agency.github.io/ai-next/projects/inflow-network/
  ```
- [ ] Test form loads successfully

**Form Deployed to GitHub Pages**: ✅

---

## Phase 4: Testing (Estimated Time: 30 minutes)

### Test 1: Basic Submission
- [ ] Open form in browser
- [ ] Fill all required fields:
  - Name: `Test User`
  - Email: `test@example.com`
  - Department: `Product`
  - Role: `Manager`
  - All 11 questions: 3-4 score
- [ ] Click Submit Assessment
- [ ] Expected: Success message appears
- [ ] Check GitHub: Response file appears within 30 seconds

**Test 1 Result**: ✅ PASS / ❌ FAIL

### Test 2: Rate Limiting
- [ ] Submit form immediately (from same IP)
- [ ] Try to submit again within 5 minutes
- [ ] Expected: Error message about rate limit
- [ ] Wait 5 minutes, try again
- [ ] Expected: Second submission succeeds

**Test 2 Result**: ✅ PASS / ❌ FAIL

### Test 3: Error Handling
- [ ] Leave "Department" field empty
- [ ] Click Submit
- [ ] Expected: Error message "Department is required"
- [ ] Fill missing field
- [ ] Submit again
- [ ] Expected: Success message

**Test 3 Result**: ✅ PASS / ❌ FAIL

### Test 4: GitHub Response File
- [ ] Navigate to: `projects/inflow-network/responses/`
- [ ] Verify file exists with timestamp
- [ ] Open file and check content:
  - [ ] Contact info section present
  - [ ] All 11 question responses included
  - [ ] AI Maturity Score calculated
  - [ ] Timestamp correct
- [ ] Check commit message includes respondent name

**Test 4 Result**: ✅ PASS / ❌ FAIL

### Test 5: Summary Update
- [ ] Check: `INFLOW_NETWORK_ASSESSMENT_RESULTS.md`
- [ ] Verify latest submission appears
- [ ] Verify timestamp is recent
- [ ] Verify formatting is correct markdown

**Test 5 Result**: ✅ PASS / ❌ FAIL

### Test 6: Multiple Submissions
- [ ] Submit form 3 times with different data
- [ ] Verify all 3 files appear in responses/
- [ ] Verify each has unique timestamp
- [ ] Verify summary includes all 3

**Test 6 Result**: ✅ PASS / ❌ FAIL

### Overall Testing
**All Tests Passed**: ✅ YES / ❌ NO

If any test failed, see **TROUBLESHOOTING** section below.

---

## Phase 5: Production Launch (Estimated Time: 5 minutes)

### Pre-Launch Checklist
- [ ] All tests passing ✅
- [ ] Form is mobile-responsive ✅
- [ ] Worker is deployed and tested ✅
- [ ] GitHub Actions workflow is active ✅
- [ ] Rate limiting is enabled ✅
- [ ] CORS is properly configured ✅

### Team Communication
- [ ] Notify Inflow Network team
- [ ] Share form URL: `https://ai-next-agency.github.io/ai-next/projects/inflow-network/`
- [ ] Explain assessment process
- [ ] Provide submission deadline
- [ ] Explain next steps after submission

### Launch Announcement
**Form URL**: https://ai-next-agency.github.io/ai-next/projects/inflow-network/

**Email Template** (optional):
```
Subject: Inflow Network AI Readiness Assessment

Hi [Team],

We're excited to invite you to complete our AI Readiness assessment. 
This 15-minute survey will help us understand your organization's 
current AI maturity and identify key opportunities.

Please complete the assessment here:
https://ai-next-agency.github.io/ai-next/projects/inflow-network/

The assessment covers:
- Current AI tool usage
- Team capabilities and skills
- Strategic AI goals
- Infrastructure readiness
- Business impact expectations

Deadline: [DATE]

Questions? Reply to this email.

Best regards,
Nihat
```

### Monitoring Setup
- [ ] Monitor GitHub for new responses daily
- [ ] Review INFLOW_NETWORK_ASSESSMENT_RESULTS.md weekly
- [ ] Check Cloudflare Worker logs for errors
- [ ] Track response rate and completion time

**Launch Date**: ________________  
**Production Status**: ✅ LIVE / ⏳ TESTING / ❌ BLOCKED

---

## Troubleshooting Guide

### Issue: Form shows "Network error: Unable to submit assessment"

**Possible Causes**:
1. Worker not deployed
2. Worker URL incorrect in form
3. CORS configuration wrong

**Steps to Fix**:
1. [ ] Verify Worker URL in form code
2. [ ] Test Worker directly:
   ```bash
   curl -X POST https://form-submission.inflownetwork.com \
     -H "Content-Type: application/json" \
     -H "Origin: https://ai-next-agency.github.io" \
     -d '{"name":"Test","email":"test@test.com","department":"QA","role":"Tester","questions":[],"aiMaturityScore":3,"maturityLevel":"Intermediate"}'
   ```
3. [ ] Check Cloudflare Worker logs
4. [ ] Verify CORS allowedOrigins includes `https://ai-next-agency.github.io`

**Resolution**: __________________________

---

### Issue: Response file doesn't appear in GitHub after 30 seconds

**Possible Causes**:
1. GitHub Actions workflow not triggered
2. GitHub Secret token expired or wrong
3. Workflow syntax error

**Steps to Fix**:
1. [ ] Check GitHub Actions tab → workflow runs
2. [ ] Look for "Process Inflow Network Assessment" workflow
3. [ ] Click latest run to see execution logs
4. [ ] Check error messages in workflow logs
5. [ ] Verify GITHUB_TOKEN secret is set correctly:
   ```bash
   # In repo settings, verify secret exists
   # Don't display token, just verify it's there
   ```
6. [ ] Test workflow manually by checking if `repository_dispatch` event is received

**Resolution**: __________________________

---

### Issue: "429 Too many submissions. Please wait before submitting again"

**Possible Causes**:
1. IP address has submitted within last 5 minutes
2. Rate limit working as intended

**Expected Behavior**:
- This is normal and indicates rate limiting is working
- User should wait 5 minutes before next submission
- Or use different network/IP

**No Fix Needed**: ✅

---

### Issue: CORS error "403 CORS policy violation"

**Possible Causes**:
1. Form served from wrong domain
2. Worker allowedOrigins doesn't match

**Steps to Fix**:
1. [ ] Verify form is loaded from: `https://ai-next-agency.github.io/ai-next/...`
2. [ ] Check Worker code line ~26-29, verify this domain is in allowedOrigins
3. [ ] Redeploy Worker if origins changed:
   ```bash
   wrangler deploy
   ```

**Resolution**: __________________________

---

### Issue: GitHub token error "401 Unauthorized"

**Possible Causes**:
1. Token expired (check expiration date)
2. Token has wrong scopes
3. Token not stored correctly in Cloudflare Secret

**Steps to Fix**:
1. [ ] Generate new GitHub token:
   - GitHub Settings → Developer settings → Tokens
   - Scope: `repo`
   - Expiration: 90 days
2. [ ] Update Cloudflare Secret:
   - Cloudflare Dashboard → Workers → Settings
   - Edit `GITHUB_TOKEN` secret
   - Paste new token
   - Click Encrypt, Save
3. [ ] Redeploy Worker:
   ```bash
   wrangler deploy
   ```
4. [ ] Test again

**Resolution**: __________________________

---

## Post-Launch Tasks

### Week 1
- [ ] Monitor first submissions
- [ ] Verify responses are being saved
- [ ] Check for any errors in logs
- [ ] Confirm team is using form

### Week 2-3
- [ ] Analyze AI Maturity Score distribution
- [ ] Identify patterns in responses
- [ ] Prepare curriculum recommendations
- [ ] Schedule follow-up discussion

### Month 1
- [ ] Review all assessment responses
- [ ] Calculate average AI Maturity Score
- [ ] Identify top skill gaps
- [ ] Plan training program
- [ ] Present results to Inflow Network leadership

---

## Rollback Plan

If critical issues occur:

1. **Disable Form**:
   ```bash
   # In projects/inflow-network/3-FORM_INDEX.html
   # Add alert at top: alert('Assessment temporarily unavailable')
   ```

2. **Disable Worker**:
   ```bash
   wrangler delete form-submission
   # OR disable via Cloudflare Dashboard
   ```

3. **Revert Commits**:
   ```bash
   git log --oneline -5
   git revert [commit-hash]
   ```

4. **Notify Team**:
   Send email explaining temporary unavailability and ETA for fix.

---

## Sign-Off

**Deployment Coordinator**: ________________  
**Date**: ________________  
**Status**: [ ] Ready to Deploy / [ ] Blocked / [ ] In Progress

**Go Live Approval**: ________________  
**Date**: ________________

---

## Quick Reference

**Form URL**: https://ai-next-agency.github.io/ai-next/projects/inflow-network/

**Response Location**: `projects/inflow-network/responses/`

**Summary Location**: `projects/inflow-network/INFLOW_NETWORK_ASSESSMENT_RESULTS.md`

**Worker Endpoint**: `https://form-submission.inflownetwork.com` (or `*.workers.dev`)

**GitHub Workflow**: `.github/workflows/process-inflow-assessment.yml`

**Documentation**:
- AUTOMATION_SYSTEM_SUMMARY.md
- WORKER_DEPLOYMENT_GUIDE.md
- E2E_TESTING_GUIDE.md
- This file

---

**Ready to Deploy**: ✅ YES  
**Date Prepared**: 2026-04-24  
**Version**: 1.0
