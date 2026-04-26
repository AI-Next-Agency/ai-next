/**
 * Cloudflare Worker for Secure Form Submission
 *
 * This worker:
 * 1. Receives form data from the frontend
 * 2. Validates and sanitizes the data
 * 3. Triggers GitHub Actions workflow (using stored secret)
 * 4. Returns success/error response
 *
 * Security:
 * - Token stored in Cloudflare environment variables (never exposed)
 * - CORS restricted to specific domains
 * - Input validation and sanitization
 * - Rate limiting per IP
 */

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('origin');
    const allowedOrigins = [
      'https://ai-next-agency.github.io',
      'https://inflownetwork.com'
    ];
    const isAllowed = allowedOrigins.includes(origin);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      if (!isAllowed) return new Response('CORS policy violation', { status: 403 });
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    if (!isAllowed) {
      return new Response('CORS policy violation', { status: 403 });
    }

    try {
      // Parse request body
      const data = await request.json();

      // Validate required fields
      const requiredFields = ['company', 'name', 'email', 'department', 'role', 'questions', 'aiMaturityScore', 'maturityLevel'];
      for (const field of requiredFields) {
        if (!data[field]) {
          return new Response(
            JSON.stringify({ error: `Missing required field: ${field}` }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }

      // Validate company slug — strict allowlist prevents path traversal in the GitHub Action
      if (!/^[a-z0-9-]{1,50}$/.test(data.company)) {
        return new Response(
          JSON.stringify({ error: 'Invalid company slug' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Sanitize email
      if (!data.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        return new Response(
          JSON.stringify({ error: 'Invalid email format' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Rate limiting: check if IP has submitted recently
      const ip = request.headers.get('cf-connecting-ip') || 'unknown';
      const rateKey = `form_submission:${ip}`;
      const rateLimit = await env.FORM_SUBMISSIONS.get(rateKey);

      if (rateLimit) {
        return new Response(
          JSON.stringify({ error: 'Too many submissions. Please wait before submitting again.' }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Record this submission (5 minute rate limit)
      await env.FORM_SUBMISSIONS.put(rateKey, '1', { expirationTtl: 300 });

      // Trigger GitHub Actions workflow
      const response = await fetch(
        'https://api.github.com/repos/AI-Next-Agency/ai-next/dispatches',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            event_type: 'assessment-submission',
            client_payload: {
              company: data.company,
              name: data.name.substring(0, 100),
              email: data.email.substring(0, 255),
              department: data.department.substring(0, 100),
              role: data.role.substring(0, 100),
              questions: data.questions,
              aiMaturityScore: data.aiMaturityScore,
              maturityLevel: data.maturityLevel,
              timestamp: new Date().toISOString()
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      // Return success response
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Your assessment has been submitted successfully. We will contact you within 2 business days.',
          timestamp: new Date().toISOString()
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': origin
          }
        }
      );

    } catch (error) {
      console.error('Form submission error:', error);

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to submit assessment. Please try again later.'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
};
