# Velocity Labs Assessment Questions

**Company**: Velocity Labs (Project Management SaaS)  
**Assessment Date**: 2026-04-24  
**Question Count**: 11 questions across 4 dimensions  
**Estimated Completion Time**: 15-20 minutes

---

## Question Scoring Scale

All questions use a **1-5 maturity scale**:

| Score | Level | Description |
|-------|-------|-------------|
| 1 | Not Started | No activity or awareness in this area |
| 2 | Initial | Early-stage thinking or pilot projects |
| 3 | Developing | Active work underway, some results |
| 4 | Advanced | Production systems, proven ROI |
| 5 | Expert | Industry-leading practices, full optimization |

---

## Dimension 1: Tech Stack & ML Infrastructure (3 questions)

### Q1: Backend ML Integration Readiness
**Category**: Tech Stack Assessment  
**Weight**: 15%

**Question**:
> Your backend is currently built on Node.js. Regarding ML model integration and serving capabilities, where are you today?

**Options** (with hidden score):
- [ ] 1 - We haven't considered integrating ML models into Node.js; our architecture focuses purely on business logic
- [ ] 2 - We're exploring ML possibilities but haven't determined if/how to integrate with Node.js backend
- [ ] 3 - We have basic ML integration (perhaps TensorFlow.js) for lightweight predictions, working in a non-critical service
- [ ] 4 - We have a production ML inference service in Node.js with monitoring and performance optimization
- [ ] 5 - We have a mature ML serving infrastructure supporting multiple models with A/B testing and real-time feature engineering

**Context** (shown to respondent):
*Why this matters*: Your Node.js backend is ideal for serving ML predictions in real-time to your frontend. Understanding your readiness here helps us design the right architecture for AI features.

**Scoring Logic**:
- 1: No infrastructure for ML serving (0 points)
- 2: Aware but not planned (1 point)
- 3: Basic integration working (3 points)
- 4: Production-ready system (4 points)
- 5: Advanced ML infrastructure (5 points)

---

### Q2: Data Pipeline & Analytics Infrastructure
**Category**: Tech Stack Assessment  
**Weight**: 15%

**Question**:
> How mature is your current data pipeline and analytics infrastructure?

**Options** (with hidden score):
- [ ] 1 - We export data manually to analyze it; no automated data pipeline exists
- [ ] 2 - We have basic logging to a database, but limited structured analytics
- [ ] 3 - We have a data warehouse (Redshift, BigQuery, or Snowflake) with some ETL pipelines feeding it
- [ ] 4 - We have a comprehensive data pipeline with event streaming, transformation, and analytics dashboards
- [ ] 5 - We have a production-grade data platform with real-time streaming, feature stores, and ML-ready data sets

**Context** (shown to respondent):
*Why this matters*: ML models require clean, structured data. A mature data pipeline is the foundation for building reliable AI features. This tells us how much foundational work is needed.

**Scoring Logic**:
- 1: Manual data export (1 point)
- 2: Basic logging (2 points)
- 3: Data warehouse exists (3 points)
- 4: Comprehensive pipeline (4 points)
- 5: Production ML-ready data platform (5 points)

---

### Q3: PostgreSQL-Powered Analytics Capabilities
**Category**: Tech Stack Assessment  
**Weight**: 15%

**Question**:
> Your PostgreSQL database holds rich task metadata. How deeply are you currently leveraging it for analytics and insights?

**Options** (with hidden score):
- [ ] 1 - We use PostgreSQL mainly for transactional storage; we don't run complex analytical queries
- [ ] 2 - We run occasional reports on PostgreSQL, but performance is a concern for complex queries
- [ ] 3 - We have optimized PostgreSQL for reporting with proper indexing and materialized views
- [ ] 4 - We use PostgreSQL JSON capabilities and advanced features (window functions, partitioning) for insights
- [ ] 5 - We have a sophisticated PostgreSQL analytics layer with custom aggregations, feature engineering, and real-time metrics

**Context** (shown to respondent):
*Why this matters*: PostgreSQL can power many ML use cases directly (ranking, classification, anomaly detection). Your ability to extract features from it directly impacts AI feature development speed.

