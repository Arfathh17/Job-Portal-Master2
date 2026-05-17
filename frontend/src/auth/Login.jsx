import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, LockKeyhole, Mail, Rocket, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../context/AuthContext';
import { GlassCard, GlowButton, MotionPage, NeonBadge } from '../components/PremiumUI';

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
    <MotionPage className="grid min-h-screen place-items-center px-5 py-8">
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden min-h-[640px] flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-slate-950/55 p-8 shadow-2xl backdrop-blur-2xl lg:flex">
          <div>
            <NeonBadge><Sparkles size={14} /> Hiring workspace</NeonBadge>
            <h1 className="mt-8 max-w-xl text-6xl font-black leading-[0.95] tracking-tight">
              Make hiring feel <span className="neon-text">clear, calm, and human.</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-400">
              A focused place for candidates, recruiters, resume intelligence, and AFAI interviews to feel connected.
            </p>
          </div>
          <div>
            <div className="product-sculpture">
              <div className="sculpture-pane p-4">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Candidate signal</p>
                <div className="mt-4 h-2 w-3/4 rounded-full bg-white/18" />
                <div className="mt-3 h-2 w-1/2 rounded-full bg-white/10" />
              </div>
              <div className="sculpture-pane p-4">
                <p className="text-sm font-bold text-stone-100">AFAI is listening</p>
                <div className="mt-4 flex h-10 items-end gap-1.5">
                  {Array.from({ length: 9 }).map((_, index) => <span key={index} className="w-1.5 rounded-full bg-sky-100/60" style={{ height: `${12 + (index % 4) * 7}px` }} />)}
                </div>
              </div>
              <div className="sculpture-pane p-4">
                <p className="text-xs font-bold text-slate-300">Resume score ready</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3">
            {['Resume intelligence', 'Adaptive interviews', 'Application tracking'].map((item, index) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="premium-card flex items-center justify-between p-4"
              >
                <span className="font-semibold text-white">{item}</span>
                <span className="h-2 w-24 rounded-full bg-gradient-to-r from-sky-100 to-indigo-200 shadow-[0_12px_28px_rgba(125,145,255,0.16)]" />
              </motion.div>
            ))}
            </div>
          </div>
        </section>

        <GlassCard className="mx-auto w-full max-w-md p-6 sm:p-8" hover={false}>
          <div className="mb-7">
            <NeonBadge><Rocket size={14} /> Welcome back</NeonBadge>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-white">Login to your portal</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">Continue your hiring pipeline, candidate journey, or AFAI session.</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-300">Email</span>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-sky-100/70" size={18} />
                <input name="email" type="email" value={form.email} onChange={update} className="field pl-10" required />
              </div>
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-300">Password</span>
              <div className="relative">
                <LockKeyhole className="absolute left-3 top-3.5 text-sky-100/70" size={18} />
                <input name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={update} className="field px-10" required />
                <button type="button" onClick={() => setShowPassword(prev => !prev)} className="absolute right-3 top-3.5 text-slate-400 transition hover:text-white" aria-label="Toggle password visibility">
                  <Eye size={18} />
                </button>
              </div>
            </label>
            {error && <p className="rounded-xl border border-rose-300/25 bg-rose-400/10 px-3 py-2 text-sm text-rose-100">{error}</p>}
            <GlowButton disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Authenticating...' : 'Login'}
            </GlowButton>
          </form>

          <p className="mt-5 text-center text-sm text-slate-400">
            New here? <Link className="font-bold text-sky-100 hover:text-white" to="/register">Create account</Link>
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
