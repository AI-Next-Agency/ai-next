/**
 * Client Example: Using the Assessment Response API
 *
 * This demonstrates how a form frontend or dashboard would interact
 * with the minimalist API.
 */

// ============================================================================
// 1. Form Submission (from React form component)
// ============================================================================

interface FormData {
  company: string;
  name: string;
  email: string;
  department: string;
  role: string;
  aiMaturityScore: number;
  maturityLevel: string;
  questions: Array<{ id: string; score: number }>;
}

/**
 * Submit form to the API
 */
async function submitAssessment(formData: FormData): Promise<{ responseId: string }> {
  const response = await fetch('/api/responses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Submission failed');
  }

  const data = await response.json();
  if (!data.ok) {
    throw new Error(data.error || 'Submission failed');
  }

  return { responseId: data.responseId };
}

// Usage in a React component
async function handleFormSubmit(values: any) {
  try {
    const result = await submitAssessment({
      company: 'acme-corp',
      name: values.name,
      email: values.email,
      department: values.department,
      role: values.role,
      aiMaturityScore: values.overallScore,
      maturityLevel: calculateMaturityLevel(values.overallScore),
      questions: Object.entries(values.scores).map(([id, score]) => ({
        id,
        score: score as number,
      })),
    });

    console.log('Submission successful:', result.responseId);
    showSuccessMessage('Form submitted successfully');
  } catch (err) {
    showErrorMessage((err as Error).message);
  }
}

// ============================================================================
// 2. Dashboard: List Responses
// ============================================================================

interface ListQuery {
  company: string;
  maturityLevel?: string;
  department?: string;
  limit?: number;
  offset?: number;
}

interface ResponseSummary {
  responseId: string;
  name: string;
  email: string;
  department: string;
  role: string;
  aiMaturityScore: number;
  maturityLevel: string;
  submittedAt: string;
}

/**
 * Fetch paginated list of responses for a company
 */
async function fetchResponses(
  query: ListQuery,
  authToken: string
): Promise<{ total: number; responses: ResponseSummary[] }> {
  const params = new URLSearchParams({
    company: query.company,
    limit: (query.limit || 20).toString(),
    offset: (query.offset || 0).toString(),
    ...(query.maturityLevel && { maturity_level: query.maturityLevel }),
    ...(query.department && { department: query.department }),
  });

  const response = await fetch(`/api/responses?${params}`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch responses');
  }

  const data = await response.json();
  if (!data.ok) {
    throw new Error(data.error || 'Failed to fetch responses');
  }

  return {
    total: data.total,
    responses: data.responses,
  };
}

// Usage in a React component
async function loadDashboard(companyId: string, token: string) {
  try {
    const { total, responses } = await fetchResponses(
      {
        company: companyId,
        limit: 50,
        offset: 0,
      },
      token
    );

    console.log(`Total responses: ${total}`);
    responses.forEach((r) => {
      console.log(`${r.name} (${r.email}) - ${r.maturityLevel} - ${r.aiMaturityScore}/5`);
    });
  } catch (err) {
    console.error('Dashboard error:', err);
  }
}

// ============================================================================
// 3. Dashboard: Filter by Department
// ============================================================================

async function loadDepartmentResponses(
  companyId: string,
  department: string,
  token: string
) {
  const { total, responses } = await fetchResponses(
    {
      company: companyId,
      department,
      limit: 100,
    },
    token
  );

  return {
    department,
    total,
    responses,
  };
}

// ============================================================================
// 4. Dashboard: Single Response Detail
// ============================================================================

interface ResponseDetail {
  responseId: string;
  company: string;
  name: string;
  email: string;
  department: string;
  role: string;
  aiMaturityScore: number;
  maturityLevel: string;
  submittedAt: string;
  questions: Array<{
    id: string;
    title: string;
    score: number;
  }>;
}

/**
 * Fetch single response with question details
 */
