/**
 * API Endpoint: /api/submit-assessment
 * Collects assessment responses and auto-commits to GitHub
 *
 * This runs as a serverless function (Vercel, Netlify, or self-hosted Node)
 * Automatically writes responses to GitHub and generates results markdown
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * GitHub commit function
 * Requires environment variables:
 * - GITHUB_TOKEN: GitHub Personal Access Token
 * - GITHUB_REPO: Repository (owner/repo)
 * - GITHUB_BRANCH: Branch name (main)
 */
async function commitToGitHub(filename, content, message) {
  if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_REPO) {
    console.warn('GitHub credentials not configured. Skipping commit.');
    return;
  }

  try {
    const [owner, repo] = process.env.GITHUB_REPO.split('/');
    const branch = process.env.GITHUB_BRANCH || 'main';

    // Get current file SHA (if exists)
    let sha = null;
    try {
      const getRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${filename}?ref=${branch}`,
        {
          headers: {
            Authorization: `token ${process.env.GITHUB_TOKEN}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );
      if (getRes.ok) {
        const data = await getRes.json();
        sha = data.sha;
      }
    } catch (e) {
      // File doesn't exist yet, that's okay
    }

    // Create/update file
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filename}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          content: Buffer.from(content).toString('base64'),
          branch,
          ...(sha && { sha }),
        }),
      }
    );

    if (!res.ok) {
      throw new Error(`GitHub API error: ${res.status}`);
    }

    return { success: true };
  } catch (error) {
    console.error('GitHub commit failed:', error);
    throw error;
  }
}

/**
 * Calculate AI Maturity Level from assessment scores
 */
function calculateMaturityLevel(scores) {
  const { q1, q2, q3, q4, q6 } = scores;
  // Score range: Q1(0-4) + Q2(0-3) + Q3(0-4) + Q4(0-4) + Q6(0-3) = 0-18
  // Map to 1.0-4.5 scale
  const maxScore = 18;
  const totalScore = q1 + q2 + q3 + q4 + q6;
  const normalizedScore = (totalScore / maxScore) * 3.5 + 1.0;

  return {
    score: normalizedScore.toFixed(1),
    level: normalizedScore < 1.5 ? 'Beginner' :
           normalizedScore < 2.5 ? 'Intermediate' :
           normalizedScore < 3.5 ? 'Advanced' : 'Expert',
  };
}

/**
 * Generate assessment results markdown
 */
function generateResultsMarkdown(formData, assessment) {
  const q1_options = [
    'Not used',
    'ChatGPT/Claude manually',
    'IDE extensions',
    'Terminal-based agents',
    'Custom internal tools',
  ];
  const q2_options = [
    'Beginner',
    'Intermediate',
    'Advanced',
    'Expert',
  ];
  const q3_options = [
    'Manual only',
    'Limited automation',
    'Some processes automated',
    'Many processes automated',
    'Fully systematized',
  ];
  const q4_options = [
    'Unfamiliar with concept',
    'Aware but not using',
    'Some individuals use them',
    'Team-level adoption',
    'Company-wide governance',
  ];
  const q5_options = [
    'AI Fundamentals',
    'Code generation',
    'Data analysis',
    'Design optimization',
    'LLM customization',
    'Tool integration',
    'Strategic guidance',
  ];
  const q6_options = [
    'Casual',
    'Moderate',
    'Engaged',
    'Deep',
  ];

  const markdown = `# Inflow Network - Assessment Results

**Respondent**: ${formData.fullName}
**Email**: ${formData.email}
**Department**: ${formData.department}
**Submitted**: ${new Date(formData.timestamp).toLocaleString()}

---

## 📊 Assessment Summary

### AI Maturity Level: **${assessment.level}** (${assessment.score}/4.5)

This assessment evaluates your organization's readiness for AI adoption across 6 dimensions.

---

## 🎯 Detailed Responses

### Q1: Coding Agents Usage
**Response**: ${q1_options[formData.q1_coding_agents]}

**What it means**: Your current integration level of AI into development workflows.

---

### Q2: LLM Foundational Knowledge
**Response**: ${q2_options[formData.q2_llm_knowledge]}

**What it means**: Your team's theoretical understanding of how language models work.

---

### Q3: Automated LLM Usage
**Response**: ${q3_options[formData.q3_automated_usage]}

**What it means**: Your operational maturity in automation (manual vs. systematized).

---

### Q4: MCP/Skills/Plugins Expertise
**Response**: ${q4_options[formData.q4_mcp_expertise]}

**What it means**: Your organization's capability in tool extension and customization.

---

### Q5: AI Expectations & Skill Gaps
**Selections**: ${formData.q5_ai_expectations.map(idx => q5_options[idx]).join(', ')}

**What it means**: Business priorities and identified capability gaps.

---

### Q6: Industry Awareness
**Response**: ${q6_options[formData.q6_industry_awareness]}

**What it means**: Your team's connection to AI industry developments and trends.

---

## 💡 Key Insights

${getInsights(assessment.score, formData)}

---

## 🚀 Next Steps

1. **Review Results**: Share these results with your team leadership
2. **Schedule Call**: Contact us to discuss customized AI curriculum
3. **Pilot Project**: Begin a focused AI upskilling program (4-8 weeks)

**Contact**: partnerships@example.com
**Expected Timeline**: 2-3 weeks to curriculum delivery

---

**Assessment ID**: ${Date.now()}
**Generated**: ${new Date().toISOString()}
`;

  return markdown;
}

