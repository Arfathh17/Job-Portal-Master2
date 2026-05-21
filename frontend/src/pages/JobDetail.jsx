import { ArrowLeft, Briefcase, Building2, ExternalLink, MapPin, Wallet } from 'lucide-react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { GlassCard, GlowButton, MotionPage, NeonBadge } from '../components/PremiumUI';

function formatSalary(salary) {
  if (!salary) return 'Not disclosed';
  if (typeof salary === 'string') return salary || 'Not disclosed';
  if (salary.min && salary.max) return `${salary.currency || 'USD'} ${Number(salary.min).toLocaleString()} - ${Number(salary.max).toLocaleString()}`;
  if (salary.min) return `${salary.currency || 'USD'} ${Number(salary.min).toLocaleString()}+`;
  return 'Not disclosed';
}

function getStoredJob(jobId) {
  try {
    const storedJob = sessionStorage.getItem(`job-detail:${jobId}`);
    return storedJob ? JSON.parse(storedJob) : null;
  } catch {
    return null;
  }
}

function getApplyUrl(job = {}) {
  const safeJob = job || {};
  return safeJob.applyLink || safeJob.url || safeJob.redirect_url || safeJob.job_apply_link || '';
}

export default function JobDetail() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const job = state?.job || getStoredJob(id);
  const applyUrl = getApplyUrl(job);

  if (!job) {
    return (
      <MotionPage className="mx-auto w-full max-w-4xl overflow-hidden px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <GlassCard className="overflow-hidden p-6 text-center sm:p-8" hover={false}>
          <Briefcase className="mx-auto text-slate-500" size={38} />
          <h1 className="mt-4 text-2xl font-black text-white">Job Not Found</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-400">
            Return to the jobs page and open a listing from the current results.
          </p>
          <GlowButton as={Link} to="/jobs" className="mt-5 w-full sm:w-auto">
            <ArrowLeft size={17} />
            Back To Jobs
          </GlowButton>
        </GlassCard>
      </MotionPage>
    );
  }

  return (
    <MotionPage className="mx-auto w-full max-w-5xl overflow-hidden px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.045] px-4 py-2 text-sm font-black text-slate-200 transition hover:bg-white/[0.075] sm:w-auto"
      >
        <ArrowLeft size={17} />
        Back
      </button>

      <GlassCard className="overflow-hidden p-5 sm:p-8" hover={false}>
        <NeonBadge>{job.source || 'Job Detail'}</NeonBadge>
        <div className="mt-6 grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-start">
          <div className="min-w-0">
            <h1 className="dashboard-title text-3xl font-black uppercase leading-tight text-white sm:text-5xl">
              {job.title || job.job_title || 'Untitled Role'}
            </h1>

            <div className="mt-5 grid min-w-0 gap-3 text-sm text-slate-300 sm:flex sm:flex-wrap sm:gap-x-5 sm:gap-y-3">
              <span className="inline-flex min-w-0 items-start gap-2">
                <Building2 size={17} className="text-violet-500/80" />
                <span className="break-words">{job.company || job.employer_name || 'Unknown company'}</span>
              </span>
              <span className="inline-flex min-w-0 items-start gap-2">
                <MapPin size={17} className="text-violet-500/80" />
                <span className="break-words">{job.location || job.job_location || 'Remote'}</span>
              </span>
              <span className="inline-flex min-w-0 items-start gap-2">
                <Wallet size={17} className="text-violet-500/80" />
                <span className="break-words">{formatSalary(job.salary)}</span>
              </span>
            </div>
          </div>

          <GlowButton
            as="button"
            type="button"
            disabled={!applyUrl}
            onClick={() => window.open(applyUrl, '_blank', 'noopener,noreferrer')}
            className="w-full"
          >
            <ExternalLink size={17} />
            Apply Now
          </GlowButton>
        </div>

        <section className="mt-8 border-t border-white/10 pt-6">
          <h2 className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Full Job Description</h2>
          <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-slate-300">
            {job.description || job.job_description || 'No description available.'}
          </p>
        </section>
      </GlassCard>
    </MotionPage>
  );
}
