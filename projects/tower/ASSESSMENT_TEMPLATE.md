# Tower Assessment Template

**Assessment Version**: 1.0  
**Company**: Tower.dev  
**Focus**: AI Maturity & Capabilities for Python-native Data Orchestration  
**Form URL**: https://ai-next-agency.github.io/ai-next/projects/tower/

---

## Overview

This 8-question assessment evaluates Tower team members' AI readiness across key dimensions relevant to data orchestration, agent deployment, and LLM integration. Results feed into personalized curriculum recommendations.

**Time to Complete**: 5-7 minutes  
**Required Fields**: Name, Email, Department, Role  
**Response Format**: Single-select (1-5 scale) for each question

---

## Questions & Scoring

### Question 1: Coding Agents Usage
**Topic**: Current adoption of AI-powered coding tools  
**Why It Matters**: Coding agent adoption is the strongest leading indicator of how quickly a team can absorb broader AI capability.

**Response Options** (1-5 scale):
1. Not used — No team members use AI coding tools
2. ChatGPT / Claude manually — Copy-paste prompts, no IDE integration
3. IDE extensions — GitHub Copilot, Cursor, Codeium
4. Terminal-based agents — Claude Code, Codex, Aider in workflow
5. Custom internal agents — Self-built tools on top of LLM APIs

---

### Question 2: LLM Foundational Knowledge
**Topic**: Understanding of how LLMs work  
**Why It Matters**: Foundational understanding determines whether the team can debug, evaluate, and choose the right model for a job.

**Response Options** (1-5 scale):
1. Beginner — Basic ChatGPT usage; no mental model
2. Intermediate — Understand tokens, context windows, limitations
3. Working knowledge — Comfortable with prompting patterns and tradeoffs
4. Advanced — Embeddings, RAG, fine-tuning concepts understood
5. Expert — Built and shipped production LLM systems

---

### Question 3: Automated LLM Usage
**Topic**: Production LLM deployment (not just interactive chat)  
**Why It Matters**: The shift from interactive to automated LLM use is where most of the ROI shows up.

**Response Options** (1-5 scale):
1. Manual only — All LLM use is human-in-the-loop chat
2. Limited automation — POC or pilot of one batch job
3. Some processes automated — A few production jobs run on a schedule
4. Many processes automated — LLMs embedded across multiple workflows
5. Fully systematized — Most repeatable cognitive work is LLM-mediated

---

### Question 4: MCP / Skills / Plugin Expertise
**Topic**: Custom tool and integration authorship  
**Why It Matters**: Tool/plugin authorship is where AI stops being a chat product and becomes infrastructure.

**Response Options** (1-5 scale):
1. Unfamiliar with the concept — Have not heard of MCP / plugins
2. Aware but not using — Know it exists; have not tried
3. Using off-the-shelf — Using public plugins and integrations
4. Configured / customized — Tuned existing tools for our workflow
5. Built our own — Authored MCP servers / skills in-house

---

### Question 5: Data Infrastructure Maturity
**Topic**: Foundation for analytics, ML, and agent work  
**Why It Matters**: Data infrastructure is the floor for what AI work is even possible.

**Response Options** (1-5 scale):
1. No data warehouse — No structured data pipeline
2. Basic logging — Limited ability to query for analytics
3. Data warehouse exists — Analytics database with ETL for key datasets
4. Comprehensive infrastructure — Automated pipelines, analytics tools in use
5. ML-ready platform — Feature store, real-time processing, ML datasets

---

### Question 6: Team ML / Data Science Experience
**Topic**: Existing analytical capability  
**Why It Matters**: Team expertise determines training needs, hiring urgency, and realistic timelines.

**Response Options** (1-5 scale):
1. No ML expertise — No team members with ML / DS background
2. Basic analytics — 1-2 people with SQL / Python / Excel skills
3. Multiple data people — 3+ with data background; basic ML familiarity
4. Junior data scientist — Dedicated analyst or junior DS on team
5. Experienced ML team — Production ML deployments under their belt

---

### Question 7: AI Strategy & Leadership Commitment
**Topic**: Organizational prioritization of AI  
**Why It Matters**: Leadership commitment determines budget, headcount, and how patient the org will be with the J-curve.

**Response Options** (1-5 scale):
1. Not a priority — No budget or plan for AI initiatives
2. Interest only — Curiosity, no formal strategy
3. Early strategy — Budget allocated, strategy in development
4. Clear roadmap — Dedicated resources and team ownership
5. Central to strategy — Significant investment, C-level accountability

---

### Question 8: Process Automation Maturity (Existing)
**Topic**: Existing automation practices (any kind)  
**Why It Matters**: Existing automation muscle predicts how fast AI automation can be layered on.

**Response Options** (1-5 scale):
1. Mostly manual — Few or no automated workflows
2. Some scripts — Ad-hoc scripts run by individuals
3. Standard SaaS automations — Zapier / n8n / Make in regular use
4. Custom workflows — Internal tools and orchestration in production
5. Automation-first culture — New process is automated by default

---

## Scoring & Maturity Levels

**AI Maturity Score Calculation**:
```
Score = Average of all 8 question responses (1-5 scale)
Rounded to 1 decimal place
```

**Maturity Levels**:
- **1.0 - 1.4**: Initial — Just starting with AI
- **1.5 - 2.4**: Beginner — Some casual AI use, not production-ready
- **2.5 - 3.4**: Developing — Multiple AI tools in use, some production deployments
- **3.5 - 4.4**: Intermediate — Production AI systems in place, strategic approach
- **4.5 - 5.0**: Advanced — Sophisticated AI operations, automation-first mindset

---

## Response Processing

**Automatic After Submission**:
1. Form data posted to Cloudflare Worker
2. Data stored in D1 database (responses table)
3. AI maturity score calculated
4. Maturity level determined
5. Aggregates updated for dashboard
6. Assessment results written to `TOWER_ASSESSMENT_RESULTS.md`

---

## Next Steps

1. **Send Form to Tower**: Share https://ai-next-agency.github.io/ai-next/projects/tower/ with team
2. **Collect Responses**: Gather 3-5 assessments (T+1 to T+7)
3. **Review & Analyze**: Evaluate maturity levels and skill gaps
4. **Design Curriculum**: Create tailored training program
5. **Schedule Discovery Call**: Present findings and curriculum (T+14)
6. **Pilot Kickoff**: Begin delivery (T+21+)

---

**Created**: 2026-04-27  
**Status**: Ready for Assessment  
**Owner**: Nihat & Giray (afsin@inflownetwork.com)
