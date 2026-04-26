---
name: ainext-company-analyzer
description: "Automate complete company onboarding for AI education ventures. Use this skill whenever you need to onboard a new company client: provide company name + URL, and it will automatically analyze their business, tech stack, and industry position, then generate custom AI readiness assessment questions tailored to their specific gaps. The skill creates a GitHub-hosted assessment form, sets up automated response collection, and generates results with AI maturity scoring. Trigger on: 'add company', 'onboard', 'analyze company', 'create assessment', 'new client', or when discussing company-specific training needs."
---

# ainext Company Analyzer Skill

Fully automate company onboarding into your AI education/consulting pipeline. Provide a company name and URL, and this skill handles everything: research, question generation, form creation, and GitHub deployment.

## What This Skill Does

```
Input: Company name + URL
       ↓
[Research Phase]
  • Web analysis (business model, tech stack, market position)
  • Industry research (competitive landscape, AI adoption level)
  • Team structure & roles
       ↓
[Question Generation]
  • Create 8-12 custom assessment questions
  • Tailor to their specific tech stack + industry + business model
  • Score rubric (1-5 scale for AI maturity)
       ↓
[Form Creation]
  • Generate GitHub Pages form (vanilla JS, no build step)
  • Corporate design with progress bar
  • Contact info + assessment questions
       ↓
[Deployment]
  • Create GitHub branch for company
  • Push form to projects/[company-slug]/form/
  • Create GitHub Pages route: /[company-slug]/
  • Setup GitHub Actions response processing
       ↓
[Response Collection]
  • Auto-collect submissions via GitHub Issues
  • Calculate AI Maturity Level (custom scoring based on their questions)
  • Generate results markdown with recommendations
       ↓
Output: Live form URL + ready for first responses
```

## How to Use This Skill

### Interactive Mode (Recommended)

Simply say:
```
"Add company: Acme Corp (https://acme-corp.com)"
```

The skill will:
1. Analyze the company
2. Generate custom questions
3. Show you the questions for approval
4. Create the form
5. Deploy to GitHub
6. Return the live form URL

### Example Flow

```
You: "Onboard TechStartup Labs (https://techstartup.com)"

Skill Response:
✅ Analyzed company (SaaS, Series B, 50-person team)
✅ Identified tech stack (Node.js, React, PostgreSQL, AWS)
✅ Identified industry gaps (no ML pipeline, manual data processing)
✅ Generated 10 assessment questions
✅ Created form at: https://ai-next-agency.github.io/techstartup-labs/

Next: Share the form link with them
```

## Question Generation Strategy

Questions are generated across 4 dimensions:

### 1. **Tech Stack Assessment** (3-4 questions)
Tailored to their actual stack
- If they use Node.js: Ask about backend automation
- If they use React: Ask about data visualization challenges
- If they use Python: Ask about data pipeline needs
- If they use AWS: Ask about serverless ML opportunities

### 2. **Industry-Specific Challenges** (2-3 questions)
Based on their business vertical
- SaaS: Ask about product differentiation, customer support automation
- Fintech: Ask about compliance, fraud detection, risk analysis
- Healthcare: Ask about data privacy, clinical decision support
- Ecommerce: Ask about personalization, inventory optimization

### 3. **Business Model Opportunities** (2-3 questions)
Based on their revenue streams
- B2B SaaS: Ask about sales automation, customer data analysis
- Services: Ask about service delivery automation, resource optimization
- Product: Ask about product analytics, feature recommendation
- Marketplace: Ask about matching algorithms, dynamic pricing

### 4. **Organizational Readiness** (2-3 questions)
Based on their team structure
- Engineering-led: Ask about technical debt, ML infrastructure
- Product-led: Ask about feature prioritization, user insights
- Sales-led: Ask about pipeline intelligence, account insights
- Executive-led: Ask about strategic planning, competitive analysis

## Form Structure

Each company gets a custom form with:
- **Step 1**: Contact information (name, email, department, role)
- **Steps 2-N**: Custom assessment questions (8-12 total)
- **Final Step**: Open feedback

Each question:
- Tailored multiple choice (4-5 options specific to their situation)
- 1-5 scoring rubric
- Optional context (explains why this matters for their business)

## Scoring & Results

AI Maturity Level = (Total Score / Max Score) × 5.0

Results markdown includes:
- Current maturity level (1.0-5.0)
- Breakdown by dimension (tech, industry, business, org)
- Key skill gaps
- Recommended curriculum path
- Quick wins they can implement
- Timeline estimate

## Deployment Architecture

Each company gets:
```
projects/[company-slug]/
├── form/
│   └── index.html          ← GitHub Pages form
├── README.md               ← Project overview
├── COMPANY_PROFIL.md       ← Research findings
├── ASSESSMENT_QUESTIONS.md ← Generated questions + scoring
├── RESULTS.md              ← Auto-generated results
└── responses/
    └── [timestamp]_response.json
```

## Automated Processing

GitHub Actions handles:
1. **Issue Detection**: Watches for "Assessment:" issues
2. **Response Parsing**: Extracts data from issue body
3. **Calculation**: Computes AI Maturity Level
4. **Results Generation**: Creates markdown with recommendations
5. **Commits**: Saves response + results to GitHub
6. **Labeling**: Tags issue with maturity level + status

## Daily Sync

Optional: Set up automated sync to:
- Monitor for new responses daily
- Auto-generate updated results
- Notify you of new submissions
- Track trends across respondents

## Success Criteria

