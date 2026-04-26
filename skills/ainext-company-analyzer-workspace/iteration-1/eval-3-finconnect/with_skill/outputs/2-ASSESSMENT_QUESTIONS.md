# FinConnect Assessment Questions

**Company**: FinConnect (Payment Infrastructure Fintech)  
**Assessment Date**: 2026-04-24  
**Question Count**: 12 questions across 4 dimensions  
**Estimated Completion Time**: 20-25 minutes  
**Compliance Focus**: HIGH - Fraud detection, risk management, regulatory compliance

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

## Dimension 1: Real-Time Fraud Detection (4 questions, 40% weight)

### Q1: Current Fraud Detection Capabilities
**Category**: Fraud Detection & Prevention  
**Weight**: 10%

**Question**:
> How do you currently detect fraudulent transactions in real-time?

**Options** (with hidden score):
- [ ] 1 - Manual review only; we rely on customer complaints to identify fraud
- [ ] 2 - Basic rule-based fraud detection (e.g., velocity checks, geographic anomalies)
- [ ] 3 - Rule-based system with some machine learning features; limited false positive tuning
- [ ] 4 - Production ML system for fraud classification with good accuracy and tuning
- [ ] 5 - Sophisticated ensemble ML system with continuous learning and optimization

**Context** (shown to respondent):
*Why this matters*: Real-time fraud detection is critical for payment processors. Machine learning can reduce fraud losses and chargebacks while minimizing legitimate transaction decline.

**Scoring Logic**:
- 1: Manual only (0 points)
- 2: Basic rules (2 points)
- 3: Rules + some ML (3 points)
- 4: Production ML (4 points)
- 5: Advanced ensemble system (5 points)

---

### Q2: Real-Time Transaction Monitoring Infrastructure
**Category**: Real-Time Data Processing  
**Weight**: 10%

**Question**:
> What is your current real-time transaction monitoring infrastructure?

**Options** (with hidden score):
- [ ] 1 - No real-time monitoring; we batch-process transactions for fraud detection
- [ ] 2 - Basic real-time alerting (e.g., email alerts on suspicious patterns)
- [ ] 3 - Real-time monitoring with automated responses (block/flag) for some rules
- [ ] 4 - Real-time ML serving for fraud scoring with <200ms latency
- [ ] 5 - Sub-100ms ML inference with stream processing, feature engineering, and adaptive scoring

**Context** (shown to respondent):
*Why this matters*: Payment processors need sub-second latency for fraud detection. This infrastructure determines whether you can deploy sophisticated ML in production.

**Scoring Logic**:
- 1: No real-time capability (0 points)
- 2: Basic alerting (1 point)
- 3: Automated responses (3 points)
- 4: Real-time ML serving (4 points)
- 5: Sub-100ms inference (5 points)

---

### Q3: Chargeback Analysis & Prediction
**Category**: Fraud Detection & Risk Management  
**Weight**: 10%

**Question**:
> How do you currently manage chargebacks and fraud disputes?

**Options** (with hidden score):
- [ ] 1 - Reactive: we respond to chargebacks after customers dispute transactions
- [ ] 2 - We track chargeback patterns and try to identify problem merchants/cards
- [ ] 3 - Basic predictive analysis: we can flag high-risk transactions before they become chargebacks
- [ ] 4 - ML-based chargeback prediction; we can reduce chargeback rate by 10-20%
- [ ] 5 - Predictive system integrated with transaction approval, reducing chargebacks by 30%+ with optimization

**Context** (shown to respondent):
*Why this matters*: Chargebacks are expensive (typically $100-300 per dispute). Predicting and preventing them before they occur is a high-ROI AI investment.

**Scoring Logic**:
- 1: Reactive only (1 point)
- 2: Pattern analysis (2 points)
- 3: Basic prediction (3 points)
- 4: ML prediction, 10-20% reduction (4 points)
- 5: Integrated system, 30%+ reduction (5 points)

---

### Q4: Transaction Risk Scoring & Approval Optimization
**Category**: Fraud Prevention & Business Logic  
**Weight**: 10%

**Question**:
> How do you decide which transactions to approve, flag, or decline?

**Options** (with hidden score):
- [ ] 1 - Fixed thresholds or rules; minimal risk assessment
- [ ] 2 - Rules-based system with merchant-level risk profiles
- [ ] 3 - Some ML-based risk scoring; dynamic approval thresholds
- [ ] 4 - ML risk model with merchant and transaction context; tuned approval rates
- [ ] 5 - Sophisticated multi-model risk system optimized for both fraud prevention and approval rates

