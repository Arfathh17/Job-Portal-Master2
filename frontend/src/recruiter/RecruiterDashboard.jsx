import { useEffect, useState } from 'react';
import { Briefcase, PenLine, Send, Sparkles, UsersRound } from 'lucide-react';
import { createJob, fetchRecruiterApplications, fetchRecruiterJobs } from '../services/jobService';
import { GlassCard, GlowButton, MotionPage, NeonBadge, StatCard } from '../components/PremiumUI';

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
    <MotionPage className="mx-auto max-w-7xl px-5 pb-16 pt-8">
      <section className="cinematic-stage mb-6 rounded-[1.5rem] p-6 sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_440px] lg:items-end">
          <div>
            <NeonBadge><Sparkles size={14} /> Recruiter control room</NeonBadge>
            <h1 className="dashboard-title mt-6 max-w-4xl font-black uppercase text-white">Shape roles with sharper signal.</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              Publish clean briefs, watch candidate flow, and keep every open role feeling intentional.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <StatCard label="Active Jobs" value={jobs.length} icon={Briefcase} />
            <StatCard label="Applications" value={applications.length} icon={UsersRound} tone="purple" />
            <StatCard label="Hiring pulse" value="Live" icon={Sparkles} tone="emerald" />
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_430px]">
        <GlassCard className="p-5 sm:p-6" hover={false}>
          <NeonBadge><PenLine size={14} /> Role brief</NeonBadge>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="afai-wordmark text-3xl font-black text-stone-50">Build the opening</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">Write a clean role brief, publish it, and let the workspace keep the candidate flow visible.</p>
            </div>
          </div>
          <form onSubmit={submit} className="mt-6 grid gap-4">
            <input name="title" value={form.title} onChange={update} className="field" placeholder="Job title" required />
            <div className="grid gap-4 md:grid-cols-2">
              <input name="company" value={form.company} onChange={update} className="field" placeholder="Company" required />
              <input name="location" value={form.location} onChange={update} className="field" placeholder="Location" required />
            </div>
            <textarea name="description" value={form.description} onChange={update} className="field min-h-[130px]" placeholder="Job description" required />
            <div className="grid gap-4 md:grid-cols-2">
              <input name="salary" value={form.salary} onChange={update} className="field" placeholder="Salary range" />
              <input name="applyLink" type="url" value={form.applyLink} onChange={update} className="field" placeholder="Apply link" />
            </div>
            <input name="skills" value={form.skills} onChange={update} className="field" placeholder="Skills: React, Node.js, MongoDB" />
            <div className="flex flex-wrap items-center gap-4">
              <select name="type" value={form.type} onChange={update} className="field max-w-[190px]">
                <option value="full-time">Full time</option>
                <option value="part-time">Part time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                <input name="remote" type="checkbox" checked={form.remote} onChange={update} className="h-4 w-4 accent-violet-400" />
                Remote role
              </label>
            </div>
            {error && <p className="rounded-xl border border-rose-300/25 bg-rose-400/10 px-3 py-2 text-sm text-rose-100">{error}</p>}
            <GlowButton className="w-fit"><Send size={17} /> Post job</GlowButton>
          </form>
        </GlassCard>

        <aside className="space-y-5">
          <GlassCard className="p-5" hover={false}>
            <h2 className="afai-wordmark text-xl font-black text-stone-50">Open roles</h2>
            <div className="mt-4 space-y-3">
              {jobs.length === 0 && <p className="text-sm text-slate-400">No jobs posted yet.</p>}
              {jobs.map((job, index) => (
                <div key={job._id} className="luxury-table-row premium-card flex gap-3 p-3">
                  <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.055] text-xs font-black text-slate-400">{index + 1}</span>
                  <div>
                  <p className="font-bold text-stone-50">{job.title}</p>
                  <p className="text-sm text-slate-400">{job.company} - {job.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-5" hover={false}>
            <div className="flex items-center gap-2">
              <UsersRound className="text-violet-700" size={22} />
              <h2 className="afai-wordmark text-xl font-black text-stone-50">Candidate flow</h2>
            </div>
            <div className="mt-4 space-y-3">
              {applications.length === 0 && <p className="text-sm text-slate-400">No candidate applications yet.</p>}
              {applications.map(application => (
                <div key={application._id || `${application.job?._id}-${application.appliedAt}`} className="luxury-table-row premium-card p-3 text-sm">
                  <p className="font-bold text-stone-50">{application.candidate?.name || 'Candidate'}</p>
                  <p className="text-slate-400">{application.job?.title || application.job?.company}</p>
                  <p className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-violet-700">{application.status || 'pending'}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </aside>
      </section>
    </MotionPage>
  );
}
