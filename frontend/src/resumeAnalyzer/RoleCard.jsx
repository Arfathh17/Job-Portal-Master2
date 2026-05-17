import { BookOpenCheck, Briefcase, TrendingUp } from 'lucide-react';
import { GlassCard } from '../components/PremiumUI';

function ProgressBar({ value }) {
  const width = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className="h-2 rounded-full bg-slate-800">
      <div className="h-2 rounded-full bg-gradient-to-r from-sky-100 to-indigo-200 shadow-[0_10px_24px_rgba(125,145,255,0.18)]" style={{ width: `${width}%` }} />
    </div>
  );
}

export default function RoleCard({ recommendation }) {
  return (
    <GlassCard className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.055] text-sky-100">
            <Briefcase size={20} />
          </span>
          <div>
            <h3 className="text-lg font-black text-white">{recommendation.role}</h3>
            <p className="mt-1 text-sm leading-6 text-slate-400">{recommendation.reason}</p>
          </div>
        </div>
        <div className="min-w-[88px] text-right">
          <p className="text-2xl font-black text-white">{recommendation.matchPercentage}%</p>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Match</p>
        </div>
      </div>

      <div className="mt-4">
        <ProgressBar value={recommendation.matchPercentage} />
      </div>

      {recommendation.salaryTrend && (
        <div className="mt-4 flex gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-300">
          <TrendingUp className="mt-0.5 shrink-0 text-sky-100" size={17} />
          <p>{recommendation.salaryTrend}</p>
        </div>
      )}

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-sm font-black text-white">Missing skills</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(recommendation.missingSkills || []).slice(0, 5).map(skill => (
              <span key={skill} className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-bold text-amber-100">
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="flex items-center gap-2 text-sm font-black text-white">
            <BookOpenCheck size={16} className="text-sky-100" />
            Learning roadmap
          </p>
          <ul className="mt-2 space-y-1 text-sm text-slate-400">
            {(recommendation.recommendedLearning || []).slice(0, 4).map(item => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </div>
      </div>
    </GlassCard>
  );
}
