import { useEffect, useMemo, useState } from 'react';
import { Bot, Briefcase, Building2, CheckCircle2, ExternalLink, Filter, Globe2, Loader2, MapPin, Search, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { applyToJob, fetchCandidateApplications, fetchJobs } from '../services/jobService';
import { GlassCard, GlowButton, MotionPage, NeonBadge } from '../components/PremiumUI';
import { cn } from '../utils/cn';

const scopeFilters = [
  { id: 'all', label: 'All Jobs' },
  { id: 'remote', label: 'Remote' },
  { id: 'india', label: 'India' },
  { id: 'bangalore', label: 'Bangalore' },
];

const typeFilters = [
  { id: 'internship', label: 'Internship' },
  { id: 'full-time', label: 'Full Time' },
];

function hasBackendToken() {
  return Boolean(localStorage.getItem('ai_job_portal_token'));
}

function formatSalary(salary) {
  if (!salary) return 'Not disclosed';
  if (typeof salary === 'string') return salary || 'Not disclosed';
  if (salary.min && salary.max) return `${salary.currency || 'USD'} ${Number(salary.min).toLocaleString()} - ${Number(salary.max).toLocaleString()}`;
  if (salary.min) return `${salary.currency || 'USD'} ${Number(salary.min).toLocaleString()}+`;
  return 'Not disclosed';
}

function compactDescription(description = '') {
  const text = description.replace(/\s+/g, ' ').trim();
  return text.length > 220 ? `${text.slice(0, 220)}...` : text;
}

function sourceBadgeClass(source) {
  if (source === 'remotive') return 'border-emerald-200/60 bg-emerald-50 text-emerald-700';
  if (source === 'jsearch') return 'border-amber-200/25 bg-amber-300/10 text-amber-100';
  return 'border-violet-200/70 bg-violet-50 text-violet-700';
}

function sourceLabel(source) {
  if (source === 'remotive') return 'Remotive';
  if (source === 'jsearch') return 'JSearch';
  return 'Manual';
}

function formatJobType(type) {
  if (!type) return 'Full Time';
  return String(type)
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function normalizeLocationValue(value = '') {
  return String(value || '')
    .toLowerCase()
    .replace(/bengaluru/g, 'bangalore')
    .replace(/\s+/g, ' ')
    .trim();
}

function getJobLocationValues(job = {}) {
  return [
    job.location,
    job.city,
    job.country,
    job.job_city,
    job.job_country,
    job.job_location,
    job.job_state,
  ]
    .map(normalizeLocationValue)
    .filter(Boolean);
}

function includesAnyLocation(values, terms) {
  const normalizedTerms = terms.map(normalizeLocationValue);
  return values.some(value => normalizedTerms.some(term => value.includes(term)));
}

function matchesScope(job, scopeFilter) {
  const values = getJobLocationValues(job);

  if (scopeFilter === 'remote') return Boolean(job.remote);
  if (scopeFilter === 'india') {
    return includesAnyLocation(values, ['india', 'in', 'bangalore', 'bengaluru', 'karnataka', 'remote india']);
  }
  if (scopeFilter === 'bangalore') {
    return includesAnyLocation(values, ['bangalore', 'bengaluru', 'karnataka', 'remote india']);
  }

  return true;
}

function applyVisibleFilters(jobs, { scopeFilter, typeFilter }) {
  return jobs.filter(job => {
    if (!matchesScope(job, scopeFilter)) return false;
    if (typeFilter && job.type !== typeFilter) return false;
    return true;
  });
}

function paramsForFilters({ scopeFilter, typeFilter, search }) {
  const params = {
    search: search || undefined,
    type: typeFilter || undefined,
  };

  if (scopeFilter === 'remote') {
    params.source = 'remote';
    params.remote = true;
  }

  if (scopeFilter === 'india') {
    params.source = 'india';
    params.region = 'india';
  }

  if (scopeFilter === 'bangalore') {
    params.source = 'bangalore';
    params.region = 'bangalore';
  }

  return params;
}

export default function Jobs() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [search, setSearch] = useState('');
  const [scopeFilter, setScopeFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState('');

  const appliedJobIds = useMemo(
    () => new Set(applications.map(item => String(item.job?._id || item.job?.id || item.job))),
    [applications],
  );

  async function loadJobs(overrides = {}) {
    setIsLoading(true);
    setError('');

    const params = {
      ...paramsForFilters({ scopeFilter, typeFilter, search }),
      ...overrides,
    };

    try {
      const jobData = await fetchJobs(params);
      setJobs(applyVisibleFilters(jobData, { scopeFilter, typeFilter }));

      if (user?.role === 'candidate' && hasBackendToken()) {
        try {
          const applicationData = await fetchCandidateApplications();
          setApplications(applicationData);
        } catch {
          setApplications([]);
        }
      } else {
        setApplications([]);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to load jobs.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadJobs();
  }, [scopeFilter, typeFilter, user?.role]);

  const submitSearch = event => {
    event.preventDefault();
    loadJobs({ search });
  };

  const apply = async job => {
    if (job.applyLink) {
      window.open(job.applyLink, '_blank', 'noopener,noreferrer');
      return;
    }

    if (user?.role !== 'candidate' || !hasBackendToken()) return;

    setError('');
    setIsApplying(job._id);

    try {
      await applyToJob(job._id);
      await loadJobs();
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to apply.');
    } finally {
      setIsApplying('');
    }
  };

  return (
    <MotionPage className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 md:px-10">
      <GlassCard className="cinematic-stage p-5 sm:p-8" hover={false}>
        <NeonBadge><Sparkles size={14} /> Remotive + JSearch + Manual</NeonBadge>
        <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,520px)] lg:items-end">
          <div>
            <h1 className="dashboard-title max-w-4xl overflow-hidden break-words text-3xl font-black uppercase leading-tight text-white sm:text-4xl md:text-6xl lg:text-7xl lg:leading-none">Browse Jobs</h1>
            <p className="mt-5 max-w-2xl text-base sm:text-lg leading-7 sm:leading-8 text-slate-300">
              Search remote roles, India tech openings, Bangalore jobs, internships, and recruiter-posted roles in one polished feed.
            </p>
          </div>
          <form onSubmit={submitSearch} className="grid w-full gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3.5 text-violet-500/80" size={18} />
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                className="field pl-10"
                placeholder="Search Title, Company, Or Skill"
              />
            </div>
            <GlowButton disabled={isLoading} className="w-full sm:w-auto">Search</GlowButton>
          </form>
        </div>

        <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {scopeFilters.map(filter => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setScopeFilter(filter.id)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition sm:px-4 sm:text-sm',
                  scopeFilter === filter.id
                    ? 'border-violet-200 bg-violet-100 text-violet-950'
                    : 'border-white/10 bg-white/[0.045] text-slate-300 hover:bg-white/[0.075]',
                )}
              >
                {filter.id === 'india' || filter.id === 'bangalore' ? <Globe2 size={15} /> : null}
                {filter.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              <Filter size={14} />
              Filters
            </span>
            {typeFilters.map(filter => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setTypeFilter(prev => (prev === filter.id ? '' : filter.id))}
                className={cn(
                  'rounded-xl border px-3 py-2 text-xs font-bold transition sm:text-sm',
                  typeFilter === filter.id
                    ? 'border-fuchsia-200 bg-fuchsia-100 text-fuchsia-950'
                    : 'border-white/10 bg-white/[0.045] text-slate-300 hover:bg-white/[0.075]',
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {error && <p className="mt-4 rounded-xl border border-rose-300/25 bg-rose-400/10 px-3 py-2 text-sm text-rose-100 break-words">{error}</p>}

      {isLoading ? (
        <GlassCard className="mt-5 flex min-h-[260px] items-center justify-center p-8" hover={false}>
          <div className="flex flex-col items-center gap-3 text-slate-300">
            <Loader2 className="animate-spin text-violet-700" size={34} />
            <p className="text-sm font-bold">Loading Jobs...</p>
          </div>
        </GlassCard>
      ) : (
        <section data-reveal="section" className="mt-5 grid gap-4">
          {jobs.map((job, index) => {
            const jobId = String(job._id || job.id);
            const applied = appliedJobIds.has(jobId);

            return (
              <motion.article
                key={jobId}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.025 }}
              >
                <GlassCard className="luxury-table-row p-4 sm:p-5" hover={false}>
                  <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                    <div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                        <h2 className="afai-wordmark text-xl sm:text-2xl lg:text-3xl font-black leading-tight text-white break-words">{job.title}</h2>
                        <span className={cn('rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.16em] whitespace-nowrap', sourceBadgeClass(job.source))}>
                          {sourceLabel(job.source)}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-x-3 sm:gap-x-5 gap-y-2 text-xs sm:text-sm text-slate-300">
                        <span className="inline-flex items-center gap-2">
                          <Building2 size={16} className="text-violet-500/80 flex-shrink-0" />
                          <span className="break-words">{job.company}</span>
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <MapPin size={16} className="text-violet-500/80 flex-shrink-0" />
                          <span className="break-words">{job.location || 'Remote'}</span>
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <Briefcase size={16} className="text-violet-500/80 flex-shrink-0" />
                          {formatJobType(job.type)}
                        </span>
                      </div>

                      <p className="mt-3 max-w-4xl text-xs sm:text-sm leading-6 text-slate-400 break-words">{compactDescription(job.description)}</p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {(job.skills || []).slice(0, 8).map(skill => (
                          <span key={`${jobId}-${skill}`} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-slate-200">{skill}</span>
                        ))}
                      </div>
                    </div>

                    <div className="flex h-full flex-col gap-3 lg:items-end w-full lg:w-auto">
                      <div className="w-full rounded-xl border border-white/10 bg-white/[0.045] px-4 py-3 lg:text-right">
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Salary</p>
                        <p className="mt-1 text-xs sm:text-sm font-bold text-stone-100 break-words">{formatSalary(job.salary)}</p>
                      </div>
                      <button
                        type="button"
                        disabled={!job.applyLink && (user?.role !== 'candidate' || !hasBackendToken() || applied || isApplying === jobId)}
                        onClick={() => apply(job)}
                        className="contrast-action inline-flex w-full items-center justify-center gap-2 rounded-xl border border-violet-200 bg-slate-950 px-4 py-2.5 text-xs sm:text-sm font-black text-white transition hover:bg-violet-900 disabled:bg-white/70 disabled:text-slate-400"
                      >
                        {applied ? <CheckCircle2 size={17} /> : <ExternalLink size={17} />}
                        {applied ? 'Applied' : 'Apply'}
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('/afai', { state: { role: job.title, technologies: job.skills || [] } })}
                        className="soft-action inline-flex w-full items-center justify-center gap-2 rounded-xl border border-violet-200/70 bg-white/80 px-4 py-2.5 text-xs sm:text-sm font-black text-slate-800 transition hover:border-violet-300 hover:bg-violet-50"
                      >
                        <Bot size={17} />
                        <span className="hidden xs:inline">Practice Interview</span>
                        <span className="xs:hidden">Practice</span>
                      </button>
                    </div>
                  </div>
                </GlassCard>
              </motion.article>
            );
          })}

          {jobs.length === 0 && (
            <GlassCard className="flex min-h-[260px] items-center justify-center p-8 text-center" hover={false}>
              <div>
                <Briefcase className="mx-auto text-slate-500" size={38} />
                <h2 className="mt-4 text-lg sm:text-xl font-black text-stone-100">No Jobs Found</h2>
                <p className="mt-2 max-w-md text-xs sm:text-sm leading-6 text-slate-400">Try a different keyword or clear one of the active filters.</p>
              </div>
            </GlassCard>
          )}
        </section>
      )}
    </MotionPage>
  );
}
