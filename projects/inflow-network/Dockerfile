FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy application files
COPY . .

# Build (if Next.js or similar)
RUN npm run build 2>/dev/null || echo "No build step"

# Expose port
EXPOSE 3000

# Environment variables required at runtime:
# GITHUB_TOKEN - GitHub Personal Access Token
# GITHUB_REPO - Repository (owner/repo)
# GITHUB_BRANCH - Branch name (default: main)

# Start application
CMD ["npm", "start"]
