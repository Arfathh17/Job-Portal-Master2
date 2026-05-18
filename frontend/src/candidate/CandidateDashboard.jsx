import { Link } from 'react-router-dom';
import { Bot, Briefcase, FileText, ListChecks, MoveUpRight, Sparkles, TrendingUp, Zap } from 'lucide-react';
import { GlassCard, GlowButton, MotionPage, NeonBadge, StatCard } from '../components/PremiumUI';
import { useAuth } from '../context/AuthContext';

const actions = [
  { title: 'Browse roles', description: 'Find openings and send applications from your candidate profile.', href: '/jobs', icon: Briefcase, label: 'Search' },
  { title: 'Practice with AFAI', description: 'Run a focused mock interview that adapts to your answer quality.', href: '/afai', icon: Bot, label: 'Interview' },
  { title: 'Analyze resume', description: 'Check ATS gaps, strengths, and role fit before applying.', href: '/resume-analyzer', icon: FileText, label: 'Review' },
  { title: 'Track applications', description: 'Return to your job pipeline and keep momentum visible.', href: '/jobs', icon: ListChecks, label: 'Pipeline' },
];

const timeline = ['Tune resume keywords', 'Apply to focused roles', 'Practice one AFAI round'];

export default function CandidateDashboard() {
  const { user } = useAuth();
  const featured = actions[1];
  const FeaturedIcon = featured.icon;

  return (
    <MotionPage className="mx-auto max-w-7xl px-5 pb-16 pt-8">
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_360px]">
        <GlassCard className="cinematic-stage min-h-[500px] p-6 sm:p-8" hover={false}>
          <NeonBadge><Sparkles size={14} /> Candidate workspace</NeonBadge>
          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_285px] lg:items-end">
            <div>
              <h1 className="dashboard-title max-w-4xl font-black uppercase text-white">
                Welcome back, <span className="lavender-text">{user?.name}</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                Choose better roles, sharpen your resume signal, and rehearse before the real conversation.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <GlowButton as={Link} to="/jobs">Find a role</GlowButton>
                <Link to="/resume-analyzer" className="magnetic-btn inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.045] px-5 py-3 text-sm font-bold text-stone-100 transition hover:border-white/20 hover:bg-white/[0.075]">
                  Improve resume <MoveUpRight size={17} />
                </Link>
              </div>
            </div>

            <Link to={featured.href} className="group block">
              <div className="premium-card image-reveal relative overflow-hidden p-5">
                <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-violet-200/40 blur-2xl transition group-hover:scale-125" />
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 text-violet-700">
                  <FeaturedIcon size={23} />
                </span>
                <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-slate-500">Next best move</p>
                <h2 className="mt-2 text-2xl font-black text-stone-50">{featured.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">{featured.description}</p>
              </div>
            </Link>
          </div>
        </GlassCard>

        <div className="grid gap-4">
          <StatCard label="Profile signal" value="Ready" icon={Zap} />
          <StatCard label="Preparation mode" value="Focused" icon={TrendingUp} tone="purple" />
          <GlassCard className="p-5">
            <p className="text-sm font-black text-stone-50">Today's rhythm</p>
            <div className="mt-4 space-y-4">
              {timeline.map((item, index) => (
                <div key={item} className="flex gap-3">
                  <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.055] text-[11px] font-black text-slate-300">{index + 1}</span>
                  <p className="text-sm leading-6 text-slate-400">{item}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </section>

      <section data-reveal="section" className="mt-6 overflow-hidden rounded-[1.25rem] border border-white/10 bg-white/[0.035] py-4">
        <div className="kinetic-marquee gap-3">
          {[...actions, ...actions].map((action, index) => (
            <span key={`${action.title}-${index}`} className="mx-2 rounded-full border border-white/10 px-5 py-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
              {action.title}
            </span>
          ))}
        </div>
      </section>

      <section data-reveal="section" className="mt-6 grid gap-4 lg:grid-cols-3">
        {actions.filter(action => action.title !== featured.title).map(action => {
          const Icon = action.icon;
          return (
            <Link key={action.title} to={action.href} className="group">
              <GlassCard className="h-full p-5">
                <div className="flex items-center justify-between gap-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-200/60 bg-white/80 text-violet-700">
                    <Icon size={22} />
                  </span>
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{action.label}</span>
                </div>
                <h2 className="mt-5 text-xl font-black text-stone-50">{action.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">{action.description}</p>
              </GlassCard>
            </Link>
          );
        })}
      </section>
    </MotionPage>
  );
}
