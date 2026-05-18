import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Cpu, MessagesSquare, Play, SlidersHorizontal } from 'lucide-react';
import { sendAFAIMessage, startAFAISession } from '../afaiApi';
import { GlassCard, GlowButton, MotionPage, NeonBadge } from '../../components/PremiumUI';

const roles = [
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'MERN Stack Developer',
  'AI/ML Engineer',
  'Data Analyst',
  'System Design',
  'HR Interview',
];

const interviewTypes = [
  { label: 'Technical', value: 'technical' },
  { label: 'HR', value: 'hr' },
  { label: 'Behavioral', value: 'behavioral' },
  { label: 'Coding', value: 'coding' },
  { label: 'System Design', value: 'system-design' },
  { label: 'AI/ML', value: 'ai-ml' },
  { label: 'FAANG', value: 'faang' },
];

const difficulties = ['beginner', 'intermediate', 'advanced', 'expert'];

export default function AFAISetup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    role: 'Full Stack Developer',
    experience: 'Fresher / Junior',
    technologies: 'React, Node.js, MongoDB, Express, JWT',
    interviewType: 'technical',
    difficulty: 'intermediate',
    company: 'generic',
  });
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState('');

  const updateForm = event => {
    setForm(prev => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const startInterview = async event => {
    event.preventDefault();
    setError('');
    setIsStarting(true);

    try {
      const payload = {
        ...form,
        technologies: form.technologies.split(',').map(item => item.trim()).filter(Boolean),
      };
      const session = await startAFAISession(payload);

      if (!session?.sessionId) {
        throw new Error('AFAI session was not created by the backend.');
      }

      const firstTurn = await sendAFAIMessage({
        ...payload,
        sessionId: session.sessionId,
        message: 'Start the interview.',
      });

      if (!firstTurn?.reply) {
        throw new Error('AFAI did not return the first interview question.');
      }

      const interviewState = {
        setup: payload,
        sessionId: session.sessionId,
        messages: [{ role: 'assistant', content: firstTurn.reply, feedback: firstTurn.evaluation }],
        stats: firstTurn.stats,
      };

      sessionStorage.setItem('afaiInterview', JSON.stringify(interviewState));
      navigate('/afai/interview', { state: interviewState });
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Unable to start AFAI. Check backend connection.');
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <MotionPage className="pb-16">
      <section className="mx-auto max-w-7xl px-5 pt-8">
        <GlassCard className="cinematic-stage flex min-h-[360px] flex-col justify-between gap-8 p-6 md:flex-row md:items-end md:justify-between md:p-8" hover={false}>
          <div>
            <NeonBadge>AI Job Portal</NeonBadge>
            <h1 className="dashboard-title mt-6 max-w-5xl font-black uppercase text-white">AFAI intelligent interview simulator</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">Set the role, difficulty, and technology depth. AFAI will shape a focused live interview around your answers.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.055] px-4 py-2 text-sm font-semibold text-slate-300">
            <MessagesSquare size={18} />
            Adaptive one-question flow
          </div>
        </GlassCard>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-6 lg:grid-cols-[1.15fr_0.85fr]">
        <GlassCard hover={false}>
        <form onSubmit={startInterview} className="p-5">
          <div className="mb-5 flex items-center gap-3">
            <SlidersHorizontal className="text-violet-700" size={22} />
            <div>
              <h2 className="text-xl font-black text-white">Interview setup</h2>
              <p className="text-sm text-slate-400">AFAI uses this context to choose role-based questions and follow-ups.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-300">Target role</span>
              <select name="role" value={form.role} onChange={updateForm} className="field">
                {roles.map(role => <option key={role}>{role}</option>)}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-300">Experience level</span>
              <input name="experience" value={form.experience} onChange={updateForm} className="field" />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-semibold text-slate-300">Technologies known</span>
              <input name="technologies" value={form.technologies} onChange={updateForm} className="field" />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-300">Interview type</span>
              <select name="interviewType" value={form.interviewType} onChange={updateForm} className="field">
                {interviewTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-300">Difficulty</span>
              <select name="difficulty" value={form.difficulty} onChange={updateForm} className="field">
                {difficulties.map(level => <option key={level} value={level}>{level}</option>)}
              </select>
            </label>
          </div>

          {error && <p className="mt-4 rounded-xl border border-rose-300/25 bg-rose-400/10 px-3 py-2 text-sm text-rose-100">{error}</p>}

          <GlowButton disabled={isStarting} className="mt-6">
            <Play size={18} />
            {isStarting ? 'Starting AFAI...' : 'Start interview'}
          </GlowButton>
        </form>
        </GlassCard>

        <aside className="grid gap-4">
          <GlassCard className="p-5">
            <div className="flex items-center gap-3">
              <Briefcase className="text-violet-700" size={22} />
              <h2 className="text-lg font-black text-white">Interview behavior</h2>
            </div>
            <ul className="mt-4 space-y-3 text-sm text-slate-400">
              <li>AFAI analyzes answer depth, clarity, confidence, and production readiness.</li>
              <li>Strong answers trigger harder follow-ups and architecture scenarios.</li>
              <li>Weak or vague answers trigger clarification and simpler probing.</li>
            </ul>
          </GlassCard>

          <GlassCard className="p-5">
            <div className="flex items-center gap-3">
              <Cpu className="text-violet-700" size={22} />
              <h2 className="text-lg font-black text-white">Technology depth</h2>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {['React hooks', 'Node event loop', 'JWT auth', 'MongoDB indexes', 'scaling', 'debugging'].map(item => (
                <span key={item} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-sm font-semibold text-slate-200">{item}</span>
              ))}
            </div>
          </GlassCard>
        </aside>
      </section>
    </MotionPage>
  );
}
