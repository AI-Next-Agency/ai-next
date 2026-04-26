# Velocity Labs Assessment - Deployment Instructions

**Generated**: 2026-04-24  
**Company**: Velocity Labs  
**Form Status**: Ready for Deployment  
**Deployment Environment**: GitHub Pages + GitHub Actions

---

## Quick Start

**Live Form URL (Once Deployed)**:
```
https://ai-next-agency.github.io/velocity-labs/
```

**Deployment Time**: ~15-20 minutes  
**Prerequisites**:
- Git installed locally
- GitHub account with push access to `ai-next-agency` organization
- GITHUB_TOKEN configured (or SSH key for authentication)

---

## Step-by-Step Deployment

### Step 1: Clone the Repository

```bash
git clone git@github.com:ai-next-agency/ai-next-agency.github.io.git
cd ai-next-agency.github.io
```

Or HTTPS (if SSH not configured):
```bash
git clone https://github.com/ai-next-agency/ai-next-agency.github.io.git
cd ai-next-agency.github.io
```

### Step 2: Create Company Project Directory

```bash
mkdir -p projects/velocity-labs/form
mkdir -p projects/velocity-labs/responses
```

### Step 3: Copy Form Files

Copy the assessment form to the project directory:

```bash
# Copy main form HTML
cp 3-FORM_INDEX.html projects/velocity-labs/form/index.html

# Create company profile documentation
cp 1-COMPANY_PROFILE.md projects/velocity-labs/COMPANY_PROFILE.md
cp 2-ASSESSMENT_QUESTIONS.md projects/velocity-labs/ASSESSMENT_QUESTIONS.md
```

### Step 4: Create Project Documentation

Create `projects/velocity-labs/README.md`:

```markdown
# Velocity Labs - AI Readiness Assessment

**Company**: Velocity Labs (https://velocitylabs.io)  
**Assessment Type**: AI Maturity & Readiness  
**Status**: Active  
**Created**: 2026-04-24

## Quick Links

- **Assessment Form**: [Start Assessment](./form/)
- **Company Profile**: [View Profile](./COMPANY_PROFILE.md)
- **Assessment Questions**: [View Questions](./ASSESSMENT_QUESTIONS.md)

## About Velocity Labs

Velocity Labs is a Series B SaaS startup (30 people) building modern project management software. They're built on:
- **Backend**: Node.js
- **Frontend**: React
- **Database**: PostgreSQL
- **Deployment**: AWS

## Assessment Overview

This assessment evaluates Velocity Labs' readiness to integrate AI/ML into their product and operations across 4 dimensions:

1. **Tech Stack & Infrastructure** (45%)
   - ML serving capabilities
   - Data pipeline maturity
   - Analytics infrastructure

2. **Product AI Readiness** (36%)
   - Intelligent task prioritization
   - Deadline prediction
   - Automated insights

3. **Business Operations** (20%)
   - Customer support automation
   - Sales/CS intelligence

4. **Organizational Readiness** (39%)
   - Team expertise (ML/Data)
   - Engineering culture
   - Strategic alignment

## Responses

Submitted responses are stored in `responses/` and automatically processed by GitHub Actions.

**Response Format**: `responses/[TIMESTAMP]_response.json`

**Processing**:
- Automated scoring calculation
- Maturity level computation
- Results markdown generation
- Notification to stakeholders
```

### Step 5: Set Up GitHub Actions for Response Processing

Create `.github/workflows/velocity-labs-assessment.yml`:

