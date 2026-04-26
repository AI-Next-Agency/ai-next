import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react';

interface FormData {
  fullName: string;
  email: string;
  department: string;
  q1_coding_agents: number;
  q2_llm_knowledge: number;
  q3_automated_usage: number;
  q4_mcp_expertise: number;
  q5_ai_expectations: number[];
  q6_industry_awareness: number;
  timestamp: string;
}

interface SubmitStatus {
  type: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
}

const AssessmentForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    department: '',
    q1_coding_agents: 0,
    q2_llm_knowledge: 0,
    q3_automated_usage: 0,
    q4_mcp_expertise: 0,
    q5_ai_expectations: [],
    q6_industry_awareness: 0,
    timestamp: new Date().toISOString(),
  });

  const [status, setStatus] = useState<SubmitStatus>({ type: 'idle' });
  const [currentStep, setCurrentStep] = useState(0);

  const questions = [
    {
      id: 'contact',
      title: 'Contact Information',
      fields: [
        { name: 'fullName', label: 'Full Name', type: 'text', required: true },
        { name: 'email', label: 'Email Address', type: 'email', required: true },
        { name: 'department', label: 'Department / Role', type: 'text', required: true },
      ],
    },
    {
      id: 'q1',
      title: 'Coding Agents Usage',
      description: 'How are AI-powered coding tools used in your engineering teams?',
      type: 'radio',
      field: 'q1_coding_agents',
      options: [
        'Not used',
        'ChatGPT/Claude manually (copy-paste prompts)',
        'IDE extensions (GitHub Copilot, Codeium)',
        'Terminal-based agents (Claude Code, Codex App)',
        'Custom internal tools',
      ],
    },
    {
      id: 'q2',
      title: 'LLM Foundational Knowledge',
      description: "What's your team's understanding level of how LLMs work?",
      type: 'radio',
      field: 'q2_llm_knowledge',
      options: [
        'Beginner (Basic ChatGPT usage)',
        'Intermediate (Understand tokens, context, limitations)',
        'Advanced (Fine-tuning, embeddings, RAG)',
        'Expert (Production LLM systems)',
      ],
    },
    {
      id: 'q3',
      title: 'Automated LLM Usage',
      description: 'Do you use LLMs in background processes or just manually?',
      type: 'radio',
      field: 'q3_automated_usage',
      options: [
        'Manual only',
        'Limited automation (POC/pilot stage)',
        'Some processes automated',
        'Many processes automated',
        'Fully systematized',
      ],
    },
    {
      id: 'q4',
      title: 'MCP/Skills/Plugins Expertise',
      description: 'How comfortable is your organization with custom tools/plugins?',
      type: 'radio',
      field: 'q4_mcp_expertise',
      options: [
        'Unfamiliar with concept',
        'Aware but not using',
        'Some individuals use them',
        'Team-level adoption',
        'Company-wide governance & standards',
      ],
    },
    {
      id: 'q5',
      title: 'AI Expectations & Skill Gaps',
      description: 'What new AI capabilities do you want your team to develop?',
      type: 'checkbox',
      field: 'q5_ai_expectations',
      options: [
        'AI Fundamentals (basics, prompting)',
        'Code generation & automation',
        'Data analysis & predictions',
        'Product design optimization',
        'LLM customization & fine-tuning',
        'Tool integration (MCP, plugins)',
        'Strategic/leadership guidance',
      ],
    },
    {
      id: 'q6',
      title: 'Industry Awareness',
      description: 'How connected is your team to AI industry developments?',
      type: 'radio',
      field: 'q6_industry_awareness',
      options: [
        'Casual (news-based understanding)',
        'Moderate (follow major releases, know key players)',
        'Engaged (read research, track benchmarks)',
        'Deep (contribute, advise, network with experts)',
      ],
    },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRadioChange = (field: string, value: number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (field: string, value: string) => {
    setFormData(prev => {
      const current = prev[field as keyof FormData] as number[];
      const index = current.indexOf(value as any);
      if (index > -1) {
        return { ...prev, [field]: current.filter((_, i) => i !== index) };
      } else {
        return { ...prev, [field]: [...current, value as any] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: 'loading', message: 'Submitting...' });

    try {
      // Prepare data for GitHub
      const timestamp = new Date().toISOString();
      const responseData = {
        ...formData,
        timestamp,
        metadata: {
          userAgent: navigator.userAgent,
          submittedAt: new Date().toLocaleString(),
        },
      };

      // Send to backend (which will commit to GitHub)
      const response = await fetch('/api/submit-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(responseData),
      });

      if (!response.ok) throw new Error('Submission failed');

      setStatus({
        type: 'success',
        message: 'Assessment submitted successfully! We\'ll analyze your responses within 24 hours.',
      });
      setFormData({
        fullName: '',
        email: '',
        department: '',
        q1_coding_agents: 0,
        q2_llm_knowledge: 0,
        q3_automated_usage: 0,
        q4_mcp_expertise: 0,
        q5_ai_expectations: [],
        q6_industry_awareness: 0,
        timestamp: new Date().toISOString(),
      });
      setCurrentStep(0);
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Failed to submit. Please try again or contact support.',
      });
    }
  };

  const progress = ((currentStep + 1) / questions.length) * 100;
  const question = questions[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-sm bg-white/80 border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Inflow Network</h1>
              <p className="text-sm text-slate-600">AI Maturity Assessment</p>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-slate-900">
                {currentStep + 1} / {questions.length}
              </div>
              <div className="text-xs text-slate-500">Step</div>
            </div>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Form */}
      <div className="max-w-2xl mx-auto px-6 py-12">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Question Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 animate-fade-in">
            <div className="mb-8">
              <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full mb-4">
                {currentStep + 1} of {questions.length}
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">{question.title}</h2>
              {question.description && (
                <p className="text-lg text-slate-600">{question.description}</p>
              )}
            </div>

            {/* Contact Fields */}
            {question.id === 'contact' && (
              <div className="space-y-6">
                {question.fields?.map(field => (
                  <div key={field.name}>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <input
                      type={field.type}
                      name={field.name}
                      value={formData[field.name as keyof FormData] as string}
                      onChange={handleInputChange}
                      required={field.required}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                      placeholder={`Enter your ${field.label.toLowerCase()}`}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Radio Options */}
            {question.type === 'radio' && (
              <div className="space-y-3">
                {question.options?.map((option, idx) => (
                  <label
                    key={idx}
                    className="flex items-center p-4 bg-slate-50 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-100 hover:border-blue-400 transition-all"
                  >
                    <input
                      type="radio"
                      name={question.field}
                      value={idx}
                      checked={formData[question.field as keyof FormData] === idx}
                      onChange={() => handleRadioChange(question.field, idx)}
                      className="w-5 h-5 text-blue-600 cursor-pointer"
                    />
                    <span className="ml-3 text-slate-700 font-medium">{option}</span>
                  </label>
                ))}
              </div>
            )}

            {/* Checkbox Options */}
            {question.type === 'checkbox' && (
              <div className="space-y-3">
                {question.options?.map((option, idx) => (
                  <label
                    key={idx}
                    className="flex items-center p-4 bg-slate-50 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-100 hover:border-blue-400 transition-all"
                  >
                    <input
                      type="checkbox"
                      checked={(formData[question.field as keyof FormData] as any[]).includes(idx)}
                      onChange={() => handleCheckboxChange(question.field, idx.toString())}
                      className="w-5 h-5 text-blue-600 cursor-pointer rounded"
                    />
                    <span className="ml-3 text-slate-700 font-medium">{option}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Status Messages */}
          {status.type === 'success' && (
            <div className="flex items-center gap-4 p-6 bg-green-50 border border-green-200 rounded-lg animate-slide-up">
              <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-900">{status.message}</p>
              </div>
            </div>
          )}

          {status.type === 'error' && (
            <div className="flex items-center gap-4 p-6 bg-red-50 border border-red-200 rounded-lg animate-slide-up">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-red-900">{status.message}</p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="flex-1 px-6 py-3 text-slate-700 font-semibold bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              ← Previous
            </button>

            {currentStep < questions.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                className="flex-1 px-6 py-3 text-white font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all"
              >
                Next →
              </button>
            ) : (
              <button
                type="submit"
                disabled={status.type === 'loading' || status.type === 'success'}
                className="flex-1 px-6 py-3 text-white font-semibold bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg hover:shadow-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                {status.type === 'loading' ? 'Submitting...' : 'Submit Assessment'}
              </button>
            )}
          </div>
        </form>

        {/* Footer Info */}
        <div className="mt-12 text-center text-sm text-slate-600">
          <p>
            This assessment takes ~5 minutes. Your responses will help us understand your AI capabilities and design a customized curriculum.
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AssessmentForm;