**Scoring Logic**:
- 1: Transactional only (1 point)
- 2: Occasional reports (2 points)
- 3: Optimized for reporting (3 points)
- 4: Advanced features leveraged (4 points)
- 5: Sophisticated analytics layer (5 points)

---

## Dimension 2: Product AI Readiness & Use Cases (3 questions)

### Q4: Current Product Gap: Intelligent Task Prioritization
**Category**: Industry-Specific Challenges (Project Management)  
**Weight**: 12%

**Question**:
> Task prioritization is a core pain point in project management. How do you currently handle it?

**Options** (with hidden score):
- [ ] 1 - Users manually set priority; there's no intelligent prioritization assistance
- [ ] 2 - We offer priority templates or heuristics (e.g., "high/medium/low"), but they're static
- [ ] 3 - We have basic smart prioritization (e.g., flagging overdue items, showing urgency)
- [ ] 4 - We have machine learning models suggesting task priority based on context
- [ ] 5 - We have AI-powered adaptive prioritization that learns from user behavior and continuously improves suggestions

**Context** (shown to respondent):
*Why this matters*: AI-powered prioritization is a major competitive differentiator in project management. Early movers can capture significant market share.

**Scoring Logic**:
- 1: Manual only (1 point)
- 2: Static heuristics (2 points)
- 3: Basic smart features (3 points)
- 4: ML-powered suggestions (4 points)
- 5: Adaptive AI prioritization (5 points)

---

### Q5: Deadline & Risk Prediction
**Category**: Industry-Specific Challenges (Project Management)  
**Weight**: 12%

**Question**:
> Project delays are costly. Do you offer predictive insights on deadline risk or task completion time?

**Options** (with hidden score):
- [ ] 1 - No predictive features; users estimate deadlines manually with no risk assessment
- [ ] 2 - We show historical data or simple patterns (e.g., "similar tasks took X days"), but no predictions
- [ ] 3 - We have basic deadline prediction (e.g., linear extrapolation from historical velocity)
- [ ] 4 - We use machine learning to predict task duration and identify at-risk projects
- [ ] 5 - We have a sophisticated forecasting system with multiple models (time-series, contextual), confidence intervals, and risk stratification

**Context** (shown to respondent):
*Why this matters*: Deadline prediction reduces surprises and enables proactive project management. This is a high-value AI feature with clear ROI.

**Scoring Logic**:
- 1: Manual estimates only (1 point)
- 2: Historical patterns shown (2 points)
- 3: Basic prediction (3 points)
- 4: ML-powered forecasting (4 points)
- 5: Sophisticated multi-model system (5 points)

---

### Q6: Automated Insights & Status Reporting
**Category**: Business Model Opportunity (B2B SaaS Product Data)  
**Weight**: 12%

**Question**:
> Status reporting consumes time in most organizations. How do you help teams automate status updates?

**Options** (with hidden score):
- [ ] 1 - We have no automated reporting; teams manually write status updates
- [ ] 2 - We offer status templates to speed up manual entry
- [ ] 3 - We auto-generate some status elements (e.g., "X tasks completed this week")
- [ ] 4 - We use AI to generate natural language status summaries from activity data
- [ ] 5 - We have a fully AI-powered reporting system that generates executive summaries, risk alerts, and custom insights on demand

**Context** (shown to respondent):
*Why this matters*: Time saved on status reporting is directly monetizable. Teams value time savings highly. This is a quick-win AI feature.

**Scoring Logic**:
- 1: Manual only (1 point)
- 2: Templates (2 points)
- 3: Partial automation (3 points)
- 4: AI-powered summaries (4 points)
- 5: Full AI reporting system (5 points)

---

## Dimension 3: Business & Data-Driven Operations (2 questions)

### Q7: Customer Support & Issue Triage
**Category**: Business Model Opportunity (SaaS Operations)  
**Weight**: 10%

**Question**:
> How is customer support currently organized, and are you using AI to improve efficiency?

