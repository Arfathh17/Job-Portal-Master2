import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BadgeCheck, Eye, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../context/AuthContext';
import { GlassCard, GlowButton, MotionPage, NeonBadge } from '../components/PremiumUI';

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
    <MotionPage className="grid min-h-screen place-items-center px-5 py-8">
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <GlassCard className="mx-auto w-full max-w-md p-6 sm:p-8" hover={false}>
          <NeonBadge><BadgeCheck size={14} /> Start premium access</NeonBadge>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-white">Create your account</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">Choose the workflow that matches your side of the hiring platform.</p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-300">Name</span>
              <div className="relative">
                <UserRound className="absolute left-3 top-3.5 text-sky-100/70" size={18} />
                <input name="name" value={form.name} onChange={update} className="field pl-10" required />
              </div>
            </label>
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
                <input name="password" type={showPassword ? 'text' : 'password'} minLength={6} value={form.password} onChange={update} className="field px-10" required />
                <button type="button" onClick={() => setShowPassword(prev => !prev)} className="absolute right-3 top-3.5 text-slate-400 transition hover:text-white" aria-label="Toggle password visibility">
                  <Eye size={18} />
                </button>
              </div>
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-300">Account type</span>
              <select name="role" value={form.role} onChange={update} className="field">
                <option value="candidate">Candidate</option>
                <option value="recruiter">Recruiter</option>
              </select>
            </label>
            {error && <p className="rounded-xl border border-rose-300/25 bg-rose-400/10 px-3 py-2 text-sm text-rose-100">{error}</p>}
            <GlowButton disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Creating account...' : 'Register'}
            </GlowButton>
          </form>
          <p className="mt-5 text-center text-sm text-slate-400">
            Already registered? <Link className="font-bold text-sky-100 hover:text-white" to="/login">Login</Link>
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

        <section className="hidden min-h-[640px] rounded-3xl border border-white/10 bg-slate-950/55 p-8 shadow-2xl backdrop-blur-2xl lg:block">
          <NeonBadge>Designed for real workflows</NeonBadge>
          <h2 className="mt-8 text-6xl font-black leading-[0.95] tracking-tight">
            Build your <span className="neon-text">career command center.</span>
          </h2>
          <div className="product-sculpture mt-8">
            <div className="sculpture-pane p-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Role fit</p>
              <div className="mt-4 h-2 w-4/5 rounded-full bg-white/18" />
              <div className="mt-3 h-2 w-1/2 rounded-full bg-white/10" />
            </div>
            <div className="sculpture-pane p-4">
              <p className="text-sm font-bold text-stone-100">Recruiter workspace</p>
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
          <div className="mt-6 grid gap-4">
            {['Candidate dashboard', 'Recruiter workspace', 'Resume analyzer', 'AFAI interview simulator'].map((item, index) => (
              <div key={item} className="premium-card flex items-center justify-between p-4">
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
