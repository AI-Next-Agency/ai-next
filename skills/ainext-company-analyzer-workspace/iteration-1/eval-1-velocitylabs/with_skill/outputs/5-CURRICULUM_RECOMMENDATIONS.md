# Velocity Labs - AI Education Curriculum (Custom Path)

**Company**: Velocity Labs  
**Generated**: 2026-04-24  
**Team Size**: 30 people  
**Tech Stack**: Node.js, React, PostgreSQL, AWS  
**Expected Maturity**: 2.3-3.1/5.0 (Initial to Developing)

---

## Executive Summary

Velocity Labs is at an inflection point. They have:
- ✅ **Strong technical foundation** (modern stack, SaaS operations)
- ✅ **Clear product opportunities** (AI-powered prioritization, forecasting)
- ✅ **Market momentum** (Series B, competitive landscape)
- ❌ **ML/Data infrastructure gap** (no data pipeline, no ML team)
- ❌ **Team expertise gap** (no ML engineers, limited data literacy)

**Recommendation**: 12-month structured program focused on:
1. **Months 1-3**: Foundation building (infrastructure, team upskilling)
2. **Months 4-6**: First AI feature to production (quick win + infrastructure)
3. **Months 7-12**: Sustained innovation (multiple AI capabilities, competitive differentiation)

**Expected Outcome**: From "pre-ready" (2.5) → "developing" (3.5) → "advanced" (4.0) maturity by month 12.

---

## Curriculum Structure

### Tier 1: Foundation (Months 1-3)

**Goal**: Build team knowledge and infrastructure foundation  
**Duration**: 12 weeks  
**Effort**: 5-8 hours/week for core team  
**Team Focus**: 4-6 engineers (2 backend, 2 frontend, 1-2 dedicated data/ML)

#### Module 1.1: ML Fundamentals for Engineers
**Duration**: 3 weeks  
**Audience**: All engineers  

**Topics**:
- What is machine learning? (supervised, unsupervised, reinforcement)
- Why and when to use ML (not a cure-all)
- ML project lifecycle and common pitfalls
- Bias, fairness, and ethical considerations
- ROI calculation and business metrics

**Deliverables**:
- Team completes ML fundamentals course (online or instructor-led)
- Each engineer submits a "ML use case analysis" for Velocity Labs
- Team discussion: Top 3 high-ROI use cases

**Resources**:
- Andrew Ng's ML Basics course (Coursera, 10 hours)
- Fast.ai Practical Deep Learning course (top-down approach)
- Internal workshop: ML ROI for SaaS products

**Success Metric**: 80%+ team completion of fundamentals course

---

#### Module 1.2: Data Architecture Deep Dive
**Duration**: 4 weeks  
**Audience**: Backend engineers, DevOps, product managers

**Topics**:
- Extracting signals from Velocity Labs data
- Feature engineering from task/project metadata
- Time-series feature creation (deadlines, velocity)
- Building a data pipeline (ETL basics)
- Data warehouse design (Redshift vs BigQuery vs Snowflake)

**Hands-On Labs**:
1. **Data Extraction Lab**: Write PostgreSQL queries to extract features from production data
   - Task completion velocity by team
   - Deadline accuracy by category
   - Priority distribution patterns
   
2. **Feature Engineering Lab**: Design features for task prioritization model
   - Calculate task complexity score
   - Extract team capacity metrics
   - Create recency/freshness features
   
3. **Data Pipeline Lab**: Build simple ETL pipeline
   - Copy PostgreSQL data to data warehouse
   - Transform and aggregate
   - Create views for analysis
   
4. **Data Quality Lab**: Assess and clean production data
   - Identify missing/invalid fields
   - Handle outliers
   - Create data quality dashboards

**Deliverables**:
- Documented feature engineering design (for task prioritization)
- Working ETL pipeline (daily refresh)
- Data quality report with recommendations

**Technology Stack**:
- PostgreSQL (source)
- DuckDB (prototyping) or AWS Redshift (production)
- Apache Airflow or simple cron jobs (orchestration)
- dbt (transformation)

**Success Metric**: Complete data pipeline running daily, with 95%+ data quality

---