**Options** (with hidden score):
- [ ] 1 - We have a manual support queue; no automation or AI assist
- [ ] 2 - We use a basic helpdesk tool with tagging/categorization, but no AI
- [ ] 3 - We have some automation (e.g., auto-replies, basic ticket routing)
- [ ] 4 - We use AI for ticket categorization, priority routing, or suggested responses
- [ ] 5 - We have an end-to-end AI-powered support system with intelligent triage, auto-resolution, and proactive issue detection

**Context** (shown to respondent):
*Why this matters*: AI-powered support is one of the fastest ROI improvements. It directly impacts customer satisfaction and operational cost.

**Scoring Logic**:
- 1: Manual support queue (1 point)
- 2: Basic helpdesk (2 points)
- 3: Some automation (3 points)
- 4: AI-assisted triage (4 points)
- 5: Full AI support system (5 points)

---

### Q8: Sales & Customer Data Intelligence
**Category**: Business Model Opportunity (SaaS Sales/CS)  
**Weight**: 10%

**Question**:
> Do you leverage AI or machine learning to understand and act on customer data for sales and retention?

**Options** (with hidden score):
- [ ] 1 - We have no customer data analysis; sales and CS are based on manual outreach
- [ ] 2 - We track basic CRM data and metrics, but insights are manual
- [ ] 3 - We have dashboards and reports showing customer health, churn risk, or upsell opportunities
- [ ] 4 - We use predictive models for churn, expansion, or customer segmentation
- [ ] 5 - We have AI-powered customer intelligence with real-time recommendations, propensity models, and automated outreach optimization

**Context** (shown to respondent):
*Why this matters*: AI-driven customer intelligence directly impacts revenue. Retention and expansion are significant levers for SaaS growth.

**Scoring Logic**:
- 1: No analysis (1 point)
- 2: Manual insights (2 points)
- 3: Dashboards and reports (3 points)
- 4: Predictive models (4 points)
- 5: Full AI customer intelligence (5 points)

---

## Dimension 4: Organizational & Team Readiness (3 questions)

### Q9: Data Engineering & ML Expertise
**Category**: Organizational Readiness  
**Weight**: 13%

**Question**:
> What's your current team's experience with machine learning, data engineering, or data science?

**Options** (with hidden score):
- [ ] 1 - No one on the team has ML/data engineering experience; we'd be starting from scratch
- [ ] 2 - We have 1-2 team members with some data experience, but not specialized data engineers or ML engineers
- [ ] 3 - We have a data analyst or junior data engineer on staff; basic ML literacy in the engineering team
- [ ] 4 - We have a dedicated data engineer and/or ML engineer, plus multiple engineers with hands-on ML experience
- [ ] 5 - We have a mature data/ML team (data scientists, ML engineers, data architects) with deep production experience

**Scoring Logic**:
- 1: No ML/data expertise (1 point)
- 2: 1-2 people with some experience (2 points)
- 3: Data analyst/junior DE (3 points)
- 4: Dedicated specialists (4 points)
- 5: Mature data/ML team (5 points)

**Context** (shown to respondent):
*Why this matters*: We tailor the curriculum based on your team's baseline. If you have zero ML experience, we start with fundamentals. If you have specialists, we focus on advanced architectures.

---

### Q10: Engineering Culture & Technical Experimentation
**Category**: Organizational Readiness  
**Weight**: 13%

**Question**:
> How does your engineering culture approach new technologies and technical experimentation?

**Options** (with hidden score):
- [ ] 1 - We're risk-averse; we stick with proven, battle-tested technologies
- [ ] 2 - We occasionally pilot new tech, but mostly maintain legacy approaches
- [ ] 3 - We have a balanced approach; we're willing to experiment with emerging tech in defined projects
- [ ] 4 - We actively encourage technical experimentation; we have innovation sprints or R&D time
- [ ] 5 - We have a strong culture of innovation; we're early adopters, we invest in R&D, and we've successfully shipped experimental features

**Scoring Logic**:
- 1: Risk-averse (1 point)
- 2: Occasional pilots (2 points)
- 3: Balanced approach (3 points)
- 4: Active experimentation (4 points)
- 5: Strong innovation culture (5 points)

**Context** (shown to respondent):
*Why this matters*: ML projects are experimental by nature. We need to understand your team's comfort with uncertainty and iteration to design realistic timelines.

---