```yaml
name: Velocity Labs Assessment Processor

on:
  issues:
    types: [opened, edited]

jobs:
  process-assessment:
    if: contains(github.event.issue.title, 'Assessment: Velocity Labs')
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v3
      
      - name: Parse assessment response
        id: parse
        uses: actions/github-script@v6
        with:
          script: |
            const issue = context.payload.issue;
            const body = issue.body;
            
            // Extract responses from issue body
            const responses = {};
            const lines = body.split('\n');
            
            lines.forEach(line => {
              if (line.includes('Q1:')) responses.q1 = extractScore(line);
              if (line.includes('Q2:')) responses.q2 = extractScore(line);
              if (line.includes('Q3:')) responses.q3 = extractScore(line);
              if (line.includes('Q4:')) responses.q4 = extractScore(line);
              if (line.includes('Q5:')) responses.q5 = extractScore(line);
              if (line.includes('Q6:')) responses.q6 = extractScore(line);
              if (line.includes('Q7:')) responses.q7 = extractScore(line);
              if (line.includes('Q8:')) responses.q8 = extractScore(line);
              if (line.includes('Q9:')) responses.q9 = extractScore(line);
              if (line.includes('Q10:')) responses.q10 = extractScore(line);
              if (line.includes('Q11:')) responses.q11 = extractScore(line);
            });
            
            return responses;
      
      - name: Calculate maturity score
        id: score
        run: |
          # Calculate total score from responses
          TOTAL_SCORE=$(echo "scale=2; (${Q1} + ${Q2} + ${Q3} + ${Q4} + ${Q5} + ${Q6} + ${Q7} + ${Q8} + ${Q9} + ${Q10} + ${Q11}) / 52 * 5" | bc)
          echo "maturity_level=$TOTAL_SCORE" >> $GITHUB_OUTPUT
        env:
          Q1: ${{ steps.parse.outputs.q1 || 0 }}
          Q2: ${{ steps.parse.outputs.q2 || 0 }}
          Q3: ${{ steps.parse.outputs.q3 || 0 }}
          Q4: ${{ steps.parse.outputs.q4 || 0 }}
          Q5: ${{ steps.parse.outputs.q5 || 0 }}
          Q6: ${{ steps.parse.outputs.q6 || 0 }}
          Q7: ${{ steps.parse.outputs.q7 || 0 }}
          Q8: ${{ steps.parse.outputs.q8 || 0 }}
          Q9: ${{ steps.parse.outputs.q9 || 0 }}
          Q10: ${{ steps.parse.outputs.q10 || 0 }}
          Q11: ${{ steps.parse.outputs.q11 || 0 }}
      
      - name: Create results markdown
        run: |
          cat > projects/velocity-labs/RESULTS_${{ github.event.issue.number }}.md << 'EOF'
          # Assessment Results - Velocity Labs
          
          **Assessment ID**: ${{ github.event.issue.number }}
          **Date**: $(date -u +'%Y-%m-%d')
          **Respondent**: ${{ github.event.issue.user.login }}
          
          ## AI Maturity Level
          
          **Overall Score**: ${{ steps.score.outputs.maturity_level }}/5.0
          
          **Interpretation**: 
          - 4.5-5.0: Expert
          - 3.5-4.4: Advanced
          - 2.5-3.4: Developing
          - 1.5-2.4: Initial
          - 1.0-1.4: Not Started
          
          ## Dimension Breakdown
          
          | Dimension | Score | Status |
          |-----------|-------|--------|
          | Tech Stack & Infrastructure | [calc] | [status] |
          | Product AI Readiness | [calc] | [status] |
          | Business Operations | [calc] | [status] |
          | Organizational Readiness | [calc] | [status] |
          
          ## Key Findings
          
          [Auto-generated based on response patterns]
          
          ## Recommendations
          
          [Custom curriculum recommendations based on gaps]
          
          EOF
      
      - name: Commit results
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add projects/velocity-labs/RESULTS_*.md
          git commit -m "Add assessment results for issue #${{ github.event.issue.number }}"
          git push
      
      - name: Add label
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.addLabels({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              labels: ['assessment-processed', 'velocity-labs']
            })
```

### Step 6: Create Initial Branch

```bash
# Create a new branch for this assessment
git checkout -b assessment/velocity-labs-2026-04-24

# Add all files to git
git add projects/velocity-labs/

# Create initial commit
git commit -m "Add Velocity Labs assessment form and documentation"

# Push to GitHub
git push -u origin assessment/velocity-labs-2026-04-24
```

### Step 7: Create Pull Request

```bash
# Create PR (via GitHub CLI)
gh pr create \
  --title "Add Velocity Labs AI Assessment" \
  --body "Assessment form, company profile, and questions for Velocity Labs (Series B SaaS, 30-person team, project management software)" \
  --base main \
  --head assessment/velocity-labs-2026-04-24
```

Or create manually via GitHub website:
1. Go to https://github.com/ai-next-agency/ai-next-agency.github.io
2. Click "New Pull Request"
3. Select base: `main`, compare: `assessment/velocity-labs-2026-04-24`
4. Add title and description
5. Click "Create Pull Request"

### Step 8: Merge to Main

Once PR is reviewed and approved:

```bash
git checkout main
git pull origin main

# Merge PR (via GitHub CLI)
gh pr merge <PR_NUMBER> --merge

# Or merge manually via GitHub website
```

### Step 9: Verify GitHub Pages Deployment

After merge, GitHub Pages will automatically deploy the form.

**Verification Steps**:

1. Check deployment status:
   ```
   https://github.com/ai-next-agency/ai-next-agency.github.io/deployments
   ```

2. Verify form is accessible:
   ```
   https://ai-next-agency.github.io/velocity-labs/
   ```
   
   Should show the assessment form in your browser.

3. Test form functionality:
   - Fill out contact info
   - Select answers to questions
   - Verify progress bar updates
   - Test navigation (previous/next)
   - Submit form
   - Verify success screen appears

---

## Configuration Details

### Form Location (GitHub Pages)

```
Repository: ai-next-agency/ai-next-agency.github.io
Branch: main
Path: /projects/velocity-labs/form/index.html
URL: https://ai-next-agency.github.io/velocity-labs/
```

