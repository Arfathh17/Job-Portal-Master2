import { GlassCard } from '../../components/PremiumUI';

const labels = {
  questionCount: 'Questions',
  averageScore: 'Avg Score',
  currentDifficulty: 'Difficulty',
  performanceLevel: 'Level',
};

export default function ScoreStrip({ stats }) {
  if (!stats) return null;

  const items = [
    ['questionCount', stats.questionCount || 0],
    ['averageScore', stats.averageScore ? `${stats.averageScore}/100` : 'Pending'],
    ['currentDifficulty', stats.currentDifficulty || 'Adaptive'],
    ['performanceLevel', stats.performanceLevel || 'Warming Up'],
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
      {items.map(([key, value]) => (
        <GlassCard key={key} className="min-w-0 p-2 sm:p-3" hover={false}>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{labels[key]}</p>
          <p className="mt-1 text-xs sm:text-sm font-black text-white break-words">{value}</p>
        </GlassCard>
      ))}
    </div>
  );
}