#### Module 1.3: ML Infrastructure & Tooling
**Duration**: 4 weeks  
**Audience**: Backend engineers, DevOps, one dedicated ML engineer (new or elevated from team)

**Topics**:
- ML model serving basics (batching vs real-time)
- Containerization (Docker) for ML models
- Model registry and versioning (MLflow, Hugging Face Hub)
- Monitoring ML models (predictions, drift, performance)
- CI/CD for ML (testing models, A/B testing)

**Hands-On Labs**:
1. **Model Serving Lab**: Deploy a simple model in Node.js
   - Use TensorFlow.js for lightweight models
   - Or call Python API from Node
   - Measure latency and optimize
   
2. **Model Registry Lab**: Set up MLflow
   - Log experimental models
   - Track hyperparameters and metrics
   - Create reproducible pipelines
   
3. **Monitoring Lab**: Implement model monitoring
   - Track prediction distributions
   - Detect data drift
   - Monitor API latency
   
4. **CI/CD Lab**: Automate model testing and deployment
   - Unit tests for model
   - Integration tests
   - Gradual rollout (canary deployment)

**Deliverables**:
- Working model serving pipeline
- MLflow registry with 3+ model versions
- Monitoring dashboard
- Automated CI/CD workflow for model updates

**Technology Stack**:
- Docker (containerization)
- MLflow (model registry)
- Prometheus/Grafana (monitoring)
- GitHub Actions (CI/CD)
- Node.js wrapper for model serving

**Success Metric**: Deploy and monitor a trained model in production

---

### Tier 2: First AI Feature (Months 4-6)

**Goal**: Ship first AI-powered feature to production  
**Duration**: 12 weeks  
**Team Focus**: 2-3 core engineers + full engineering team supporting

#### Module 2.1: Task Prioritization Model (Quick Win)
**Duration**: 6 weeks  
**Scope**: Intelligent task prioritization for Velocity Labs users

**Problem Statement**:
Users spend time manually prioritizing tasks. Velocity Labs can learn from historical patterns to suggest priorities, saving time and improving focus.

**ML Approach**:
- **Model Type**: Classification (High/Medium/Low priority ranking)
- **Features**: Task metadata (title, description, assignee, project context, deadlines, team velocity)
- **Algorithm**: Gradient Boosted Trees (XGBoost) or Neural Network
- **Training Data**: Historical task data (past 6-12 months)

**Week 1-2: Problem Definition & Data Preparation**
- Define priority labels from historical data (e.g., tasks marked done quickly = high priority?)
- Create labeled dataset from completed tasks
- Split into train/validation/test sets
- Create feature matrix

**Week 3-4: Model Development & Experimentation**
- Baseline model (simple heuristics for comparison)
- XGBoost model (gradient boosting)
- Neural network variant (if time permits)
- Hyperparameter tuning
- Cross-validation and evaluation
- Feature importance analysis

**Week 5: Productionization**
- Model serialization (save trained model)
- Create scoring API (Node.js wrapper)
- Integration with Velocity Labs backend
- Latency optimization (<100ms per prediction)
- Error handling and fallbacks

**Week 6: Rollout & Monitoring**
- A/B test: Control (no suggestions) vs Treatment (AI suggestions)
- Metrics: User engagement, adoption rate, task completion time
- Monitor model performance and data drift
- Collect user feedback
- Iterate on model based on feedback

**Deliverables**:
- Trained prioritization model (XGBoost)
- Node.js scoring service
- A/B test harness and metrics
- Monitoring dashboard
- Documentation for future improvements

**Success Metrics**:
- Model accuracy: 75%+ on validation set
- Latency: <100ms per prediction
- Adoption: 30%+ of tasks use AI suggestion
- User engagement: 15%+ increase in task completion rate

**User Experience**:
```
Task: "Write quarterly product roadmap"
Current: Users manually select High/Medium/Low

After AI:
Task: "Write quarterly product roadmap"
AI Suggestion: "High Priority" (based on deadline, team velocity, assignment patterns)
User sees: "Smart Priority: High" badge with option to override
```

---

#### Module 2.2: Model Evaluation & Statistical Testing
**Duration**: 2 weeks  
**Parallel with 2.1**

