import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, LockKeyhole, Mail, Rocket, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../context/AuthContext';
import { GlassCard, GlowButton, MaskedHeadline, MotionPage, NeonBadge } from '../components/PremiumUI';

export default function Login() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const update = event => setForm(prev => ({ ...prev, [event.target.name]: event.target.value }));

  const submit = async event => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const user = await login(form);
      const from = location.state?.from?.pathname;
      navigate(from || (user.role === 'recruiter' ? '/recruiter/dashboard' : '/candidate/dashboard'), { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitGoogle = async () => {
    setError('');
    setIsSubmitting(true);

    try {
      const user = await loginWithGoogle('candidate');
      const from = location.state?.from?.pathname;
      navigate(from || (user.role === 'recruiter' ? '/recruiter/dashboard' : '/candidate/dashboard'), { replace: true });
    } catch (err) {
      setError(err.message || 'Google sign-in failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MotionPage className="grid min-h-screen place-items-center px-4 py-6 sm:px-6 md:px-10">
      <div className="grid w-full max-w-7xl gap-5 lg:grid-cols-[minmax(0,1.24fr)_minmax(360px,470px)]">
        <section className="cinematic-stage image-reveal hidden min-h-[720px] max-w-full flex-col justify-between rounded-[2rem] p-7 lg:flex xl:p-10">
          <div className="relative z-10">
            <NeonBadge><Sparkles size={14} /> AFAI talent intelligence</NeonBadge>
            <h1 className="hero-type mt-10 max-w-5xl overflow-hidden break-words text-3xl font-black uppercase leading-tight text-white sm:text-4xl md:text-6xl lg:text-7xl lg:leading-none">
              <MaskedHeadline>Future ready hiring</MaskedHeadline>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">
              A cinematic workspace for sharper resumes, adaptive interviews, high-signal jobs, and recruiter workflows that feel intentional.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {['Resume signal', 'Adaptive AFAI', 'Recruiter flow'].map(item => (
                <span key={item} className="brand-chip rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-200">{item}</span>
              ))}
            </div>
          </div>

          <div className="relative z-10 grid gap-5 xl:grid-cols-[0.9fr_1.1fr] xl:items-end">
            <div className="product-sculpture" data-parallax="8">
              <div className="sculpture-pane p-4">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Candidate signal</p>
                <div className="mt-4 h-2 w-3/4 rounded-full bg-white/[0.18]" />
                <div className="mt-3 h-2 w-1/2 rounded-full bg-white/10" />
              </div>
              <div className="sculpture-pane p-4">
                <p className="text-sm font-bold text-stone-100">AFAI is listening</p>
                <div className="mt-4 flex h-10 items-end gap-1.5">
                  {Array.from({ length: 9 }).map((_, index) => <span key={index} className="w-1.5 rounded-full bg-violet-300/70" style={{ height: `${12 + (index % 4) * 7}px` }} />)}
                </div>
              </div>
              <div className="sculpture-pane p-4">
                <p className="text-xs font-bold text-slate-300">Resume score ready</p>
              </div>
            </div>
            <div className="grid gap-3">
            {['Resume Intelligence', 'Adaptive Interviews', 'Application Tracking'].map((item, index) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="luxury-table-row premium-card flex items-center justify-between p-4"
              >
                <span className="font-semibold text-white">{item}</span>
                <span className="h-2 w-24 rounded-full bg-gradient-to-r from-violet-200 via-fuchsia-100 to-slate-200 shadow-[0_12px_28px_rgba(109,40,217,0.12)]" />
              </motion.div>
            ))}
            </div>
          </div>
        </section>

        <GlassCard className="mx-auto flex w-full max-w-md max-w-full flex-col justify-center p-6 sm:p-8 lg:max-w-none" hover={false}>
          <div className="mb-7">
            <NeonBadge><Rocket size={14} /> Welcome back</NeonBadge>
            <h2 className="afai-wordmark mt-5 overflow-hidden break-words text-3xl font-black leading-tight text-white sm:text-4xl sm:leading-none">Enter the talent atelier.</h2>
            <p className="mt-4 text-sm leading-6 text-slate-400">Continue your hiring pipeline, candidate journey, or AFAI interview session.</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-300">Email</span>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-violet-500/80" size={18} />
                <input name="email" type="email" value={form.email} onChange={update} className="field pl-10" required />
              </div>
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-300">Password</span>
              <div className="relative">
                <LockKeyhole className="absolute left-3 top-3.5 text-violet-500/80" size={18} />
                <input name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={update} className="field px-10" required />
                <button type="button" onClick={() => setShowPassword(prev => !prev)} className="absolute right-3 top-3.5 text-slate-400 transition hover:text-white" aria-label="Toggle password visibility">
                  <Eye size={18} />
                </button>
              </div>
            </label>
            {error && <p className="rounded-xl border border-rose-300/25 bg-rose-400/10 px-3 py-2 text-sm text-rose-100 break-words">{error}</p>}
            <GlowButton disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Authenticating...' : 'Login'}
            </GlowButton>
          </form>

          <p className="mt-5 text-center text-sm text-slate-400">
            New here? <Link className="font-bold text-violet-700 hover:text-violet-950 break-words" to="/register">Create account</Link>
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
      </div>
    </MotionPage>
  );
}
