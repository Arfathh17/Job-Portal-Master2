import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, Briefcase, Building2, ExternalLink, FileText, ListChecks, MapPin, MoveUpRight, Sparkles, Target, TrendingUp, Zap } from 'lucide-react';
import { GlassCard, GlowButton, MotionPage, NeonBadge, StatCard } from '../components/PremiumUI';
import { useAuth } from '../context/AuthContext';
import { fetchResumeHistory } from '../services/resumeService';

const actions = [
  { title: 'Browse Roles', description: 'Find openings and send applications from your candidate profile.', href: '/jobs', icon: Briefcase, label: 'Search' },
  { title: 'Practice with AFAI', description: 'Run a focused mock interview that adapts to your answer quality.', href: '/afai', icon: Bot, label: 'Interview' },
  { title: 'ResumeIQ', description: 'Check ATS gaps, strengths, and role fit before applying.', href: '/resume-analyzer', icon: FileText, label: 'Review' },
  { title: 'Track Applications', description: 'Return to your job pipeline and keep momentum visible.', href: '/jobs', icon: ListChecks, label: 'Pipeline' },
];

const timeline = ['Tune Resume Keywords', 'Apply To Focused Roles', 'Practice One AFAI Round'];

function compactDescription(description = '') {
  const text = String(description || '').replace(/\s+/g, ' ').trim();
  return text.length > 150 ? `${text.slice(0, 150)}...` : text;
}

