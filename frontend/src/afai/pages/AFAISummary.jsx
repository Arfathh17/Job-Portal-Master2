import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, BadgeCheck, BookOpenCheck, Gauge, RotateCcw } from 'lucide-react';
import { getAFAISummary } from '../afaiApi';
import { GlassCard, MotionPage, NeonBadge } from '../../components/PremiumUI';

function getSessionId(locationState) {
  if (locationState?.sessionId) return locationState.sessionId;
  try {
    return JSON.parse(sessionStorage.getItem('afaiInterview'))?.sessionId || '';
  } catch {
    return '';
  }
}

function MarkdownLite({ text }) {
  if (!text) return null;
  return (
    <div className="space-y-2 text-sm leading-6 text-slate-300">
      {text.split('\n').filter(Boolean).map((line, index) => {
        if (line.startsWith('##')) {
          return <h3 key={index} className="pt-3 text-base font-black text-white">{line.replace(/^#+\s*/, '')}</h3>;
        }
        if (line.startsWith('-')) {
          return <p key={index} className="pl-3">{line}</p>;
        }
        return <p key={index}>{line}</p>;
      })}
    </div>
  );
}

export default function AFAISummary() {
  const location = useLocation();
  const navigate = useNavigate();
  const sessionId = useMemo(() => getSessionId(location.state), [location.state]);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadSummary() {
      if (!sessionId) {
        setError('No interview session found.');
        setIsLoading(false);
        return;
      }

      try {
        const data = await getAFAISummary(sessionId);
        if (mounted) setSummary(data);
      } catch (err) {
        if (mounted) setError(err.response?.data?.error || 'Unable to generate summary.');
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadSummary();
    return () => {
      mounted = false;
    };
  }, [sessionId]);

  return (
    <MotionPage className="pb-12">
      <header className="mx-auto max-w-7xl px-5 pt-8">
        <GlassCard className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/afai/interview')} className="icon-btn" aria-label="Back to interview">
              <ArrowLeft size={18} />
            </button>
            <div>
              <NeonBadge>AFAI final report</NeonBadge>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-white">Interview performance summary</h1>
            </div>
          </div>
          <button onClick={() => navigate('/afai')} className="inline-flex items-center gap-2 rounded-xl bg-stone-50 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-sky-100">
            <RotateCcw size={16} />
            New interview
          </button>
        </GlassCard>
      </header>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-5 lg:grid-cols-[340px_1fr]">
        <aside className="space-y-4">
          <GlassCard className="p-5">
            <div className="flex items-center gap-3">
              <Gauge className="text-sky-100" size={23} />
              <h2 className="text-lg font-black text-white">Score</h2>
            </div>
            <p className="mt-4 text-4xl font-black text-white">{summary?.averageScore ?? '--'}<span className="text-base text-slate-500">/100</span></p>
            <p className="mt-1 text-sm font-semibold text-slate-400">{summary?.performanceLevel || 'Generating...'}</p>
          </GlassCard>

          <GlassCard className="p-5">
            <div className="flex items-center gap-3">
              <BadgeCheck className="text-sky-100" size={23} />
              <h2 className="text-lg font-black text-white">Hiring signal</h2>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-300">{summary?.hiringRecommendation || 'Pending final analysis.'}</p>
          </GlassCard>
        </aside>

        <GlassCard className="p-5">
          <div className="mb-5 flex items-center gap-3">
            <BookOpenCheck className="text-sky-100" size={23} />
            <h2 className="text-lg font-black text-white">AFAI analysis</h2>
          </div>

          {isLoading && <p className="text-sm text-slate-400">Generating final interview report...</p>}
          {error && <p className="rounded-xl border border-rose-300/25 bg-rose-400/10 px-3 py-2 text-sm text-rose-100">{error}</p>}
          {!isLoading && !error && <MarkdownLite text={summary?.aiSummary} />}
        </GlassCard>
      </section>
    </MotionPage>
  );
}
