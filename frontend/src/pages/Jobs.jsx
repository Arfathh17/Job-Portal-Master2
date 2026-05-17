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
  if (source === 'remotive') return 'border-teal-200/20 bg-teal-300/10 text-teal-100';
  if (source === 'jsearch') return 'border-amber-200/25 bg-amber-300/10 text-amber-100';
  return 'border-sky-200/20 bg-sky-300/10 text-sky-100';
}

function sourceLabel(source) {
  if (source === 'remotive') return 'Remotive';
  if (source === 'jsearch') return 'JSearch';
  return 'Manual';
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
    <MotionPage className="mx-auto max-w-7xl px-5 pb-12 pt-8">
      <GlassCard className="p-5 sm:p-7" hover={false}>
        <NeonBadge><Sparkles size={14} /> Remotive + JSearch + Manual</NeonBadge>
        <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(360px,520px)] lg:items-end">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white">Browse jobs</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Search remote roles, India tech openings, Bangalore jobs, internships, and recruiter-posted roles in one place.
            </p>
          </div>
          <form onSubmit={submitSearch} className="grid w-full gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3.5 text-sky-100/70" size={18} />
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                className="field pl-10"
                placeholder="Search title, company, or skill"
              />
            </div>
            <GlowButton disabled={isLoading}>Search</GlowButton>
          </form>
        </div>

        <div className="mt-6 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {scopeFilters.map(filter => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setScopeFilter(filter.id)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition',
                  scopeFilter === filter.id
                    ? 'border-sky-100/40 bg-sky-100 text-slate-950'
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
                  'rounded-xl border px-3 py-2 text-sm font-bold transition',
                  typeFilter === filter.id
                    ? 'border-indigo-100/40 bg-indigo-100 text-slate-950'
                    : 'border-white/10 bg-white/[0.045] text-slate-300 hover:bg-white/[0.075]',
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {error && <p className="mt-4 rounded-xl border border-rose-300/25 bg-rose-400/10 px-3 py-2 text-sm text-rose-100">{error}</p>}

      {isLoading ? (
        <GlassCard className="mt-5 flex min-h-[260px] items-center justify-center p-8" hover={false}>
          <div className="flex flex-col items-center gap-3 text-slate-300">
            <Loader2 className="animate-spin text-sky-100" size={34} />
            <p className="text-sm font-bold">Loading jobs...</p>
          </div>
        </GlassCard>
      ) : (
        <section className="mt-5 grid gap-4">
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
                <GlassCard className="p-4 sm:p-5" hover={false}>
                  <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_230px] lg:items-start">
                    <div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                        <h2 className="text-xl font-black leading-tight text-white sm:text-2xl">{job.title}</h2>
                        <span className={cn('rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.16em]', sourceBadgeClass(job.source))}>
                          {sourceLabel(job.source)}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-300">
                        <span className="inline-flex items-center gap-2">
                          <Building2 size={16} className="text-sky-100/75" />
                          {job.company}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <MapPin size={16} className="text-sky-100/75" />
                          {job.location || 'Remote'}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <Briefcase size={16} className="text-sky-100/75" />
                          {job.type || 'full-time'}
                        </span>
                      </div>

                      <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-400">{compactDescription(job.description)}</p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {(job.skills || []).slice(0, 8).map(skill => (
                          <span key={`${jobId}-${skill}`} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-slate-200">{skill}</span>
                        ))}
                      </div>
                    </div>

                    <div className="flex h-full flex-col gap-3 lg:items-end">
                      <div className="w-full rounded-xl border border-white/10 bg-white/[0.045] px-4 py-3 lg:text-right">
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Salary</p>
                        <p className="mt-1 text-sm font-bold text-stone-100">{formatSalary(job.salary)}</p>
                      </div>
                      <button
                        type="button"
                        disabled={!job.applyLink && (user?.role !== 'candidate' || !hasBackendToken() || applied || isApplying === jobId)}
                        onClick={() => apply(job)}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-stone-50 px-4 py-2.5 text-sm font-black text-slate-950 transition hover:bg-sky-100 disabled:bg-white/[0.08] disabled:text-slate-400"
                      >
                        {applied ? <CheckCircle2 size={17} /> : <ExternalLink size={17} />}
                        {applied ? 'Applied' : 'Apply'}
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('/afai', { state: { role: job.title, technologies: job.skills || [] } })}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.055] px-4 py-2.5 text-sm font-black text-stone-100 transition hover:border-sky-100/30 hover:bg-white/[0.09]"
                      >
                        <Bot size={17} />
                        Practice Interview
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
                <h2 className="mt-4 text-xl font-black text-stone-100">No jobs found</h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">Try a different keyword or clear one of the active filters.</p>
              </div>
            </GlassCard>
          )}
        </section>
      )}
    </MotionPage>
  );
}