**Topics**:
- Classification metrics (precision, recall, F1, AUC)
- A/B testing for ML (how to measure impact)
- Statistical significance testing
- Common pitfalls in ML evaluation

**Hands-On**:
- Evaluate task prioritization model using multiple metrics
- Design A/B test for priority suggestions
- Analyze results and draw conclusions
- Document decision framework for future models

---

#### Module 2.3: Scaling & Production ML
**Duration**: 4 weeks  
**Parallel with 2.1-2.2**

**Topics**:
- Batch vs real-time predictions
- Handling model updates
- Monitoring for data drift
- Retraining schedules
- Cost optimization

**Hands-On**:
- Set up daily model retraining
- Implement data drift detection
- Create alerts for model degradation
- Optimize serving infrastructure (latency vs cost)

**Deliverables**:
- Automated retraining pipeline
- Drift detection system
- Cost analysis and optimization

---

### Tier 3: Scale & Sustained Innovation (Months 7-12)

**Goal**: Build 2-3 additional AI capabilities, establish ML as competitive differentiator  
**Team**: Establish dedicated ML team (1-2 dedicated engineers) + product/engineering support

#### Module 3.1: Deadline Prediction Model (High Impact)
**Duration**: 8 weeks

**Problem**: Help teams set realistic deadlines and identify at-risk projects early.

**Approach**:
- **Model Type**: Regression (predict task/project duration) + Risk Classifier (is this at-risk?)
- **Features**: Historical completion times, team capacity, task complexity, dependencies
- **Algorithm**: Time-series forecasting (Prophet, LSTM) or Gradient Boosting

**Phases**:
1. Data analysis: Historical deadline accuracy, completion time distributions
2. Feature engineering: Temporal features, team velocity, project context
3. Model development: Baseline (average), time-series model, ensemble
4. Evaluation: Forecast accuracy, calibration (are estimates reliable?)
5. Productionization: Confidence intervals, risk stratification
6. Rollout: Show predicted range + risk flags to users
7. Monitoring: Forecast accuracy vs actual, user feedback

**Unique Value**:
- Reduce deadline surprises
- Proactive risk identification
- Data-driven project planning

---

#### Module 3.2: Anomaly Detection for Project Risk
**Duration**: 6 weeks

**Problem**: Identify projects at risk of delay or failure before obvious signs emerge.

**Approach**:
- **Model Type**: Unsupervised anomaly detection (Isolation Forest, LOF)
- **Features**: Velocity metrics, velocity changes, team changes, blockers, communication patterns
- **Signal**: Flag projects with unusual patterns early

**Deliverables**:
- Risk scoring model
- Real-time alerts to team leads
- Dashboard showing at-risk projects

---

#### Module 3.3: NLP for Automated Insights
**Duration**: 6 weeks

**Problem**: Generate intelligent, natural-language status summaries and insights.

**Approach**:
- **Use LLMs**: GPT-4, Anthropic Claude, or open-source alternatives
- **Prompts**: Summarization, insight generation, anomaly explanation
- **Features**: Feed model with task activity, completion data, team metrics

**Deliverables**:
- Executive summary generation
- Risk explanation in natural language
- Weekly digest automation

---

#### Module 3.4: Team Recommendations & Optimization
**Duration**: 4 weeks

**Problem**: Suggest optimal team member assignment for tasks based on skills, availability, and learning goals.

**Approach**:
- **Model Type**: Ranking/recommendation system (collaborative filtering + content-based)
- **Features**: Task requirements, team member skills, availability, past performance
- **Algorithm**: Factorization machines or neural collaborative filtering

**Deliverables**:
- Team member recommendation engine
- Skill gap analysis
- Learning opportunity identification

---

#### Module 3.5: Advanced Topics (Pick 2-3)
**Duration**: 8 weeks (rotating, not all at once)

**Options**:
1. **Causal Inference**: Understand which factors actually drive deadline overruns
2. **Reinforcement Learning**: Optimize resource allocation dynamically
3. **Graph Neural Networks**: Model task dependencies and team networks
4. **Explainability**: Make models transparent and trustworthy to users
5. **Federated Learning**: Privacy-preserving models for multi-workspace setups

