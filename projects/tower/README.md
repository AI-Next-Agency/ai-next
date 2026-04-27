# Tower Project

> **Goal**: Onboard Tower as client and deliver AI education program for Python-native data orchestration + AI

---

## 📋 Company Overview

**Tower.dev** is a Python-native data orchestration and deployment platform for the AI era. They're building the "last mile" infrastructure for data teams using AI-generated pipelines and agents.

- **Founded**: 2024 (Berlin)
- **Employees**: ~10-15 (early seed stage)
- **Funding**: €5.5M raised
- **Founders**: Serhii Sokolenko (ex-Databricks/Snowflake PM), Brad Heller (ex-Snowflake CTO)
- **Traction**: 30,000+ apps, 200k+ pipeline runs, 70k SDK downloads

---

## 📂 Project Structure

```
projects/tower/
├── README.md                              # This file
├── TOWER_PROFIL.md                        # Company research (completed)
├── STATUS.md                              # Project timeline & checklist
├── ASSESSMENT_TEMPLATE.md                 # Assessment form questions
├── form.html                              # Live assessment form
├── TOWER_ASSESSMENT_RESULTS.md            # Auto-generated results
└── notes/                                 # Meeting notes & decisions
```

---

## 🎯 Project Checklist

- [x] Company profile completed (TOWER_PROFIL.md)
- [ ] Assessment form created & shared
- [ ] Form responses received from team
- [ ] Assessment results analyzed
- [ ] Curriculum designed
- [ ] Pilot project started
- [ ] Deal closed

---

## 📋 Important Links

**Live Assessment Form**: https://ai-next-agency.github.io/ai-next/projects/tower/

**Google Form**: *To be added after creation*

**Google Sheet**: *To be added after linking to form*

---

## 🚀 Next Steps (T+0 to T+30)

| Timeline | Action | Owner |
|----------|--------|-------|
| **T+0** | Send form link to company contact | Nihat/Giray |
| **T+1-7** | Collect 3-5 assessment responses | Tower team |
| **T+7** | Review responses + identify skill gaps | Claude AI |
| **T+14** | Design tailored curriculum | Nihat |
| **T+21** | Schedule discovery call + present curriculum | Giray |
| **T+30** | Pilot project kickoff | Both |

---

## 🔄 Automation & Pipeline

This project uses our in-house assessment pipeline:

1. **Form Submission** (Employee fills form.html)
   - Data POSTs to Cloudflare Worker
   - Worker validates + stores in D1 database
   
2. **Auto-Response Processing** (Planned migration)
   - Responses written to `responses/` folder
   - Results aggregated in `TOWER_ASSESSMENT_RESULTS.md`
   - All automated, zero manual work

---

## 📊 Key AI Education Opportunities

Based on Tower's focus, likely training topics:

1. **Data Engineering + LLM Integration**
   - How to build data agents
   - Orchestrating AI-assisted ETL pipelines
   - Connecting LLMs to data systems

2. **Python-Native AI Orchestration**
   - Building and deploying data agents
   - Using Tower SDK for agent management
   - Monitoring and reliability

3. **Prompt Engineering for Code Generation**
   - Fine-tuning models for pipeline code
   - Domain-specific knowledge embedding
   - Validation and safety

4. **Data Quality with ML**
   - Anomaly detection in data pipelines
   - Drift detection and prediction
   - Proactive quality assurance

5. **Multi-Tenant AI Security**
   - Managing AI agent access across teams
   - Data governance in AI systems

---

## 💼 Contact Information

**Primary Contact**: *To be added after first response*

**Department**: Engineering / Data / Product

**Best Time**: *To be determined*

---

## 📚 Resources

- **Company Profile**: [TOWER_PROFIL.md](TOWER_PROFIL.md)
- **Project Status**: [STATUS.md](STATUS.md)
- **Tower Website**: https://tower.dev/
- **Tower Docs**: https://docs.tower.dev/
- **GitHub**: https://github.com/tower/tower-cli

---

**Project Owner**: Nihat & Giray (afsin@inflownetwork.com)

**Created**: 2026-04-27

**Status**: 🟢 Active - Awaiting Form Response

**Last Updated**: 2026-04-27