**Context** (shown to respondent):
*Why this matters*: Approval rate optimization is critical for revenue. Machine learning can reduce false declines of legitimate transactions while maintaining fraud control.

**Scoring Logic**:
- 1: Fixed thresholds (1 point)
- 2: Rules-based merchant profiles (2 points)
- 3: Basic ML scoring (3 points)
- 4: ML with tuning (4 points)
- 5: Multi-model optimization (5 points)

---

## Dimension 2: Compliance & Regulatory Requirements (3 questions, 30% weight)

### Q5: Regulatory Compliance & AML/KYC Implementation
**Category**: Anti-Money Laundering / Know Your Customer  
**Weight**: 10%

**Question**:
> How mature is your AML/KYC (Know Your Customer) compliance program?

**Options** (with hidden score):
- [ ] 1 - Basic customer verification at onboarding; limited ongoing monitoring
- [ ] 2 - AML/KYC process in place; manual review for suspicious patterns
- [ ] 3 - Automated AML screening against sanctions lists; some transaction monitoring
- [ ] 4 - Comprehensive automated AML/KYC with ML-enhanced monitoring and alerts
- [ ] 5 - Advanced ML-powered AML system with real-time screening, risk scoring, and regulatory reporting automation

**Context** (shown to respondent):
*Why this matters*: AML/KYC compliance is mandatory and heavily regulated. Machine learning can automate detection and reduce regulatory risk while improving efficiency.

**Scoring Logic**:
- 1: Basic verification only (1 point)
- 2: Manual monitoring (2 points)
- 3: Automated sanctions screening (3 points)
- 4: ML-enhanced monitoring (4 points)
- 5: Advanced ML + automation (5 points)

---

### Q6: Data Privacy, Encryption & Security Infrastructure
**Category**: Data Governance & Compliance  
**Weight**: 10%

**Question**:
> How mature is your data privacy and security framework?

**Options** (with hidden score):
- [ ] 1 - Basic security (PCI-DSS compliance); limited data governance
- [ ] 2 - PCI-DSS compliant with some data segregation and encryption
- [ ] 3 - Comprehensive security: encryption, tokenization, access controls, audit logging
- [ ] 4 - Advanced security + privacy-by-design; GDPR/CCPA compliance, data minimization
- [ ] 5 - Sophisticated governance: encrypted ML features, differential privacy, privacy-preserving inference

**Context** (shown to respondent):
*Why this matters*: Payment data is highly sensitive. Privacy-preserving ML techniques can enable sophisticated models without exposing customer data to regulatory risk.

**Scoring Logic**:
- 1: Basic PCI-DSS (1 point)
- 2: PCI + some segregation (2 points)
- 3: Comprehensive security (3 points)
- 4: Advanced + privacy compliance (4 points)
- 5: Privacy-preserving ML (5 points)

---

### Q7: Model Explainability & Regulatory Audit Trail
**Category**: ML Governance & Compliance  
**Weight**: 10%

**Question**:
> Can you explain ML-based decisions (fraud/decline) to customers and regulators?

**Options** (with hidden score):
- [ ] 1 - No ML models deployed; manual decisions only
- [ ] 2 - ML deployed but limited explainability; hard to explain to customers
- [ ] 3 - Models are explainable in theory; basic audit logging in place
- [ ] 4 - Production audit trail for all ML decisions; explainability methods implemented
- [ ] 5 - Comprehensive governance: model cards, decision explanations, regulatory reporting, bias monitoring

**Context** (shown to respondent):
*Why this matters*: Regulators increasingly require explainable AI. You must be able to justify fraud blocks and declines to customers and regulatory authorities.

**Scoring Logic**:
- 1: No ML models (0 points)
- 2: ML but low explainability (1 point)
- 3: Explainable in theory (2 points)
- 4: Audit trail in production (4 points)
- 5: Comprehensive governance (5 points)

---

## Dimension 3: Real-Time Data Processing & Infrastructure (2 questions, 20% weight)

### Q8: Stream Processing & Feature Engineering Pipeline
**Category**: Data Engineering & ML Infrastructure  
**Weight**: 10%

**Question**:
> How do you handle real-time feature engineering for transaction scoring?

**Options** (with hidden score):
- [ ] 1 - We compute features in batch; no real-time ML features available
- [ ] 2 - Basic real-time features (e.g., velocity counters); limited sophisticated features
- [ ] 3 - Streaming pipeline with structured features; some real-time feature engineering
- [ ] 4 - Mature stream processing (Kafka/Kinesis) with feature engineering
- [ ] 5 - Production-grade feature platform with real-time aggregations, feature store, and low latency

