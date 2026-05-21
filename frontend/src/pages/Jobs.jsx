import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Bot, Briefcase, Building2, CheckCircle2, ExternalLink, Globe2, MapPin, Search, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { applyToJob, fetchCandidateApplications, fetchJobs } from '../services/jobService';
import { GlassCard, GlowButton, MotionPage, NeonBadge } from '../components/PremiumUI';
import { cn } from '../utils/cn';

const scopeFilters = [
  { id: 'remotive', label: 'Remotive' },
  { id: 'bangalore', label: 'Bangalore' },
  { id: 'india', label: 'India' },
];

const JOBS_PER_PAGE = 10;

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

function getJobLoadErrorMessage(error) {
  if (!error?.response) {
    return 'Unable to load jobs right now. Please check your internet connection and try again.';
  }

  if (error.response?.data?.error) {
    return error.response.data.error;
  }

  if (error.response?.status >= 500) {
    return 'The job search service is temporarily unavailable. Please try again in a moment.';
  }

  return 'Unable to load jobs. Please adjust your filters or try again.';
}

function JobSkeletonCard() {
  return (
    <GlassCard className="luxury-table-row overflow-hidden p-4 sm:p-5" hover={false}>
      <div className="grid min-w-0 gap-5 md:grid-cols-[minmax(0,1fr)_180px] md:items-start">
        <div className="min-w-0">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="h-7 w-full max-w-lg animate-pulse rounded-lg bg-white/10 sm:h-8 sm:w-3/4" />
            <div className="h-6 w-24 animate-pulse rounded-full bg-white/10" />
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <div className="h-5 w-36 animate-pulse rounded bg-white/10" />
            <div className="h-5 w-44 animate-pulse rounded bg-white/10" />
            <div className="h-5 w-28 animate-pulse rounded bg-white/10" />
          </div>

          <div className="mt-4 space-y-2">
            <div className="h-4 w-full max-w-3xl animate-pulse rounded bg-white/10" />
            <div className="h-4 w-5/6 max-w-2xl animate-pulse rounded bg-white/10" />
            <div className="h-4 w-2/3 max-w-xl animate-pulse rounded bg-white/10" />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {[0, 1, 2, 3].map(item => (
              <div key={item} className="h-7 w-20 animate-pulse rounded-full bg-white/10" />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="h-16 w-full animate-pulse rounded-xl bg-white/10" />
          <div className="h-11 w-full animate-pulse rounded-xl bg-white/10" />
          <div className="h-11 w-full animate-pulse rounded-xl bg-white/10" />
        </div>
      </div>
    </GlassCard>
  );
}

function sourceBadgeClass(source) {
  if (source === 'remotive') return 'border-emerald-200/60 bg-emerald-50 text-emerald-700';
  if (source === 'adzuna') return 'border-amber-200/25 bg-amber-300/10 text-amber-100';
  return 'border-violet-200/70 bg-violet-50 text-violet-700';
}

function sourceLabel(source) {
  if (source === 'remotive') return 'Remotive';
  if (source === 'adzuna') return 'Adzuna';
  return 'Manual';
}

function formatJobType(type) {
  if (!type) return 'Full Time';
  return String(type)
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function normalize(value = '') {
  return String(value || '')
    .toLowerCase()
    .replace(/bengaluru/g, 'bangalore')
    .trim();
}

function getJobLocation(job = {}) {
  return job.location
    || job.job_location
    || job.city
    || job.companyLocation
    || job.job_city
    || job.candidate_required_location
    || job.job_country
    || '';
}

function getJobLocationValues(job = {}) {
  return [
    getJobLocation(job),
    job.location,
    job.job_location,
    job.city,
    job.companyLocation,
    job.company_location,
    job.job_city,
    job.job_state,
    job.country,
    job.job_country,
    job.candidate_required_location,
  ].map(normalize).filter(Boolean);
}

function getRegionalFallbackText(job = {}) {
  return [
    getJobLocation(job),
    job.location,
    job.candidate_required_location,
    job.title,
    job.job_title,
    job.description,
    job.job_description,
  ].map(normalize).join(' ');
}

function getSelectedLocation(scopeFilter) {
  if (scopeFilter === 'bangalore') return 'Bangalore';
  if (scopeFilter === 'india') return 'India';
  return '';
}

function matchesLocation(job, selectedLocation, scopeFilter) {
  if (!selectedLocation || selectedLocation === 'All') return true;

  const selected = normalize(selectedLocation);
  const locationValues = getJobLocationValues(job);
  const regionalFallbackText = getRegionalFallbackText(job);

  if (scopeFilter === 'bangalore') {
    return locationValues.some(value => (
      value.includes('bangalore')
      || value.includes('karnataka')
    )) || (job.source === 'remotive' && (
      regionalFallbackText.includes('bangalore')
      || regionalFallbackText.includes('india')
    ));
  }

  if (scopeFilter === 'india') {
    return locationValues.some(value => (
      value.includes('india')
      || value.includes('bangalore')
      || value.includes('karnataka')
      || value === 'in'
    )) || (job.source === 'remotive' && (
      regionalFallbackText.includes('india')
      || regionalFallbackText.includes('bangalore')
    ));
  }

  return locationValues.some(value => value.includes(selected));
}

function filterJobs(jobs, { scopeFilter, search }) {
  const safeJobs = Array.isArray(jobs) ? jobs : [];
  const selectedLocation = getSelectedLocation(scopeFilter);
  const query = normalize(search);

  return safeJobs.filter(job => {
    const locationOk = matchesLocation(job, selectedLocation, scopeFilter);
    const remotiveOk = scopeFilter !== 'remotive' || job.source === 'remotive';
    const title = normalize(job.title || job.job_title || '');
    const company = normalize(job.company || job.employer_name || '');
    const description = normalize(job.description || job.job_description || '');
    const searchOk = !query
      || title.includes(query)
      || company.includes(query)
      || description.includes(query);

    return locationOk && remotiveOk && searchOk;
  });
}

function paramsForFilters({ scopeFilter, search }) {
  const query = String(search || '').trim();
  const params = {
    search: query || undefined,
  };

  if (scopeFilter === 'remotive') {
    params.source = 'remotive';
    params.remote = true;
  }

  if (scopeFilter === 'india') {
    params.source = 'india';
    params.region = 'india';
    params.location = 'India';
  }

  if (scopeFilter === 'bangalore') {
    params.source = 'bangalore';
    params.region = 'bangalore';
    params.location = 'Bangalore';
  }

  return params;
}

export default function Jobs() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [search, setSearch] = useState('');
  const [scopeFilter, setScopeFilter] = useState('remotive');
  const [error, setError] = useState('');
  const [fallbackMessage, setFallbackMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const remotiveCacheRef = useRef([]);

  const appliedJobIds = useMemo(
    () => new Set(applications.map(item => String(item.job?._id || item.job?.id || item.job))),
    [applications],
  );
  const filteredJobs = useMemo(
    () => filterJobs(jobs, { scopeFilter, search }),
    [jobs, scopeFilter, search],
  );
  const visibleJobs = useMemo(
    () => filteredJobs.slice(0, JOBS_PER_PAGE),
    [filteredJobs],
  );

  async function loadJobs(overrides = {}) {
    setIsLoading(true);
    setError('');
    setFallbackMessage('');

    const page = Number(overrides.page || currentPage || 1);
    const params = {
      ...paramsForFilters({ scopeFilter, search }),
      page,
      limit: JOBS_PER_PAGE,
      ...overrides,
    };

    try {
      const jobData = await fetchJobs(params);
      const safeJobs = Array.isArray(jobData) ? jobData : jobData.jobs || [];
      const meta = Array.isArray(jobData) ? {} : jobData.meta || {};
      const remotiveJobs = safeJobs.filter(job => job.source === 'remotive');

      if (remotiveJobs.length) {
        remotiveCacheRef.current = remotiveJobs;
      }

      const cachedFallbackJobs = !safeJobs.length && meta.adzunaUnavailable
        ? filterJobs(remotiveCacheRef.current, { scopeFilter, search })
        : [];
      const nextJobs = cachedFallbackJobs.length ? cachedFallbackJobs : safeJobs;

      setJobs(nextJobs);
      setHasNextPage(nextJobs.length >= JOBS_PER_PAGE);
      setFallbackMessage(meta.message || (cachedFallbackJobs.length ? 'Showing available remote jobs for this location' : ''));

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
      setJobs([]);
      setHasNextPage(false);
      setError(getJobLoadErrorMessage(err));
      setFallbackMessage('');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadJobs();
  }, [scopeFilter, user?.role, currentPage]);

  const resetPage = setter => value => {
    setter(value);
    setCurrentPage(1);
  };

  const submitSearch = event => {
    event.preventDefault();
    if (currentPage === 1) {
      loadJobs({ search, page: 1 });
    } else {
      setCurrentPage(1);
    }
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

  const openJobDetail = job => {
    const jobId = String(job._id || job.id);

    try {
      sessionStorage.setItem(`job-detail:${jobId}`, JSON.stringify(job));
    } catch {
      // Route state still carries the job for normal navigation.
    }

    navigate(`/jobs/${encodeURIComponent(jobId)}`, { state: { job } });
  };

  return (
    <MotionPage className="mx-auto w-full max-w-7xl overflow-hidden px-4 pb-16 pt-6 sm:px-6 sm:pt-8 lg:px-8">
      <GlassCard className="cinematic-stage overflow-hidden p-4 xs:p-5 sm:p-6 md:p-8" hover={false}>
        <NeonBadge><Sparkles size={14} /> Adzuna + Remotive + Manual</NeonBadge>
        <div className="mt-6 grid min-w-0 gap-6 md:grid-cols-[minmax(0,1fr)_minmax(280px,420px)] md:items-end lg:grid-cols-[minmax(0,1fr)_minmax(320px,520px)]">
          <div className="min-w-0">
            <h1 className="dashboard-title max-w-4xl overflow-hidden break-words text-2xl font-black uppercase leading-tight text-white xs:text-3xl sm:text-4xl md:text-5xl lg:text-7xl lg:leading-none">Browse Jobs</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:mt-5 sm:text-base sm:leading-7 md:text-lg md:leading-8">
              Search remote roles, India tech openings, Bangalore jobs, internships, and recruiter-posted roles in one polished feed.
            </p>
          </div>
          <form onSubmit={submitSearch} className="box-border flex w-full min-w-0 flex-col gap-3 overflow-hidden px-0 sm:px-0 md:flex-row md:items-stretch">
            <div className="relative box-border w-full min-w-0 overflow-hidden">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-500/80 sm:left-4 sm:h-5 sm:w-5" size={18} />
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                className="field box-border h-12 w-full min-w-0 overflow-hidden truncate pl-11 pr-4 text-sm leading-5 placeholder:text-slate-400 sm:h-[3.25rem] sm:pl-12 sm:pr-5 sm:text-base"
                placeholder="Search Title, Company, Or Skill"
              />
            </div>
            <GlowButton disabled={isLoading} className="box-border h-12 w-full max-w-full justify-center px-5 text-sm sm:h-[3.25rem] md:w-auto md:flex-shrink-0">Search</GlowButton>
          </form>
        </div>

        <div className="mt-6 flex min-w-0 flex-col gap-4 md:mt-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid w-full grid-cols-1 gap-2 xs:grid-cols-3 sm:flex sm:flex-wrap lg:w-auto">
            {scopeFilters.map(filter => (
              <button
                key={filter.id}
                type="button"
                onClick={() => resetPage(setScopeFilter)(filter.id)}
                className={cn(
                  'inline-flex min-h-10 min-w-0 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition sm:min-h-11 sm:px-4 sm:text-sm',
                  scopeFilter === filter.id
                    ? 'border-violet-200 bg-violet-100 text-violet-950'
                    : 'border-white/10 bg-white/[0.045] text-slate-300 hover:bg-white/[0.075]',
                )}
              >
                <Globe2 size={15} />
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {error && (
        <div role="alert" className="mt-4 flex min-w-0 items-start gap-3 rounded-xl border border-rose-300/25 bg-rose-400/10 px-3 py-3 text-sm text-rose-100 sm:px-4">
          <AlertCircle className="mt-0.5 flex-shrink-0" size={18} />
          <div className="min-w-0">
            <p className="font-black">Job Search Failed</p>
            <p className="mt-1 break-words text-rose-50/90">{error}</p>
          </div>
        </div>
      )}
      {fallbackMessage && !error && (
        <p className="mt-4 rounded-xl border border-sky-300/15 bg-sky-400/10 px-3 py-2 text-xs font-semibold text-sky-100 break-words">
          {fallbackMessage}
        </p>
      )}

      {isLoading ? (
        <section aria-label="Loading jobs" className="mt-5 grid gap-4">
          {[0, 1, 2].map(item => (
            <JobSkeletonCard key={item} />
          ))}
        </section>
      ) : (
        <section data-reveal="section" className="mt-5 grid gap-4">
          {visibleJobs.map((job, index) => {
            const jobId = String(job._id || job.id);
            const applied = appliedJobIds.has(jobId);

            return (
              <motion.article
                key={jobId}
                role="button"
                tabIndex={0}
                onClick={() => openJobDetail(job)}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openJobDetail(job);
                  }
                }}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.025 }}
                className="min-w-0 cursor-pointer"
              >
                <GlassCard className="luxury-table-row overflow-hidden p-4 sm:p-5" hover={false}>
                  <div className="grid min-w-0 gap-5 md:grid-cols-[minmax(0,1fr)_220px] md:items-start lg:grid-cols-[minmax(0,1fr)_auto]">
                    <div className="min-w-0">
                      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                        <h2 className="afai-wordmark text-lg font-black leading-tight text-white break-words xs:text-xl sm:text-2xl lg:text-3xl">{job.title}</h2>
                        <span className={cn('inline-flex w-fit max-w-full rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] sm:text-xs sm:tracking-[0.16em]', sourceBadgeClass(job.source))}>
                          {sourceLabel(job.source)}
                        </span>
                      </div>

                      <div className="mt-3 grid min-w-0 gap-2 text-xs text-slate-300 sm:flex sm:flex-wrap sm:gap-x-5 sm:gap-y-2 sm:text-sm">
                        <span className="inline-flex min-w-0 items-start gap-2">
                          <Building2 size={16} className="text-violet-500/80 flex-shrink-0" />
                          <span className="min-w-0 break-words">{job.company}</span>
                        </span>
                        <span className="inline-flex min-w-0 items-start gap-2">
                          <MapPin size={16} className="text-violet-500/80 flex-shrink-0" />
                          <span className="min-w-0 break-words">{job.location || 'Remote'}</span>
                        </span>
                        <span className="inline-flex min-w-0 items-start gap-2">
                          <Briefcase size={16} className="text-violet-500/80 flex-shrink-0" />
                          <span className="min-w-0 break-words">{formatJobType(job.type)}</span>
                        </span>
                      </div>

                      <p className="mt-3 max-w-4xl text-xs leading-5 text-slate-400 break-words sm:text-sm sm:leading-6">{compactDescription(job.description)}</p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {(job.skills || []).slice(0, 8).map(skill => (
                          <span key={`${jobId}-${skill}`} className="max-w-full rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold text-slate-200 break-words sm:text-xs">{skill}</span>
                        ))}
                      </div>
                    </div>

                    <div className="flex h-full w-full min-w-0 flex-col gap-3 md:items-stretch lg:w-auto lg:items-end">
                      <div className="w-full rounded-xl border border-white/10 bg-white/[0.045] px-3 py-3 sm:px-4 lg:text-right">
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Salary</p>
                        <p className="mt-1 text-xs sm:text-sm font-bold text-stone-100 break-words">{formatSalary(job.salary)}</p>
                      </div>
                      <button
                        type="button"
                        disabled={!job.applyLink && (user?.role !== 'candidate' || !hasBackendToken() || applied || isApplying === jobId)}
                        onClick={event => {
                          event.stopPropagation();
                          apply(job);
                        }}
                        className="contrast-action inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-violet-200 bg-slate-950 px-4 py-2.5 text-xs font-black text-white transition hover:bg-violet-900 disabled:bg-white/70 disabled:text-slate-400 sm:text-sm"
                      >
                        {applied ? <CheckCircle2 size={17} /> : <ExternalLink size={17} />}
                        {applied ? 'Applied' : 'Apply'}
                      </button>
                      <button
                        type="button"
                        onClick={event => {
                          event.stopPropagation();
                          navigate('/afai', { state: { role: job.title, technologies: job.skills || [] } });
                        }}
                        className="soft-action inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-violet-200/70 bg-white/80 px-4 py-2.5 text-xs font-black text-slate-800 transition hover:border-violet-300 hover:bg-violet-50 sm:text-sm"
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

          {visibleJobs.length === 0 && (
            <GlassCard className="flex min-h-[260px] items-center justify-center p-8 text-center" hover={false}>
              <div>
                <Briefcase className="mx-auto text-slate-500" size={38} />
                <h2 className="mt-4 text-lg sm:text-xl font-black text-stone-100">No Jobs Found</h2>
                <p className="mt-2 max-w-md text-xs sm:text-sm leading-6 text-slate-400">Try a different keyword or clear one of the active filters.</p>
              </div>
            </GlassCard>
          )}

          {visibleJobs.length > 0 && (
            <div className="flex flex-col items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3 sm:flex-row">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                Page {currentPage}
              </p>
              <div className="flex w-full gap-2 sm:w-auto">
                <button
                  type="button"
                  disabled={currentPage === 1 || isLoading}
                  onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                  className="inline-flex flex-1 items-center justify-center rounded-xl border border-white/10 bg-white/[0.045] px-4 py-2 text-sm font-black text-slate-200 transition hover:bg-white/[0.075] disabled:cursor-not-allowed disabled:opacity-45 sm:flex-none"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={!hasNextPage || isLoading}
                  onClick={() => setCurrentPage(page => page + 1)}
                  className="inline-flex flex-1 items-center justify-center rounded-xl border border-violet-200 bg-violet-100 px-4 py-2 text-sm font-black text-violet-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-45 sm:flex-none"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </MotionPage>
  );
}