/**
 * Generate insights based on maturity level
 */
function getInsights(maturityScore, formData) {
  const score = parseFloat(maturityScore);

  if (score < 1.5) {
    return `
**Current Stage**: Early adoption. Your organization is beginning to explore AI tools.

**Opportunities**:
- Establish foundational AI knowledge (prompting, LLM basics)
- Pilot AI tools in low-risk processes
- Build team familiarity with ChatGPT, Claude, Copilot

**Recommended Focus**: AI Fundamentals + Code Generation
`;
  } else if (score < 2.5) {
    return `
**Current Stage**: Learning phase. Your team has basic experience with AI tools.

**Opportunities**:
- Deepen LLM knowledge (tokens, fine-tuning, RAG)
- Expand automation to more processes
- Introduce custom tools and plugins

**Recommended Focus**: Advanced LLM techniques + Tool Integration
`;
  } else if (score < 3.5) {
    return `
**Current Stage**: Advanced implementation. Strong AI adoption across multiple areas.

**Opportunities**:
- Optimize and scale existing AI systems
- Build proprietary AI capabilities
- Establish governance and best practices

**Recommended Focus**: LLM Customization + Production Systems
`;
  } else {
    return `
**Current Stage**: Expert level. Leading-edge AI implementation.

**Opportunities**:
- Advise industry peers
- Develop strategic AI partnerships
- Innovate with emerging AI technologies

**Recommended Focus**: Strategic AI Leadership + R&D
`;
  }
}

/**
 * Main handler function (Vercel/Netlify compatible)
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const formData = req.body;

    // Validate required fields
    if (!formData.fullName || !formData.email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Calculate maturity assessment
    const assessment = calculateMaturityLevel({
      q1: formData.q1_coding_agents,
      q2: formData.q2_llm_knowledge,
      q3: formData.q3_automated_usage,
      q4: formData.q4_mcp_expertise,
      q6: formData.q6_industry_awareness,
    });

    // Generate markdown results
    const resultsMarkdown = generateResultsMarkdown(formData, assessment);

    // Store raw response data
    const responseFile = `projects/inflow-network/responses/${Date.now()}_${formData.email.split('@')[0]}.json`;
    const responseData = JSON.stringify(formData, null, 2);

    // Generate results file
    const resultsFile = 'projects/inflow-network/INFLOW_NETWORK_ASSESSMENT_RESULTS.md';

    // Commit to GitHub
    if (process.env.GITHUB_TOKEN) {
      await commitToGitHub(
        responseFile,
        responseData,
        `Add assessment response from ${formData.fullName}`
      );

      await commitToGitHub(
        resultsFile,
        resultsMarkdown,
        `Update assessment results - ${formData.fullName}`
      );
    } else {
      // Fallback: Save locally (for development)
      console.log('GitHub not configured. Results would be:');
      console.log(resultsMarkdown);
    }

    return res.status(200).json({
      success: true,
      message: 'Assessment submitted successfully',
      assessment: {
        level: assessment.level,
        score: assessment.score,
      },
    });
  } catch (error) {
    console.error('Assessment submission error:', error);
    return res.status(500).json({
      error: 'Failed to process assessment',
      details: error.message,
    });
  }
}