async function fetchResponseDetail(
  responseId: string,
  companyId: string,
  token: string
): Promise<ResponseDetail> {
  const response = await fetch(
    `/api/responses/${responseId}?company=${companyId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch response detail');
  }

  const data = await response.json();
  if (!data.ok) {
    throw new Error(data.error || 'Failed to fetch response detail');
  }

  return data.response;
}

// Usage
async function showResponseDetail(responseId: string, companyId: string, token: string) {
  try {
    const detail = await fetchResponseDetail(responseId, companyId, token);

    console.log(`\n${detail.name} (${detail.email})`);
    console.log(`Department: ${detail.department}`);
    console.log(`Role: ${detail.role}`);
    console.log(`Maturity Level: ${detail.maturityLevel}`);
    console.log(`Overall Score: ${detail.aiMaturityScore}/5`);
    console.log('\nQuestion Responses:');

    detail.questions.forEach((q) => {
      console.log(`  ${q.id}: "${q.title}" → ${q.score}/5`);
    });
  } catch (err) {
    console.error('Error fetching detail:', err);
  }
}

// ============================================================================
// 5. Dashboard: Stats & Aggregates
// ============================================================================

interface CompanyStats {
  total: number;
  avgScore: number;
  minScore: number;
  maxScore: number;
  distribution: Record<string, number>;
}

/**
 * Fetch aggregate stats for a company (and optional department filter)
 */
async function fetchStats(
  companyId: string,
  token: string,
  department?: string
): Promise<CompanyStats> {
  const url = `/api/responses/stats/${companyId}` +
    (department ? `?department=${department}` : '');

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch stats');
  }

  const data = await response.json();
  if (!data.ok) {
    throw new Error(data.error || 'Failed to fetch stats');
  }

  return data.stats;
}

// Usage
async function showCompanyStats(companyId: string, token: string) {
  try {
    const stats = await fetchStats(companyId, token);

    console.log(`\nStats for ${companyId}:`);
    console.log(`Total responses: ${stats.total}`);
    console.log(`Average score: ${stats.avgScore.toFixed(2)}/5`);
    console.log(`Range: ${stats.minScore} - ${stats.maxScore}`);
    console.log('\nMaturity Distribution:');

    Object.entries(stats.distribution).forEach(([level, count]) => {
      const pct = ((count / stats.total) * 100).toFixed(1);
      console.log(`  ${level}: ${count} (${pct}%)`);
    });
  } catch (err) {
    console.error('Stats error:', err);
  }
}

// ============================================================================
// 6. Dashboard: Pagination
// ============================================================================

/**
 * Paginate through all responses
 */
async function paginateAllResponses(
  companyId: string,
  token: string,
  pageSize: number = 50
) {
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { total, responses } = await fetchResponses(
      {
        company: companyId,
        limit: pageSize,
        offset,
      },
      token
    );

    console.log(`Page: ${offset / pageSize + 1}, Items: ${responses.length}`);

    // Process this page
    responses.forEach((r) => {
      console.log(`  - ${r.name}: ${r.maturityLevel}`);
    });

    offset += responses.length;
    hasMore = offset < total;
  }
}

// ============================================================================
// 7. Error Handling Pattern
// ============================================================================

interface ApiError {
  ok: false;
  error: string;
  field?: string;
  message?: string;
}

/**
 * Typed fetch wrapper with error handling
 */
async function apiCall<T>(
  url: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok || !data.ok) {
    const error = data as ApiError;
    const message = error.message || error.error || 'Unknown error';
    throw {
      status: response.status,
      error: error.error,
      message,
      field: error.field,
    };
  }

  return data;
}

// Usage with error handling
async function submitWithErrorHandling(formData: FormData, token?: string) {
  try {
    const result = await apiCall('/api/responses', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
    console.log('Success:', result);
  } catch (err: any) {
    if (err.status === 400 && err.field) {
      console.error(`Validation error on field '${err.field}': ${err.message}`);
    } else if (err.status === 409) {
      console.error('Duplicate submission:', err.message);
    } else if (err.status === 401) {
      console.error('Unauthorized - invalid token');
    } else {
      console.error('Error:', err.message);
    }
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function calculateMaturityLevel(score: number): string {
  if (score < 1.5) return 'foundation';
  if (score < 2.5) return 'emerging';
  if (score < 3.5) return 'scaling';
  return 'leading';
}

function showSuccessMessage(msg: string) {
  console.log(`✓ ${msg}`);
}

function showErrorMessage(msg: string) {
  console.error(`✗ ${msg}`);
}

// ============================================================================
// Export for use in other modules
// ============================================================================

export {
  submitAssessment,
  fetchResponses,
  fetchResponseDetail,
  fetchStats,
  paginateAllResponses,
  apiCall,
  type FormData,
  type ResponseSummary,
  type ResponseDetail,
  type CompanyStats,
  type ApiError,
};
