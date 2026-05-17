import { GlassCard } from '../../components/PremiumUI';

const labels = {
  questionCount: 'Questions',
  averageScore: 'Avg score',
  currentDifficulty: 'Difficulty',
  performanceLevel: 'Level',
};

export default function ScoreStrip({ stats }) {
  if (!stats) return null;

  const items = [
    ['questionCount', stats.questionCount || 0],
    ['averageScore', stats.averageScore ? `${stats.averageScore}/100` : 'Pending'],
    ['currentDifficulty', stats.currentDifficulty || 'adaptive'],
    ['performanceLevel', stats.performanceLevel || 'Warming up'],
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-4">
      {items.map(([key, value]) => (
        <GlassCard key={key} className="p-3">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{labels[key]}</p>
          <p className="mt-1 text-sm font-black text-white">{value}</p>
        </GlassCard>
      ))}
    </div>
  );
}