**Context** (shown to respondent):
*Why this matters*: Real-time features (velocity, frequency, patterns) are essential for effective fraud detection. Your feature pipeline determines model quality.

**Scoring Logic**:
- 1: Batch only (1 point)
- 2: Basic real-time (2 points)
- 3: Streaming pipeline (3 points)
- 4: Mature stream processing (4 points)
- 5: Feature platform + low latency (5 points)

---

### Q9: Python Backend ML Integration & Serving Latency
**Category**: ML Infrastructure & Engineering  
**Weight**: 10%

**Question**:
> How mature is your Python backend's ML serving infrastructure?

**Options** (with hidden score):
- [ ] 1 - No ML serving; backend is purely business logic
- [ ] 2 - Exploring ML; no production infrastructure yet
- [ ] 3 - Basic ML integration; models deployed but limited optimization
- [ ] 4 - Production ML serving with monitoring; <200ms latency for fraud scoring
- [ ] 5 - Advanced infrastructure: model registry, A/B testing, feature serving, <100ms latency

**Context** (shown to respondent):
*Why this matters*: Your Python backend is ideal for serving fraud detection models in real-time. ML infrastructure maturity determines deployment speed and reliability.

**Scoring Logic**:
- 1: No ML serving (0 points)
- 2: Exploring (1 point)
- 3: Basic integration (2 points)
- 4: Production serving, <200ms (4 points)
- 5: Advanced infrastructure, <100ms (5 points)

---

## Dimension 4: Payment Processing AI Opportunities (3 questions, 10% weight)

### Q10: Customer Risk Profiling & Merchant Segmentation
**Category**: Business Intelligence & AI Strategy  
**Weight**: 3%

**Question**:
> How do you currently assess merchant risk profiles?

**Options** (with hidden score):
- [ ] 1 - Limited risk assessment; manual underwriting based on company info
- [ ] 2 - Basic merchant categorization by industry and volume
- [ ] 3 - Some risk scoring based on chargeback history and transaction patterns
- [ ] 4 - ML-based merchant risk profiling; used for pricing and onboarding decisions
- [ ] 5 - Sophisticated ML system with behavioral clustering, dynamic risk adjustment, and real-time profiling

**Context** (shown to respondent):
*Why this matters*: Customer risk profiling enables risk-based pricing, smarter underwriting, and proactive risk management.

**Scoring Logic**:
- 1: Limited assessment (1 point)
- 2: Basic categorization (2 points)
- 3: Some ML scoring (3 points)
- 4: ML-based profiling (4 points)
- 5: Sophisticated system (5 points)

---

### Q11: Transaction Settlement & Reconciliation Optimization
**Category**: Operations & Efficiency  
**Weight**: 4%

**Question**:
> How automated is your transaction settlement and reconciliation process?

**Options** (with hidden score):
- [ ] 1 - Manual settlement and reconciliation process
- [ ] 2 - Mostly automated settlement; manual reconciliation for exceptions
- [ ] 3 - Automated settlement and basic reconciliation; limited anomaly detection
- [ ] 4 - Automated with ML-based exception detection and anomaly flagging
- [ ] 5 - Fully automated with predictive settlement optimization and self-healing reconciliation

**Context** (shown to respondent):
*Why this matters*: Settlement and reconciliation are critical for cash flow. Machine learning can reduce manual work and catch discrepancies faster.

**Scoring Logic**:
- 1: Manual process (1 point)
- 2: Mostly automated (2 points)
- 3: Automated + basic detection (3 points)
- 4: ML-based detection (4 points)
- 5: Fully automated + optimization (5 points)

---

### Q12: Data-Driven Business Decisions & Analytics
**Category**: Strategic AI Adoption  
**Weight**: 3%

**Question**:
> How data-driven are your business decisions about product features and pricing?

**Options** (with hidden score):
- [ ] 1 - Intuition-driven; limited data analysis
- [ ] 2 - Some analytics dashboards; occasional data review
- [ ] 3 - Regular data analysis; metrics-driven product decisions
- [ ] 4 - Advanced analytics; ML-powered insights inform strategy
- [ ] 5 - Fully data-driven: predictive analytics, experimentation platform, automated insights

**Context** (shown to respondent):
*Why this matters*: Data-driven decisions accelerate learning. Analytics and ML models help you understand customer behavior and optimize pricing/products.

**Scoring Logic**:
- 1: Intuition-driven (1 point)
- 2: Some dashboards (2 points)
- 3: Metrics-driven (3 points)
- 4: ML-powered insights (4 points)
- 5: Fully data-driven (5 points)

---

## Scoring Methodology

### Overall AI Maturity Score Calculation

