# Self-Hosted Assessment Form - Complete Setup Guide

**Status**: Ready to deploy  
**Time to Live**: 10-15 minutes  
**Infrastructure**: Docker + Vercel/Netlify/Self-hosted Node

---

## 🚀 What You Get

✅ Self-hosted React assessment form (no Google dependency)  
✅ Corporate design theme (Tailwind + Lucide icons)  
✅ Lightweight (~15KB gzipped)  
✅ Automatic GitHub syncing  
✅ Instant results generation  
✅ Multi-step form with progress bar  

---

## 📦 Files Created

```
projects/inflow-network/
├── assessment-form.tsx          # React component (corporate theme)
├── api/
│   └── submit-assessment.js     # Backend API (GitHub auto-sync)
├── Dockerfile                   # Docker configuration
├── package.json                 # Dependencies (to create)
├── next.config.js              # Next.js config (to create)
└── public/
    └── index.html              # Static HTML (to create)
```

---

## ⚡ Deployment Option 1: Vercel (Easiest - 5 minutes)

### Step 1: Initialize Next.js Project

```bash
cd /Users/nihat/DevS/ai-next/projects/inflow-network

npm init -y

npm install react react-dom next lucide-react
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Step 2: Create package.json Scripts

Add to `package.json`:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "export": "next export"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "next": "^14.0.0",
    "lucide-react": "^0.263.0"
  }
}
```

### Step 3: Create Next.js Pages

Create `pages/index.tsx`:
```typescript
import AssessmentForm from '../assessment-form';

export default function Home() {
  return <AssessmentForm />;
}
```

Create `pages/api/submit-assessment.ts`:
```
Copy content from api/submit-assessment.js
```

### Step 4: Set Environment Variables

In Vercel dashboard:
- `GITHUB_TOKEN` = Your GitHub Personal Access Token
- `GITHUB_REPO` = "your-org/ai-next"
- `GITHUB_BRANCH` = "main"

### Step 5: Deploy

```bash
npm install -g vercel
vercel
```

**Form will be live at**: `your-project.vercel.app`

---

## 🐳 Deployment Option 2: Docker (Self-Hosted - 10 minutes)

### Step 1: Build Docker Image

```bash
cd /Users/nihat/DevS/ai-next/projects/inflow-network

docker build -t inflow-assessment:latest .
```

### Step 2: Create docker-compose.yml

```yaml
version: '3.8'

services:
  assessment-form:
    image: inflow-assessment:latest
    ports:
      - "3000:3000"
    environment:
      - GITHUB_TOKEN=${GITHUB_TOKEN}
      - GITHUB_REPO=${GITHUB_REPO}
      - GITHUB_BRANCH=${GITHUB_BRANCH}
    volumes:
      - ./responses:/app/responses
    restart: unless-stopped
```

### Step 3: Run Container

```bash
export GITHUB_TOKEN="ghp_xxxxxxxxxxxxx"
export GITHUB_REPO="your-org/ai-next"
export GITHUB_BRANCH="main"

docker-compose up -d
```

**Form will be live at**: `localhost:3000` (or your server IP)

---

## 🔑 Getting GitHub Token

1. Go to **GitHub Settings** → **Developer settings** → **Personal access tokens**
2. Click **Generate new token**
3. Give it scopes:
   - `repo` (full control of private repositories)
   - `workflow` (update GitHub Actions workflows)
4. Copy the token and save it securely

---

## 🌐 Deployment Option 3: Netlify (Alternative - 5 minutes)

### Step 1: Connect GitHub Repository

1. Go to **https://app.netlify.com**
2. Click **"Add new site"** → **"Connect to Git"**
3. Select your repository

### Step 2: Build Settings

- **Build command**: `npm run build`
- **Publish directory**: `.next`
- **Functions directory**: `api`

### Step 3: Environment Variables

In Site Settings → Environment:
- `GITHUB_TOKEN` = Your GitHub token
- `GITHUB_REPO` = "your-org/ai-next"
- `GITHUB_BRANCH` = "main"

### Step 4: Deploy

Click **Deploy** — Netlify will build and host automatically.

**Form will be live at**: `your-site.netlify.app`

