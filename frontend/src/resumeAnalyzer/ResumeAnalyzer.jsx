import { useState } from 'react';
import { FileScan, FileText, Radar, Sparkles } from 'lucide-react';
import { analyzeResumeText } from '../services/resumeService';
import RecommendedRoles from './RecommendedRoles';
import { GlassCard, GlowButton, MotionPage, NeonBadge } from '../components/PremiumUI';

function localAnalyze(text) {
  const words = text.split(/\s+/).filter(Boolean);
  const skills = ['React', 'Node.js', 'MongoDB', 'Express', 'JWT', 'Python', 'SQL', 'Docker', 'AWS']
    .filter(skill => new RegExp(skill.replace('.', '\\.'), 'i').test(text));
  const hasMetrics = /\b\d+%|\b\d+x|\b\d+\+/.test(text);

  return {
    atsScore: Math.min(95, 45 + skills.length * 6 + (hasMetrics ? 15 : 0) + Math.min(20, Math.floor(words.length / 30))),
    skills,
    strengths: [skills.length ? 'Clear technical keywords detected' : 'Basic resume content detected', hasMetrics ? 'Includes measurable impact' : 'Readable resume structure'],
    improvements: [!hasMetrics && 'Add measurable outcomes and impact numbers', skills.length < 4 && 'Add more role-specific technical keywords', words.length < 120 && 'Expand project and experience descriptions'].filter(Boolean),
    recommendedRoles: [{ role: skills.includes('React') && skills.includes('Node.js') ? 'MERN Stack Developer' : 'Software Engineer', matchPercentage: Math.min(94, 62 + skills.length * 4), reason: 'Local fallback detected relevant skills and project keywords in the resume text.', missingSkills: ['Docker', 'Redis', 'Testing'], recommendedLearning: ['Build one deployed portfolio project', 'Add measurable project outcomes', 'Practice API and database design'] }],
    bestCareerPath: skills.includes('React') && skills.includes('Node.js') ? 'MERN Stack Developer' : 'Software Engineer',
    estimatedExperienceLevel: words.length > 180 ? 'Intermediate' : 'Beginner',
    nextTechnologiesToLearn: ['Docker', 'Redis', 'CI/CD'],
    portfolioImprovements: ['Add live project links', 'Add measurable impact', 'Explain architecture trade-offs'],
  };
}

export default function ResumeAnalyzer() {
  const [resumeText, setResumeText] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyze = async event => {
    event.preventDefault();
    setError('');
    setIsAnalyzing(true);

    try {
      const result = await analyzeResumeText({ resumeText });
      setAnalysis(result);
    } catch (err) {
      setAnalysis(localAnalyze(resumeText));
      setError(err.response?.data?.error || 'Backend analyzer unavailable. Showing local recommendation fallback.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const score = analysis?.atsScore || analysis?.score || 0;

  return (
    <MotionPage className="mx-auto max-w-7xl px-5 pb-16 pt-8">
      <section className="cinematic-stage mb-6 rounded-[1.5rem] p-6 sm:p-8">
        <NeonBadge><Sparkles size={14} /> Resume intelligence</NeonBadge>
        <h1 className="dashboard-title mt-6 max-w-5xl font-black uppercase text-white">Turn your resume into a sharper signal.</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
          ATS scoring, strength detection, gaps, and role recommendations in one focused review surface.
        </p>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <GlassCard className="p-5 sm:p-6" hover={false}>
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 text-violet-700">
              <FileText size={24} />
            </span>
            <div>
              <NeonBadge>Analyzer console</NeonBadge>
              <h2 className="afai-wordmark mt-2 text-3xl font-black text-white">Paste the raw resume text</h2>
            </div>
          </div>
          <form onSubmit={analyze} className="mt-6">
            <div className="relative">
              {isAnalyzing && <div className="pointer-events-none absolute inset-x-4 top-4 h-px animate-pulse bg-gradient-to-r from-transparent via-violet-300 to-transparent shadow-[0_12px_28px_rgba(109,40,217,0.14)]" />}
              <textarea value={resumeText} onChange={event => setResumeText(event.target.value)} className="field min-h-[360px]" placeholder="Paste resume text here..." required />
            </div>
            {error && <p className="mt-3 rounded-xl border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-sm text-amber-100">{error}</p>}
            <GlowButton disabled={isAnalyzing} className="mt-4">
              <FileScan size={18} />
              {isAnalyzing ? 'Scanning resume...' : 'Analyze resume'}
            </GlowButton>
          </form>
        </GlassCard>

        <GlassCard className="p-5" hover={false}>
          <h2 className="afai-wordmark flex items-center gap-2 text-xl font-black text-white"><Radar className="text-violet-700" size={20} /> Analysis</h2>
          {!analysis && <p className="mt-3 text-sm leading-6 text-slate-400">Paste resume text to generate ATS score and role recommendations.</p>}
          {analysis && (
            <div className="mt-5 space-y-5">
              <div className="grid place-items-center">
                <div className="grid h-40 w-40 place-items-center rounded-full border border-violet-200/70 bg-[conic-gradient(from_180deg,#a78bfa_var(--score),rgba(237,233,254,0.9)_0)] p-2 shadow-[0_24px_58px_rgba(109,40,217,0.14)]" style={{ '--score': `${score}%` }}>
                  <div className="grid h-full w-full place-items-center rounded-full bg-white/95">
                    <p className="text-center text-4xl font-black text-white">{score}<span className="text-sm text-slate-500">/100</span></p>
                  </div>
                </div>
              </div>
              <div>
                <p className="font-black text-white">Skills</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(analysis.skills || analysis.extractedSkills || []).map(skill => <span key={skill} className="rounded-full border border-white/10 bg-white/[0.055] px-3 py-1 text-xs font-bold text-slate-300">{skill}</span>)}
                </div>
              </div>
              <div>
                <p className="font-black text-white">Strengths</p>
                <ul className="mt-2 space-y-1 text-sm text-slate-400">{(analysis.strengths || []).map(item => <li key={item}>- {item}</li>)}</ul>
              </div>
              <div>
                <p className="font-black text-white">Improvements</p>
                <ul className="mt-2 space-y-1 text-sm text-slate-400">{(analysis.improvements || []).map(item => <li key={item}>- {item}</li>)}</ul>
              </div>
            </div>
          )}
        </GlassCard>
      </div>

      {analysis && <div className="mt-6"><RecommendedRoles analysis={analysis} /></div>}
    </MotionPage>
  );
}