Form is ready when:
- ✅ Live URL provided
- ✅ Custom questions generated for their specific situation
- ✅ Company can access and fill out
- ✅ Responses auto-process with GitHub Actions
- ✅ Results markdown auto-generates on submission

## Common Use Cases

### Scenario 1: B2B SaaS Company
```
Input: "Analyze BuildTech (https://buildtech.ai)"
       → SaaS platform, 40 people, Python + React, Series A

Generated Questions:
- How do you handle customer success at scale?
- What product data do you currently track?
- How often do you release new features?
- What's your biggest bottleneck in sales?
- How do you prioritize feature requests?
- What's your technical debt situation?
- How do you gather competitive intelligence?
- Do you use analytics for product decisions?

Result: Custom form deployed, ready for team responses
```

### Scenario 2: Services-Based Company
```
Input: "Onboard DesignStudio (https://designstudio.com)"
       → Design agency, 20 people, no code/low code, AI-curious

Generated Questions:
- How is client work currently allocated?
- What's your biggest time drain in delivery?
- How do you handle revisions/feedback?
- What project management tools do you use?
- Do you have any automation currently?
- What would 20% more productivity enable?
- How do you keep clients updated?
- What's your bottleneck in scaling projects?

Result: Custom form deployed, ready for team responses
```

### Scenario 3: Finance/Fintech
```
Input: "Add company: RiskTech (https://risktech.io)"
       → Fintech, trading platform, 30 people, Java + Python

Generated Questions:
- How do you currently detect fraudulent activity?
- What's your risk assessment process?
- How often do you backtest trading strategies?
- What data sources do you use for analysis?
- How do you handle regulatory compliance?
- What's your biggest operational risk?
- How could you improve trade execution speed?
- Do you have real-time alerting capabilities?

Result: Custom form deployed, ready for team responses
```

## Implementation Details

### Research Phase
The skill uses web research to understand:
- Company website + product description
- LinkedIn (team size, roles, growth)
- Crunchbase/AngelList (funding, market fit)
- Tech stack (StackShare, GitHub, public documentation)
- Industry position (market size, competitors, adoption)

### Question Generation
Custom questions are generated using:
- Industry benchmarks (typical AI adoption level for sector)
- Tech stack analysis (what AI tools fit their stack)
- Business model patterns (where AI creates value for their model)
- Organizational readiness (can they execute on recommendations)

### Form Creation
Forms are generated as vanilla JavaScript with:
- Tailwind CSS styling (no build step)
- Local storage backup (browser-side)
- Progress bar + validation
- Accessibility (WCAG 2.1)
- Mobile responsive
- Corporate design theme

### GitHub Deployment
Automated via:
- Git commands (create branch, push files)
- GitHub Pages configuration (auto-enable for /projects/[slug]/)
- GitHub Actions workflow (auto-create for response processing)
- Initial commit + branch setup

## Timeline

Typical onboarding flow:
- T+0: You invoke skill with company name + URL
- T+5-10 min: Analysis complete, questions reviewed
- T+10-15 min: Form deployed, live URL ready
- T+15 min: You share form with company contact
- T+1-7 days: First responses arrive
- T+7: Results auto-generate, you review + plan curriculum
- T+14: Discovery call with company leadership
- T+30: Pilot project starts

## What You Need

To use this skill:
- ✅ Git installed locally (for pushing to GitHub)
- ✅ GitHub account with AI-Next-Agency organization access
- ✅ GITHUB_TOKEN configured (for API automation)
- ✅ Company name + website URL
- ✅ Contact email for sharing form

Everything else is automated.

## Pro Tips

### Customize Question Weighting
You can adjust how much weight each dimension gets:
- Focus on tech stack? → More technical questions
- Focus on business impact? → More strategic questions
- Focus on team readiness? → More organizational questions

Default: 30% tech, 25% industry, 25% business, 20% organizational

### Batch Multiple Companies
```
"Onboard 3 companies:
1. CompanyA (url)
2. CompanyB (url)
3. CompanyC (url)"
```

The skill will analyze all three and create forms for each in parallel.

### Monitor Responses
After form goes live:
```
"Show me responses for [Company]"
```

The skill will:
- List all submissions
- Show trends across respondents
- Highlight skill gaps
- Suggest curriculum topics

### Iterate on Questions
If you want to refine questions after first few responses:
```
"Revise assessment for [Company] - add more questions about X"
```

The skill will:
- Analyze feedback from responses
- Add/remove questions
- Redeploy updated form
- Preserve previous responses

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Company analysis incomplete" | Skill may need better public info — provide additional details (tech stack, team size) |
| "GitHub deployment failed" | Check GITHUB_TOKEN is configured and org has permissions |
| "Form won't load" | Verify GitHub Pages is enabled for the org, check /projects/[slug]/ folder exists |
| "Responses not processing" | Verify GitHub Actions workflow created, check issue titles include "Assessment:" |
| "Questions don't match company" | Provide more context about company focus (e.g., "E-commerce platform focused on personalization") |

## Next Steps

1. **Invoke the skill**: Provide company name + URL
2. **Review questions**: Skill shows draft questions for approval
3. **Approve or iterate**: Say "looks good, deploy" or "change question X to ask about Y"
4. **Get form URL**: Skill returns live form ready to share
5. **Send to company**: Share URL with contact
6. **Monitor responses**: Track submissions and auto-generated results
7. **Design curriculum**: Use maturity level + gaps to create training plan

---

**Status**: Ready for deployment  
**Last Updated**: 2026-04-24  
**Prefix**: ainext  
**Version**: 1.0