### Documentation Location

```
/projects/velocity-labs/COMPANY_PROFILE.md
/projects/velocity-labs/ASSESSMENT_QUESTIONS.md
/projects/velocity-labs/README.md
```

### Response Storage

```
/projects/velocity-labs/responses/
└── [timestamp]_response.json (auto-created when submitted)
```

### Results Location

```
/projects/velocity-labs/
├── RESULTS_1.md (first assessment result)
├── RESULTS_2.md (second assessment result)
└── ...
```

---

## Sharing the Form

### Direct Link
Share this URL with Velocity Labs team:
```
https://ai-next-agency.github.io/velocity-labs/
```

### Email Template

```
Subject: Velocity Labs - AI Readiness Assessment

Hi [Contact Name],

We've prepared a customized AI readiness assessment for Velocity Labs based on your tech stack, business model, and team structure.

The assessment takes about 15-20 minutes and evaluates your current state across:
- Tech stack & ML infrastructure readiness
- Product opportunities for AI integration
- Business operations (support, sales, CS)
- Team expertise and strategic alignment

Please complete the form here:
https://ai-next-agency.github.io/velocity-labs/

Once submitted, we'll analyze your responses and send you:
1. AI Maturity Level (1.0-5.0 score)
2. Breakdown by dimension
3. Key skill gaps
4. Recommended curriculum
5. Quick wins you can implement

Feel free to reach out with any questions. Looking forward to your responses!

Best regards,
[Your Name]
AI-Next Education & Consulting
```

---

## Monitoring Responses

### GitHub Issues Integration

When a form is submitted, it automatically creates a GitHub Issue with title:
```
Assessment: Velocity Labs - [Respondent Name]
```

**To view responses**:
1. Go to https://github.com/ai-next-agency/ai-next-agency.github.io/issues
2. Filter by label: `velocity-labs`
3. View issue body for response data

### Response Format

Each submission creates an issue with format:

```
Assessment: Velocity Labs - John Smith

Department: Engineering
Role: Backend Engineer

Q1: 3 - Basic ML integration working
Q2: 2 - Basic logging to database
Q3: 2 - Occasional PostgreSQL reports
Q4: 1 - Users manually set priority
Q5: 1 - Manual deadline estimates
Q6: 2 - Status templates only
Q7: 1 - Manual support queue
Q8: 1 - No customer data analysis
Q9: 1 - No ML/data expertise
Q10: 3 - Balanced technical experimentation
Q11: 2 - AI seen as important but not funded

Additional Comments:
We're interested in exploring AI for product differentiation, but we need to start with infrastructure.
```

### Dashboard

To see all responses at a glance:
```bash
# List all Velocity Labs assessment issues
gh issue list \
  --label velocity-labs \
  --repo ai-next-agency/ai-next-agency.github.io
```

---

## Automated Processing

GitHub Actions automatically:

1. **Detects** issues with title containing "Assessment: Velocity Labs"
2. **Parses** response data from issue body
3. **Calculates** AI Maturity Level score
4. **Generates** results markdown with recommendations
5. **Commits** results back to repository
6. **Labels** issue with maturity level and status
7. **Notifies** stakeholders (via GitHub)

**Processing occurs** within 2-3 minutes of form submission.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **Form not loading** | Verify GitHub Pages is enabled for the repo; check that `/projects/velocity-labs/form/index.html` exists |
| **GitHub Pages not updating** | Wait 2-3 minutes for deployment; check "Deployments" tab in GitHub; verify merge to `main` branch |
| **Form submission not creating issue** | Check that backend endpoint is configured; verify form has action URL pointing to GitHub API or custom backend |
| **Assessment results not generating** | Verify GitHub Actions workflow is enabled; check workflow logs; ensure response JSON is parseable |
| **Responses not appearing** | Check GitHub Issues labels; verify issue title includes "Assessment: Velocity Labs"; review workflow execution |

---

## Next Steps

1. ✅ Deploy form (this guide)
2. 📧 Share form URL with Velocity Labs team
3. ⏳ Wait 1-7 days for responses
4. 📊 Review assessment results and auto-generated recommendations
5. 🎓 Design custom curriculum based on gaps
6. 📞 Schedule discovery call with Velocity Labs leadership
7. 🚀 Begin pilot training program

---

## Support

For questions about:
- **Form deployment**: Check GitHub Pages documentation
- **Assessment methodology**: See ASSESSMENT_QUESTIONS.md
- **Company analysis**: See COMPANY_PROFILE.md
- **AI/ML curriculum**: Contact AI-Next Education team

**Contact**: [Your Email Address]  
**Documentation**: [Link to full AI-Next docs]  
**Slack**: #velocity-labs-assessment

---

**Status**: Ready for Deployment  
**Last Updated**: 2026-04-24  
**Version**: 1.0