### Q11: Product Leadership & Strategic Alignment
**Category**: Organizational Readiness  
**Weight**: 13%

**Question**:
> How aligned is leadership on making AI/ML a strategic priority for your product?

**Options** (with hidden score):
- [ ] 1 - AI is not a stated priority; we're focused on other features/improvements
- [ ] 2 - We see AI as important but it's not explicitly funded or prioritized
- [ ] 3 - We've allocated some roadmap space to AI features; there's executive buy-in but not deep strategic focus
- [ ] 4 - AI is a strategic pillar; it's explicitly on the roadmap and funded for the next 2-3 quarters
- [ ] 5 - AI is central to our product strategy; we're investing heavily (team, budget, roadmap focus) and positioned as a differentiator

**Scoring Logic**:
- 1: Not a priority (1 point)
- 2: Seen as important but not funded (2 points)
- 3: Some roadmap space allocated (3 points)
- 4: Strategic pillar (4 points)
- 5: Central to strategy (5 points)

**Context** (shown to respondent):
*Why this matters*: Strategic alignment determines success. Without leadership buy-in and resources, ML initiatives stall. This question helps us understand the true level of organizational commitment.

---

## Scoring Summary

### Dimension Breakdown

| Dimension | Questions | Weight | Max Score |
|-----------|-----------|--------|-----------|
| Tech Stack & Infrastructure | Q1-Q3 | 45% | 15 |
| Product AI Readiness | Q4-Q6 | 36% | 12 |
| Business Operations | Q7-Q8 | 20% | 10 |
| Org & Team Readiness | Q9-Q11 | 39% | 15 |
| **TOTAL** | **11** | **100%** | **52** |

### AI Maturity Level Calculation

```
Raw Score = Sum of all question scores (max 52)
Normalized Score = (Raw Score / 52) × 5.0
AI Maturity Level = Rounded to 1 decimal place (1.0 - 5.0)
```

### Maturity Level Interpretation

| Level | Range | Status | Meaning |
|-------|-------|--------|---------|
| Expert | 4.5-5.0 | ⭐⭐⭐⭐⭐ | Industry leader in AI/ML adoption |
| Advanced | 3.5-4.4 | ⭐⭐⭐⭐ | Mature AI operations, multiple models in production |
| Developing | 2.5-3.4 | ⭐⭐⭐ | Active ML work, foundation building |
| Initial | 1.5-2.4 | ⭐⭐ | Early exploration, no production ML |
| Not Started | 1.0-1.4 | ⭐ | No AI/ML capabilities |

---

## Expected Response Profile for Velocity Labs

Based on the company profile analysis:

**Likely Score Range**: 2.3 - 3.1 (Initial to Developing)

**Predicted Response Pattern**:
- **Tech Stack Questions (Q1-Q3)**: Score 2-3 (aware but not implemented)
- **Product Questions (Q4-Q6)**: Score 2-3 (gaps identified, not addressed)
- **Business Operations (Q7-Q8)**: Score 1-2 (pre-AI support operations)
- **Team Readiness (Q9-Q11)**: Score 2-3 (some data awareness, strong engineering, unclear strategy)

**Key Gap Indicators**:
- No ML/data engineering team (Q9 = 1-2)
- Emerging data infrastructure (Q2 = 2-3)
- No AI product features yet (Q4-Q6 = 1-2)
- Unclear strategic AI commitment (Q11 likely 2-3)

---

## Curriculum Recommendations (Template)

Once responses are received, curriculum will be tailored to address top gaps:

**If Q1-Q3 are low (Tech Stack)**: 
- Focus on ML infrastructure setup, data pipeline creation, feature engineering

**If Q4-Q6 are low (Product AI)**:
- Focus on product use cases, ranking/classification algorithms, production ML

**If Q7-Q8 are low (Business)**:
- Focus on business case development, ROI calculation, customer intelligence

**If Q9-Q11 are low (Team)**:
- Focus on foundational ML concepts, hands-on labs, team upskilling

---

**Generated by**: ainext-company-analyzer skill v1.0  
**Next Step**: Share this assessment form with Velocity Labs team; responses will auto-generate curriculum recommendations.
