import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BadgeCheck, Eye, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../context/AuthContext';
import { GlassCard, GlowButton, MaskedHeadline, MotionPage, NeonBadge } from '../components/PremiumUI';

export default function Register() {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'candidate' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const update = event => setForm(prev => ({ ...prev, [event.target.name]: event.target.value }));

  const submit = async event => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const user = await register(form);
      navigate(user.role === 'recruiter' ? '/recruiter/dashboard' : '/candidate/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitGoogle = async () => {
    setError('');
    setIsSubmitting(true);

    try {
      const user = await loginWithGoogle(form.role);
      navigate(user.role === 'recruiter' ? '/recruiter/dashboard' : '/candidate/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Google sign-in failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MotionPage className="grid min-h-screen place-items-center overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid w-full min-w-0 max-w-7xl gap-5 overflow-hidden lg:grid-cols-[minmax(320px,470px)_minmax(0,1.24fr)]">
        <GlassCard className="mx-auto flex w-full max-w-md flex-col justify-center overflow-hidden p-5 sm:p-8 lg:max-w-none" hover={false}>
          <NeonBadge><BadgeCheck size={14} /> Start premium access</NeonBadge>
          <h1 className="afai-wordmark mt-5 overflow-hidden break-words text-3xl font-black leading-tight text-white sm:text-4xl sm:leading-none">Claim your workflow.</h1>
          <p className="mt-4 text-sm leading-6 text-slate-400">Choose the workspace that matches your side of the platform.</p>

          <form onSubmit={submit} className="mt-7 w-full min-w-0 space-y-4 overflow-hidden">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-300">Name</span>
              <div className="relative w-full min-w-0 overflow-hidden">
                <UserRound className="absolute left-3 top-3.5 text-violet-500/80" size={18} />
                <input name="name" value={form.name} onChange={update} className="field box-border w-full pl-10" required />
              </div>
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-300">Email</span>
              <div className="relative w-full min-w-0 overflow-hidden">
                <Mail className="absolute left-3 top-3.5 text-violet-500/80" size={18} />
                <input name="email" type="email" value={form.email} onChange={update} className="field box-border w-full pl-10" required />
              </div>
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-300">Password</span>
              <div className="relative w-full min-w-0 overflow-hidden">
                <LockKeyhole className="absolute left-3 top-3.5 text-violet-500/80" size={18} />
                <input name="password" type={showPassword ? 'text' : 'password'} minLength={6} value={form.password} onChange={update} className="field box-border w-full px-10" required />
                <button type="button" onClick={() => setShowPassword(prev => !prev)} className="absolute right-3 top-3.5 text-slate-400 transition hover:text-white" aria-label="Toggle password visibility">
                  <Eye size={18} />
                </button>
              </div>
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-300">Account type</span>
              <select name="role" value={form.role} onChange={update} className="field box-border w-full">
                <option value="candidate">Candidate</option>
                <option value="recruiter">Recruiter</option>
              </select>
            </label>
            {error && <p className="rounded-xl border border-rose-300/25 bg-rose-400/10 px-3 py-2 text-sm text-rose-100 break-words">{error}</p>}
            <GlowButton disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Creating account...' : 'Register'}
            </GlowButton>
          </form>
          <p className="mt-5 text-center text-sm text-slate-400">
            Already registered? <Link className="font-bold text-violet-700 hover:text-violet-950 break-words" to="/login">Login</Link>
          </p>

          <div className="mt-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-white/10" />
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">or</span>
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <button
            type="button"
            onClick={submitGoogle}
            disabled={isSubmitting}
            className="mt-4 inline-flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.055] px-5 py-3 text-sm font-bold text-stone-100 transition hover:border-white/20 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FcGoogle size={20} />
            Continue with Google
          </button>
        </GlassCard>

        <section className="cinematic-stage image-reveal hidden max-w-full flex-col justify-between rounded-[2rem] p-7 lg:flex xl:p-10">
          <div className="relative z-10">
          <NeonBadge>Designed for real workflows</NeonBadge>
          <h2 className="hero-type mt-10 max-w-5xl overflow-hidden break-words text-3xl font-black uppercase leading-tight text-white sm:text-4xl md:text-6xl lg:text-7xl lg:leading-none">
            <MaskedHeadline>Career command center</MaskedHeadline>
          </h2>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">
            One premium operating layer for candidate preparation, recruiter briefs, and AI-guided interview readiness.
          </p>
          </div>
          <div className="product-sculpture relative z-10 mt-10" data-parallax="10">
            <div className="sculpture-pane p-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Role fit</p>
              <div className="mt-4 h-2 w-4/5 rounded-full bg-white/[0.18]" />
              <div className="mt-3 h-2 w-1/2 rounded-full bg-white/10" />
            </div>
            <div className="sculpture-pane p-4">
            <p className="text-sm font-bold text-stone-100">Recruiter Workspace</p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <span className="h-10 rounded-xl bg-white/[0.07]" />
                <span className="h-10 rounded-xl bg-white/[0.11]" />
                <span className="h-10 rounded-xl bg-white/[0.05]" />
              </div>
            </div>
            <div className="sculpture-pane p-4">
              <p className="text-xs font-bold text-slate-300">Interview loop active</p>
            </div>
          </div>
          <div className="relative z-10 mt-8 grid gap-4 sm:grid-cols-2">
            {['Candidate Dashboard', 'Recruiter Workspace', 'ResumeIQ', 'AFAI Interview Simulator'].map((item, index) => (
              <div key={item} className="luxury-table-row premium-card flex items-center justify-between p-4">
                <span className="font-semibold">{item}</span>
                <span className="text-sm font-black text-slate-400">0{index + 1}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </MotionPage>
  );
}