---

## Team Composition & Hiring

### Current Team (Estimated)
- 20 backend/frontend engineers
- Some infrastructure/DevOps experience
- **Gap**: No dedicated ML/data engineer

### Recommended Additions (Year 1)

| Role | FTE | Timeline | Responsibilities |
|------|-----|----------|------------------|
| **ML Engineer** | 1.0 | Month 1 | Lead ML projects, model development, production ML |
| **Data Engineer** | 0.5-1.0 | Month 1-2 | Build data pipelines, ETL, data warehouse |
| **Product Manager (AI)** | 0.5 | Month 3-4 | Define AI product strategy, prioritize use cases |
| **ML/Data Intern** | 0.5 | Month 6 | Support experiments, data analysis |

### Skills to Develop Internally (Existing Team)
- 2-3 backend engineers: ML infrastructure, model serving
- 1-2 frontend engineers: AI feature UX, explanations
- 1-2 product managers: AI use case identification
- Leadership: AI strategy, investment decisions

---

## Timeline & Milestones

### Month 1-3: Foundation
- **Week 1-2**: Team kickoff, baseline assessment, goal setting
- **Week 3-4**: ML fundamentals course completion
- **Week 5-8**: Data architecture work, pipeline development
- **Week 9-12**: ML infrastructure setup, experimentation environment
- **Milestone**: Team can build and deploy simple ML models

### Month 4-6: First Feature
- **Week 1-2**: Task prioritization data preparation and exploration
- **Week 3-6**: Model development and experimentation
- **Week 7-8**: Productionization and integration
- **Week 9-12**: A/B testing, rollout, monitoring
- **Milestone**: Task prioritization feature live to 100% of users, validated with A/B test

### Month 7-9: Second Feature
- **Week 1-2**: Problem scoping (deadline prediction selected)
- **Week 3-6**: Model development
- **Week 7-9**: Productionization and rollout
- **Milestone**: Deadline prediction live with monitoring

### Month 10-12: Scale & Consolidate
- **Week 1-4**: 3rd capability (anomaly detection or insights)
- **Week 5-8**: Team consolidation, best practices documentation
- **Week 9-12**: Strategic planning for year 2
- **Milestone**: 3 AI capabilities in production, team ready for independent iteration

---

## Investment Required

### Team Costs (Annual)
| Role | Cost | Duration |
|------|------|----------|
| ML Engineer hire | $150-180K | 12 months |
| Data Engineer (part-time) | $60-80K | 12 months |
| PM (AI, part-time) | $50-70K | 9 months (starts month 3) |
| Training & courses | $10-15K | 12 months |
| **Total** | **$270-345K** | **Year 1** |

### Infrastructure Costs (Annual)
| Component | Cost | Notes |
|-----------|------|-------|
| Data warehouse (BigQuery/Redshift) | $15-25K | ~1TB data, shared with analytics |
| ML infrastructure (SageMaker, Databricks) | $10-20K | Model training, feature store |
| Monitoring & observability | $5-10K | Prometheus, Datadog, custom dashboards |
| **Total** | **$30-55K** | **Year 1** |

### Total Investment: ~$300-400K

**ROI Timeline**:
- Month 6: First feature live (qualitative + engagement improvements)
- Month 9: Measurable business impact (time savings, better decisions)
- Month 12: Full ROI realization (revenue retention, expansion, differentiation)

---

## Curriculum Materials

### Pre-Course (Week 0)
- [ ] Enroll team in ML Fundamentals (Fast.ai or Coursera)
- [ ] Set up development environment (Python, Jupyter, TensorFlow)
- [ ] Create internal Slack channel: #ml-projects
- [ ] Schedule weekly team meetings (1 hour)

### Month 1-3 Readings
- **Mandatory**: 
  - "An Introduction to Statistical Learning" (James et al.) - Chapters 1-4
  - "Feature Engineering for Machine Learning" (Zheng & Casari)
  - Velocity Labs data dictionary and schema documentation
  