---

## 📝 Form Features

### Multi-Step Interface
- Contact info → 6 assessment questions
- Progress bar shows completion
- Can navigate back and forth
- Smooth animations between steps

### Corporate Design
- Clean slate color scheme (slate-50 to slate-900)
- Gradient accents (blue → indigo → green)
- Smooth transitions and hover states
- Responsive on mobile and desktop

### Smart Data Collection
- Validates required fields
- Radio buttons for single-choice questions
- Checkboxes for multi-select
- Email validation built-in

### Automatic Processing
- Calculates AI Maturity Level on submission
- Generates markdown results instantly
- Stores raw JSON responses
- Commits to GitHub automatically

---

## 🔄 What Happens on Submission

1. **Client**: Form submitted with all responses
2. **API**: Validates data
3. **Calculation**: Computes AI Maturity Level (1.0-4.5 scale)
4. **Generation**: Creates markdown results file
5. **GitHub**: Auto-commits both files:
   - `projects/inflow-network/responses/[timestamp]_[email].json`
   - `projects/inflow-network/INFLOW_NETWORK_ASSESSMENT_RESULTS.md`
6. **User**: Sees success message with next steps

---

## 📊 Assessment Scoring

**AI Maturity Level Calculation**:
- Q1 (Coding Agents): 0-4 points
- Q2 (LLM Knowledge): 0-3 points
- Q3 (Automated Usage): 0-4 points
- Q4 (MCP Expertise): 0-4 points
- Q5 (Expectations): Not scored (used for curriculum planning)
- Q6 (Industry Awareness): 0-3 points

**Total**: 0-18 points → Normalized to 1.0-4.5 scale

**Levels**:
- 1.0-1.5 = **Beginner**
- 1.5-2.5 = **Intermediate**
- 2.5-3.5 = **Advanced**
- 3.5-4.5 = **Expert**

---

## 🔒 Security Considerations

### GitHub Token Scoping
- Use minimum necessary scopes
- Store token in environment variables (never in code)
- Rotate token periodically

### Data Privacy
- Responses stored in `responses/` folder (version controlled)
- Email addresses visible in results (consider hashing if needed)
- No external data collection services

### HTTPS
- Vercel/Netlify: Automatic HTTPS
- Self-hosted: Use Let's Encrypt + nginx reverse proxy

---

## 🚨 Troubleshooting

### "GitHub commit failed"
- Check `GITHUB_TOKEN` is valid and not expired
- Verify `GITHUB_REPO` format is correct (`owner/repo`)
- Ensure token has `repo` and `workflow` scopes

### "Form not loading"
- Check browser console for JavaScript errors
- Verify API endpoint is accessible (`/api/submit-assessment`)
- Check network requests in DevTools

### "Responses not appearing on GitHub"
- Verify GitHub credentials in environment variables
- Check repository permissions
- Look for error logs in deployment platform

---

## 🎯 Next Steps

1. **Choose deployment option** (Vercel recommended for speed)
2. **Set up GitHub token** (takes 2 minutes)
3. **Deploy form** (5-10 minutes)
4. **Test submission** (verify GitHub commit works)
5. **Share form link** with Inflow Network

---

## 📋 Pre-Deployment Checklist

- [ ] GitHub token created and validated
- [ ] Repository access confirmed
- [ ] Deployment platform selected (Vercel/Netlify/Self-hosted)
- [ ] Environment variables configured
- [ ] Form component in place (`assessment-form.tsx`)
- [ ] API endpoint ready (`api/submit-assessment.js`)
- [ ] Test submission works
- [ ] Results appear in GitHub
- [ ] Form URL ready to share

---

## 📞 Support

For issues or customizations:
1. Check the troubleshooting section above
2. Review environment variable configuration
3. Check GitHub token permissions
4. Verify network connectivity to GitHub API

---

**Estimated Total Setup Time**: 10-15 minutes  
**Ongoing Maintenance**: Minimal (GitHub auto-syncs responses)  
**Cost**: Free (Vercel, Netlify, GitHub)

Ready to deploy? Start with **Deployment Option 1 (Vercel)** — fastest path to production.
