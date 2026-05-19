import { BookOpenCheck, Briefcase, TrendingUp } from 'lucide-react';
import { GlassCard } from '../components/PremiumUI';

function ProgressBar({ value }) {
  const width = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className="h-2 rounded-full bg-slate-800">
      <div className="h-2 rounded-full bg-gradient-to-r from-violet-300 to-fuchsia-200 shadow-[0_10px_24px_rgba(109,40,217,0.12)]" style={{ width: `${width}%` }} />
    </div>
  );
}

export default function RoleCard({ recommendation }) {
  return (
    <GlassCard className="luxury-table-row p-4" hover={false}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80 text-violet-700">
            <Briefcase size={20} />
          </span>
          <div className="min-w-0">
            <h3 className="afai-wordmark text-lg sm:text-xl font-black text-white break-words">{recommendation.role}</h3>
            <p className="mt-1 text-xs sm:text-sm leading-6 text-slate-400 break-words">{recommendation.reason}</p>
          </div>
        </div>
        <div className="w-full shrink-0 text-left sm:w-auto sm:min-w-[88px] sm:text-right">
          <p className="text-xl sm:text-2xl font-black text-white">{recommendation.matchPercentage}%</p>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Match</p>
        </div>
      </div>

      <div className="mt-4">
        <ProgressBar value={recommendation.matchPercentage} />
      </div>

      {recommendation.salaryTrend && (
        <div className="mt-4 flex gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs sm:text-sm text-slate-300 break-words">
          <TrendingUp className="mt-0.5 shrink-0 text-violet-700" size={17} />
          <p>{recommendation.salaryTrend}</p>
        </div>
      )}

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-xs sm:text-sm font-black text-white">Missing skills</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(recommendation.missingSkills || []).slice(0, 5).map(skill => (
              <span key={skill} className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-bold text-amber-100">
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="flex items-center gap-2 text-xs sm:text-sm font-black text-white">
            <BookOpenCheck size={16} className="text-violet-700 flex-shrink-0" />
            <span className="break-words">Learning roadmap</span>
          </p>
          <ul className="mt-2 space-y-1 text-xs sm:text-sm text-slate-400">
            {(recommendation.recommendedLearning || []).slice(0, 4).map(item => (
              <li key={item} className="break-words">- {item}</li>
            ))}
          </ul>
        </div>
      </div>
    </GlassCard>
  );
}
