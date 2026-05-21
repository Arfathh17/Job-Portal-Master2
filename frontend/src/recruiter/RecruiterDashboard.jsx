import { useEffect, useState } from 'react';
import { Briefcase, PenLine, Send, Sparkles, UsersRound } from 'lucide-react';
import { createJob, fetchRecruiterApplications, fetchRecruiterJobs } from '../services/jobService';
import { GlassCard, GlowButton, MotionPage, NeonBadge, StatCard } from '../components/PremiumUI';

function formatStatus(status) {
  return String(status || 'Pending')
    .split(/[-_\s]+/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function RecruiterDashboard() {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [form, setForm] = useState({
    title: '',
    company: '',
    location: '',
    description: '',
    salary: '',
    applyLink: '',
    skills: '',
    type: 'full-time',
    remote: true,
  });
  const [error, setError] = useState('');

  async function loadData() {
    const [jobData, applicationData] = await Promise.all([fetchRecruiterJobs(), fetchRecruiterApplications()]);
    setJobs(jobData);
    setApplications(applicationData);
  }

  useEffect(() => {
    loadData().catch(() => setError('Unable to load recruiter dashboard.'));
  }, []);

  const update = event => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setForm(prev => ({ ...prev, [event.target.name]: value }));
  };

  const submit = async event => {
    event.preventDefault();
    setError('');
    try {
      await createJob({ ...form, skills: form.skills.split(',').map(item => item.trim()).filter(Boolean), requirements: [] });
      setForm({
        title: '',
        company: '',
        location: '',
        description: '',
        salary: '',
        applyLink: '',
        skills: '',
        type: 'full-time',
        remote: true,
      });
      await loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to post job.');
    }
  };

  return (
    <MotionPage className="mx-auto w-full max-w-7xl overflow-hidden px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <section className="cinematic-stage mb-6 overflow-hidden rounded-[1.5rem] p-5 sm:p-8">
        <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,440px)] lg:items-end">
          <div className="min-w-0">
            <NeonBadge><Sparkles size={14} /> Recruiter control room</NeonBadge>
            <h1 className="dashboard-title mt-6 max-w-4xl overflow-hidden break-words text-3xl font-black uppercase leading-tight text-white sm:text-4xl md:text-6xl lg:text-7xl lg:leading-none">Shape roles with sharper signal.</h1>
            <p className="mt-5 max-w-2xl text-base sm:text-lg leading-7 sm:leading-8 text-slate-300">
              Publish clean briefs, watch candidate flow, and keep every open role feeling intentional.
            </p>
          </div>
          <div className="grid min-w-0 gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <StatCard label="Active Jobs" value={jobs.length} icon={Briefcase} />
            <StatCard label="Applications" value={applications.length} icon={UsersRound} tone="purple" />
            <StatCard label="Hiring pulse" value="Live" icon={Sparkles} tone="emerald" />
          </div>
        </div>
      </section>

      <section className="grid min-w-0 gap-5 overflow-hidden lg:grid-cols-[minmax(0,1.05fr)_minmax(280px,420px)]">
        <GlassCard className="overflow-hidden p-5 sm:p-6" hover={false}>
          <NeonBadge><PenLine size={14} /> Role brief</NeonBadge>
          <div className="mt-4 flex flex-col gap-3 sm:gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="afai-wordmark text-2xl sm:text-3xl font-black text-stone-50">Build the opening</h2>
              <p className="mt-2 max-w-xl text-xs sm:text-sm leading-6 text-slate-400">Write a clean role brief, publish it, and let the workspace keep the candidate flow visible.</p>
            </div>
          </div>
          <form onSubmit={submit} className="mt-6 grid w-full min-w-0 gap-4 overflow-hidden">
            <input name="title" value={form.title} onChange={update} className="field w-full" placeholder="Job title" required />
            <div className="grid gap-4 md:grid-cols-2">
              <input name="company" value={form.company} onChange={update} className="field w-full" placeholder="Company" required />
              <input name="location" value={form.location} onChange={update} className="field w-full" placeholder="Location" required />
            </div>
            <textarea name="description" value={form.description} onChange={update} className="field min-h-[120px] w-full sm:min-h-[130px]" placeholder="Job description" required />
            <div className="grid gap-4 md:grid-cols-2">
              <input name="salary" value={form.salary} onChange={update} className="field w-full" placeholder="Salary range" />
              <input name="applyLink" type="url" value={form.applyLink} onChange={update} className="field w-full" placeholder="Apply link" />
            </div>
            <input name="skills" value={form.skills} onChange={update} className="field w-full" placeholder="Skills: React, Node.js, MongoDB" />
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-4">
              <select name="type" value={form.type} onChange={update} className="field w-full sm:max-w-[190px]">
                <option value="full-time">Full Time</option>
                <option value="part-time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
              <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-300">
                <input name="remote" type="checkbox" checked={form.remote} onChange={update} className="h-4 w-4 accent-violet-400" />
                Remote role
              </label>
            </div>
            {error && <p className="rounded-xl border border-rose-300/25 bg-rose-400/10 px-3 py-2 text-xs sm:text-sm text-rose-100 break-words">{error}</p>}
            <GlowButton className="w-full sm:w-fit"><Send size={17} /> Post job</GlowButton>
          </form>
        </GlassCard>

        <aside className="min-w-0 space-y-5 overflow-hidden">
          <GlassCard className="overflow-hidden p-5" hover={false}>
            <h2 className="afai-wordmark text-lg sm:text-xl font-black text-stone-50">Open roles</h2>
            <div className="mt-4 space-y-3">
              {jobs.length === 0 && <p className="text-xs sm:text-sm text-slate-400">No jobs posted yet.</p>}
              {jobs.map((job, index) => (
                <div key={job._id} className="luxury-table-row premium-card flex gap-3 p-3">
                  <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.055] text-xs font-black text-slate-400">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                  <p className="font-bold text-stone-50 text-sm break-words">{job.title}</p>
                  <p className="text-xs sm:text-sm text-slate-400 break-words">{job.company} - {job.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="overflow-hidden p-5" hover={false}>
            <div className="flex items-center gap-2">
              <UsersRound className="text-violet-700 flex-shrink-0" size={22} />
              <h2 className="afai-wordmark text-lg sm:text-xl font-black text-stone-50">Candidate flow</h2>
            </div>
            <div className="mt-4 space-y-3">
              {applications.length === 0 && <p className="text-xs sm:text-sm text-slate-400">No applications yet.</p>}
              {applications.map(application => (
                <div key={application._id || `${application.job?._id}-${application.appliedAt}`} className="luxury-table-row premium-card p-3 text-xs sm:text-sm">
                  <p className="font-bold text-stone-50 break-words">{application.candidate?.name || 'Candidate'}</p>
                  <p className="text-slate-400 break-words">{application.job?.title || application.job?.company}</p>
                  <p className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-violet-700">{formatStatus(application.status)}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </aside>
      </section>
    </MotionPage>
  );
}