**Dimension Weights**:
- Fraud Detection & Risk Management: 40% (Q1-Q4)
- Compliance & Regulatory: 30% (Q5-Q7)
- Real-Time Data Processing: 20% (Q8-Q9)
- Payment Processing AI: 10% (Q10-Q12)

**Raw Score** = Sum of all individual question scores (1-5 per question)
**Normalized Score** = (Raw Score / Maximum Score) × 5.0

**Maximum Score** = 60 points (12 questions × 5 points each)

**AI Maturity Level** = (Total Score / 60) × 5.0

### Maturity Level Interpretation

| Score | Level | Implication |
|-------|-------|-------------|
| 1.0-1.5 | Not Started | Minimal ML/AI capability; mostly manual processes |
| 1.5-2.5 | Initial | Early exploration; basic systems in place |
| 2.5-3.0 | Developing | Active ML work underway; some production systems |
| 3.0-3.5 | Developing+ | Multiple ML systems; maturing processes |
| 3.5-4.5 | Advanced | Production ML systems across multiple areas |
| 4.5-5.0 | Expert | Industry-leading ML/AI practices |

### Fintech-Specific Scoring Notes

**Fraud Detection Weight (40%)**:
- Critical for payment processors; directly impacts profitability
- Low fraud detection maturity (Q1-Q4 scores < 3.0) = immediate need for investment

**Compliance Weight (30%)**:
- Regulatory imperative; non-negotiable for payment processors
- Low compliance maturity (Q5-Q7 scores < 3.0) = regulatory risk

**Real-Time Processing Weight (20%)**:
- Technically essential for fraud ML serving
- Low scores indicate infrastructure gaps that block fraud detection deployment

**Payment Processing AI Weight (10%)**:
- Strategic optimization; secondary to fraud/compliance
- Can defer beyond initial 12-month curriculum

---

## Expected Response Patterns

### Expected Baseline (Series A Fintech without ML team)
- Fraud Detection: 2.0-2.5 (rule-based only, limited ML)
- Compliance: 2.5-3.0 (processes in place, limited automation)
- Real-Time Processing: 2.0-2.5 (infrastructure exists, limited ML serving)
- Payment Processing AI: 1.5-2.0 (basic analytics, no ML optimization)

**Expected Overall**: 2.1-2.8 / 5.0 (Initial to Developing)

### Variance Expectations
- Companies with external fraud detection vendors: +0.5 points on Fraud Detection
- Companies with strong compliance teams: +0.5 points on Compliance
- Companies with data engineering: +0.5 points on Real-Time Processing
- Companies with analytics teams: +0.5 points on Payment Processing AI

---

## Question Design Rationale

### Why These Dimensions?

1. **Fraud Detection (40%)**: Core problem in payment processing; direct ROI from ML
2. **Compliance (30%)**: Regulatory imperative; enables other ML investments
3. **Real-Time Processing (20%)**: Technical requirement for fraud ML serving
4. **Payment Processing AI (10%)**: Strategic optimization; secondary priority

### Why These Questions?

**Fraud Questions (Q1-Q4)**:
- Current fraud detection maturity
- Real-time infrastructure readiness
- Chargeback analysis capability
- Risk scoring and approval optimization

All critical for building production fraud detection systems.

**Compliance Questions (Q5-Q7)**:
- AML/KYC maturity
- Data privacy and security
- Model explainability and audit trail

All critical for regulatory compliance and legal risk management.

**Real-Time Questions (Q8-Q9)**:
- Stream processing and feature engineering
- ML serving infrastructure

Both critical for deploying fraud ML in production.

**Payment AI Questions (Q10-Q12)**:
- Merchant risk profiling
- Settlement optimization
- Data-driven decision making

All supportive of strategic ML adoption beyond fraud.

---

## Curriculum Mapping

Assessment results will map to specific curriculum modules:

| Score Range | Recommended Curriculum Phase | Focus Areas |
|---|---|---|
| 1.0-2.0 | Phase 1: Foundation | Compliance basics, fraud fundamentals, infrastructure setup |
| 2.0-3.0 | Phase 1-2: Foundation + MVP | Regulatory deep dive, fraud detection MVP, real-time ML serving |
| 3.0-4.0 | Phase 2-3: MVP + Scale | Advanced fraud models, risk optimization, compliance automation |
| 4.0-5.0 | Phase 3: Advanced | Causal inference, real-time personalization, strategic AI |

---

**Scoring Designed**: 2026-04-24  
**Fintech Domain**: Payment Infrastructure  
**Compliance Focus**: Yes (30% weight on compliance)  
**Real-Time Requirements**: Yes (emphasis on sub-100ms latency)