- **Recommended**:
  - "Machine Learning Yearning" (Andrew Ng)
  - "The Hundred-Page Machine Learning Book"
  - PostgreSQL query optimization guide
  - dbt documentation

### Month 4-6 Resources
- XGBoost documentation and tutorials
- Scikit-learn user guide
- Model evaluation best practices
- A/B testing design guide
- MLflow documentation

### Month 7-12 Advanced
- Time-series forecasting (Prophet, ARIMA)
- NLP fundamentals and LLM APIs
- Graph neural networks (PyTorch Geometric)
- Causal inference basics (Causal ML, DoWhy)

---

## Success Metrics & Checkpoints

### Month 3 Checkpoint: Foundation Complete
- ✅ Team completed ML fundamentals
- ✅ Data pipeline running daily (95%+ uptime)
- ✅ ML infrastructure deployed (model serving, monitoring)
- ✅ First experimental model trained and evaluated
- ✅ Team can define success metrics for use cases
- **Expected Maturity Score**: 2.8/5.0

### Month 6 Checkpoint: First Feature Live
- ✅ Task prioritization model in production
- ✅ 30%+ adoption (users using AI suggestions)
- ✅ A/B test shows positive impact on engagement
- ✅ 75%+ model accuracy on validation set
- ✅ <100ms latency for predictions
- ✅ Monitoring system detects drift
- **Expected Maturity Score**: 3.3/5.0

### Month 9 Checkpoint: Second Feature + Scale
- ✅ 3 AI capabilities in production
- ✅ Dedicated ML team operational
- ✅ Automated retraining pipeline
- ✅ Data governance and quality standards defined
- ✅ Team delivering features independently
- **Expected Maturity Score**: 3.8/5.0

### Month 12 Checkpoint: Sustained Innovation
- ✅ 3+ AI features generating user value
- ✅ AI as product differentiator (in messaging)
- ✅ Team capacity for continuous innovation
- ✅ ML infrastructure mature and scalable
- ✅ Strategy defined for year 2
- **Expected Maturity Score**: 4.0/5.0 (Advanced)

---

## Risk Mitigation

### Common Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| ML team hire delays | High | Start with external consulting support; upskill internal engineers in parallel |
| Data quality issues | High | Invest heavily in data validation (Week 1-2); make data quality non-negotiable |
| Model underperformance | Medium | Set realistic baselines; have fallback strategies (rule-based, no suggestions) |
| Engineering time constraints | High | Dedicate full-time engineers to ML projects; don't treat it as "side work" |
| Organizational misalignment | Medium | Weekly exec updates; clear ROI communication; align with product strategy |
| Model drift in production | Medium | Implement monitoring week 1; retraining automation mandatory |
| Scope creep | High | Ruthlessly prioritize; ship simple features quickly; iterate based on feedback |

---

## Next Steps

1. **This Week**:
   - Review and approve curriculum plan
   - Begin ML engineer/data engineer hiring (3-4 week lead time)
   - Enroll team in ML fundamentals course

2. **Week 2**:
   - Kick off with team (vision, timeline, commitments)
   - Set up development infrastructure
   - Begin data exploration and quality assessment

3. **Week 3+**:
   - Start Module 1.1 (ML Fundamentals)
   - Parallelize Modules 1.2 and 1.3 (Data Architecture, Infrastructure)
   - Weekly team meetings to track progress

---

## Customization Notes

This curriculum is tailored to Velocity Labs specifically:

- **Tech Stack Match**: Uses Node.js, React, PostgreSQL, AWS (their stack)
- **Use Cases**: Task prioritization, deadline prediction, insights (their business)
- **Team Size**: 30-person company (realistic timelines and scope)
- **Series B Stage**: Assumes resources available; right balance of innovation and execution
- **Competitive Context**: Project management AI is differentiator in their market

If assessment results differ from expectations, curriculum will be adjusted:
- **If technical readiness is higher**: Accelerate to advanced topics
- **If team expertise lower**: Extend foundation phase by 4-6 weeks
- **If org alignment unclear**: Add strategic alignment workshop (week 2)

---

**Generated by**: ainext-company-analyzer skill v1.0  
**Status**: Ready for Approval and Execution  
**Next Review**: After Month 3 checkpoint