export default function CandidateDashboard() {
  const { user } = useAuth();
  const [resumeHistory, setResumeHistory] = useState([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(true);
  const featured = actions[1];
  const FeaturedIcon = featured.icon;
  const recommendations = useMemo(
    () => resumeHistory[0]?.analysis?.jobRecommendations || [],
    [resumeHistory],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadRecommendations() {
      setIsLoadingRecommendations(true);
      try {
        const history = await fetchResumeHistory();
        if (isMounted) setResumeHistory(Array.isArray(history) ? history : []);
      } catch {
        if (isMounted) setResumeHistory([]);
      } finally {
        if (isMounted) setIsLoadingRecommendations(false);
      }
    }

    loadRecommendations();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <MotionPage className="mx-auto w-full max-w-7xl overflow-hidden px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <section className="grid min-w-0 gap-5 overflow-hidden lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,360px)]">
        <GlassCard className="cinematic-stage min-h-auto overflow-hidden p-5 sm:p-8" hover={false}>
          <NeonBadge><Sparkles size={14} /> Candidate Workspace</NeonBadge>
          <div className="mt-10 grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_285px] lg:items-end">
            <div className="min-w-0">
              <h1 className="dashboard-title max-w-4xl overflow-hidden break-words text-3xl font-black uppercase leading-tight text-white sm:text-4xl md:text-6xl lg:text-7xl lg:leading-none">
                Welcome back, <span className="lavender-text break-words">{user?.name}</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base sm:text-lg leading-7 sm:leading-8 text-slate-300">
                Choose better roles, sharpen your resume signal, and rehearse before the real conversation.
              </p>
              <div className="mt-7 flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap">
                <GlowButton as={Link} to="/jobs" className="w-full sm:w-auto">Find A Role</GlowButton>
                <Link to="/resume-analyzer" className="magnetic-btn inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.045] px-5 py-3 text-sm font-bold text-stone-100 transition hover:border-white/20 hover:bg-white/[0.075] sm:w-auto">
                  Open ResumeIQ <MoveUpRight size={17} />
                </Link>
              </div>
            </div>

            <Link to={featured.href} className="group block">
              <div className="premium-card image-reveal relative overflow-hidden p-5">
                <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-violet-200/40 blur-2xl transition group-hover:scale-125" />
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 text-violet-700">
                  <FeaturedIcon size={23} />
                </span>
                <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-slate-500">Next Best Move</p>
                <h2 className="mt-2 text-xl sm:text-2xl font-black text-stone-50 break-words">{featured.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">{featured.description}</p>
              </div>
            </Link>
          </div>
        </GlassCard>

        <div className="grid min-w-0 gap-4 overflow-hidden">
          <StatCard label="Profile Signal" value="Ready" icon={Zap} />
          <StatCard label="Preparation Mode" value="Focused" icon={TrendingUp} tone="purple" />
          <GlassCard className="p-5">
            <p className="text-sm font-black text-stone-50">Today's Rhythm</p>
            <div className="mt-4 space-y-4">
              {timeline.map((item, index) => (
                <div key={item} className="flex gap-3">
                  <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.055] text-[11px] font-black text-slate-300">{index + 1}</span>
                  <p className="text-sm leading-6 text-slate-400 break-words">{item}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </section>

      <section data-reveal="section" className="mt-6 max-w-full overflow-hidden rounded-[1.25rem] border border-white/10 bg-white/[0.035] py-4">
        <div className="kinetic-marquee gap-3">
          {[...actions, ...actions].map((action, index) => (
            <span key={`${action.title}-${index}`} className="mx-2 rounded-full border border-white/10 px-5 py-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400 whitespace-nowrap">
              {action.title}
            </span>
          ))}
        </div>
      </section>

      <section data-reveal="section" className="mt-6">
        <GlassCard className="overflow-hidden p-5 sm:p-6" hover={false}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <NeonBadge><Target size={14} /> Recommended For You</NeonBadge>
              <h2 className="afai-wordmark mt-3 text-2xl sm:text-3xl font-black text-white break-words">AI Job Recommendations</h2>
            </div>
            <Link to="/resume-analyzer" className="magnetic-btn inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-2.5 text-sm font-bold text-stone-100 transition hover:border-white/20 hover:bg-white/[0.075] sm:w-auto">
              Update ResumeIQ <MoveUpRight size={17} />
            </Link>
          </div>

          {isLoadingRecommendations && (
            <div className="mt-5 grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-5">
              {[0, 1, 2, 3, 4].map(item => (
                <div key={item} className="min-h-[210px] animate-pulse rounded-xl border border-white/10 bg-white/[0.045]" />
              ))}
            </div>
          )}

          {!isLoadingRecommendations && recommendations.length === 0 && (
            <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-5">
              <p className="text-sm font-bold text-stone-100">Upload your resume to unlock Gemini-powered job matches.</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">Your top 5 matches will appear here with a match percentage after analysis.</p>
            </div>
          )}

          {!isLoadingRecommendations && recommendations.length > 0 && (
            <div className="mt-5 grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-5">
              {recommendations.slice(0, 5).map(job => (
                <article key={`${job.id}-${job.title}`} className="min-w-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.045] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <span className="rounded-full border border-emerald-200/30 bg-emerald-300/10 px-3 py-1 text-xs font-black text-emerald-100">
                      {job.matchPercentage}% Match
                    </span>
                    {job.applyLink && (
                      <a href={job.applyLink} target="_blank" rel="noreferrer" className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-slate-200 transition hover:bg-white/[0.1]" aria-label={`Open ${job.title}`}>
                        <ExternalLink size={15} />
                      </a>
                    )}
                  </div>
                  <h3 className="mt-4 text-base font-black text-white break-words">{job.title}</h3>
                  <div className="mt-3 space-y-2 text-xs text-slate-300">
                    <p className="flex items-center gap-2 break-words"><Building2 size={14} className="shrink-0 text-violet-300" />{job.company}</p>
                    <p className="flex items-center gap-2 break-words"><MapPin size={14} className="shrink-0 text-violet-300" />{job.location}</p>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-slate-400 break-words">{compactDescription(job.description)}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(job.matchedSkills || []).slice(0, 3).map(skill => (
                      <span key={skill} className="rounded-full border border-white/10 px-2 py-1 text-[11px] font-bold text-slate-300">{skill}</span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </GlassCard>
      </section>

      <section data-reveal="section" className="mt-6 grid min-w-0 gap-4 overflow-hidden md:grid-cols-2 lg:grid-cols-3">
        {actions.filter(action => action.title !== featured.title).map(action => {
          const Icon = action.icon;
          return (
            <Link key={action.title} to={action.href} className="group">
              <GlassCard className="h-full overflow-hidden p-5">
                <div className="flex items-center justify-between gap-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-200/60 bg-white/80 text-violet-700">
                    <Icon size={22} />
                  </span>
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{action.label}</span>
                </div>
                <h2 className="mt-5 text-lg sm:text-xl font-black text-stone-50 break-words">{action.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">{action.description}</p>
              </GlassCard>
            </Link>
          );
        })}
      </section>
    </MotionPage>
  );
}
