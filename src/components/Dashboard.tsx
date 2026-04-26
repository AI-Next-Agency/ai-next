import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  company: string;
  apiUrl: string;
  apiToken: string;
}

interface DashboardData {
  company: string;
  totalResponses: number;
  avgScore: number;
  submissionTimeline: Array<{ date: string; count: number; avgScore: number }>;
  maturityDistribution: Record<string, number>;
  scoreDistribution: Record<string, number>;
  questionMetrics: Array<{ questionId: string; title: string; avgScore: number; responseCount: number }>;
  recentResponses: Array<{
    id: string;
    name: string;
    email: string;
    department: string;
    role: string;
    score: number;
    maturityLevel: string;
    submittedAt: string;
  }>;
}

const MATURITY_COLORS: Record<string, string> = {
  'Initial': '#ef4444',
  'Beginner': '#f97316',
  'Developing': '#eab308',
  'Intermediate': '#84cc16',
  'Advanced': '#22c55e',
};

export const Dashboard: React.FC<DashboardProps> = ({ company, apiUrl, apiToken }) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    try {
      setRefreshing(true);
      const response = await fetch(`${apiUrl}/api/analytics/dashboard?company=${company}`, {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const dashboardData: DashboardData = await response.json();
      setData(dashboardData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    // Refresh every 30 seconds
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, [company, apiUrl, apiToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">Error: {error}</p>
          <button
            onClick={fetchDashboard}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="text-center py-8">No data available</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 capitalize">{company}</h1>
            <p className="text-gray-600 mt-1">AI Assessment Dashboard</p>
          </div>
          <button
            onClick={fetchDashboard}
            disabled={refreshing}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium">Total Responses</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{data.totalResponses}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium">Average AI Maturity Score</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{data.avgScore.toFixed(2)}</p>
            <p className="text-sm text-gray-500 mt-2">out of 5.0</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium">Most Common Level</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {Object.entries(data.maturityDistribution).reduce((prev, current) =>
                current[1] > prev[1] ? current : prev
              )[0]}
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Submission Timeline */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Submission Timeline (Last 30 Days)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.submissionTimeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="count" stroke="#3b82f6" name="Submissions" />
                <Line yAxisId="right" type="monotone" dataKey="avgScore" stroke="#10b981" name="Avg Score" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Maturity Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Maturity Level Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={Object.entries(data.maturityDistribution).map(([level, count]) => ({
                    name: level,
                    value: count,
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.keys(data.maturityDistribution).map((level) => (
                    <Cell key={level} fill={MATURITY_COLORS[level] || '#999'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Score Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Score Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={Object.entries(data.scoreDistribution).map(([bucket, count]) => ({
                bucket,
                count,
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bucket" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Question Metrics */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Average Scores by Question</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={data.questionMetrics}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 200, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 5]} />
                <YAxis dataKey="questionId" type="category" width={150} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="avgScore" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Responses Table */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Responses</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Department</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Role</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Score</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Level</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.recentResponses.map((response) => (
                  <tr key={response.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{response.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{response.department}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{response.role}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{response.score.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className="px-3 py-1 rounded-full text-white text-xs font-medium"
                        style={{ backgroundColor: MATURITY_COLORS[response.maturityLevel] || '#999' }}
                      >
                        {response.maturityLevel}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(response.submittedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.recentResponses.length === 0 && (
              <p className="text-center py-8 text-gray-500">No responses yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
