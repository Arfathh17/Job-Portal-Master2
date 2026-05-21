import { useState } from 'react';
import { FileScan, FileText, Radar, Sparkles, Upload } from 'lucide-react';
import { analyzeResumeText, uploadResume } from '../services/resumeService';
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
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');

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

  const uploadResumeFile = async event => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');
    setIsParsingFile(true);
    setIsAnalyzing(true);
    setUploadedFileName(file.name);

    try {
      const result = await uploadResume(file);
      setAnalysis(result);
      setResumeText('');
    } catch (err) {
      setUploadedFileName('');
      setError(err.response?.data?.error || err.message || 'Could not analyze this resume with Gemini. Please upload a valid PDF or TXT file.');
    } finally {
      setIsParsingFile(false);
      setIsAnalyzing(false);
      event.target.value = '';
    }
  };

  const score = analysis?.atsScore || analysis?.score || 0;

  return (
    <MotionPage className="mx-auto w-full max-w-7xl overflow-hidden px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <section className="cinematic-stage mb-6 overflow-hidden rounded-[1.5rem] p-5 sm:p-8">
        <NeonBadge><Sparkles size={14} /> ResumeIQ</NeonBadge>
        <h1 className="dashboard-title mt-6 max-w-5xl overflow-hidden break-words text-3xl font-black uppercase leading-tight text-white sm:text-4xl md:text-6xl lg:text-7xl lg:leading-none">ResumeIQ</h1>
        <p className="mt-5 max-w-2xl text-base sm:text-lg leading-7 sm:leading-8 text-slate-300">
          ATS scoring, strength detection, gaps, and role recommendations in one focused review surface.
        </p>
      </section>

      <div className="grid min-w-0 gap-5 overflow-hidden lg:grid-cols-[minmax(0,1fr)_minmax(280px,380px)]">
        <GlassCard className="overflow-hidden p-5 sm:p-6" hover={false}>
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 text-violet-700 flex-shrink-0">
              <FileText size={24} />
            </span>
            <div className="min-w-0">
              <NeonBadge>ResumeIQ Console</NeonBadge>
              <h2 className="afai-wordmark mt-2 text-2xl sm:text-3xl font-black text-white break-words">Paste The Raw Resume Text</h2>
            </div>
          </div>
          <form onSubmit={analyze} className="mt-6 w-full min-w-0 overflow-hidden">
            <label className="mb-4 flex w-full min-w-0 cursor-pointer flex-col gap-2 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-xs font-semibold text-slate-300 transition hover:border-white/20 hover:bg-white/[0.075] sm:text-sm">
              <span className="inline-flex items-center gap-2 font-black text-white">
                <Upload size={17} />
                Upload Resume PDF
              </span>
              <span className="min-w-0 break-words text-slate-400">
                {isParsingFile ? 'Extracting PDF text...' : uploadedFileName || 'PDF and TXT files can populate the analyzer automatically.'}
              </span>
              <input type="file" accept=".pdf,.txt,application/pdf,text/plain" onChange={uploadResumeFile} className="sr-only" />
            </label>
            <div className="relative w-full min-w-0 overflow-hidden">
              {isAnalyzing && <div className="pointer-events-none absolute inset-x-4 top-4 h-px animate-pulse bg-gradient-to-r from-transparent via-violet-300 to-transparent shadow-[0_12px_28px_rgba(109,40,217,0.14)]" />}
              <textarea value={resumeText} onChange={event => setResumeText(event.target.value)} className="field min-h-[300px] w-full sm:min-h-[360px]" placeholder="Paste Resume Text Here..." required />
            </div>
            {error && <p className="mt-3 rounded-xl border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-xs sm:text-sm text-amber-100 break-words">{error}</p>}
            <GlowButton disabled={isAnalyzing || isParsingFile} className="mt-4 w-full sm:w-auto">
              <FileScan size={18} />
              {isAnalyzing ? 'Scanning Resume...' : 'Run ResumeIQ'}
            </GlowButton>
          </form>
        </GlassCard>

        <GlassCard className="overflow-hidden p-5" hover={false}>
          <h2 className="afai-wordmark flex items-center gap-2 text-lg sm:text-xl font-black text-white"><Radar className="text-violet-700 flex-shrink-0" size={20} /> Analysis</h2>
          {!analysis && <p className="mt-3 text-xs sm:text-sm leading-6 text-slate-400">Paste Resume Text Or Upload A PDF To Generate ATS Score And Role Recommendations.</p>}
          {analysis && (
            <div className="mt-5 space-y-5">
              <div className="grid place-items-center">
                <div className="grid h-32 w-32 place-items-center rounded-full border border-violet-200/70 bg-[conic-gradient(from_180deg,#a78bfa_var(--score),rgba(237,233,254,0.9)_0)] p-2 shadow-[0_24px_58px_rgba(109,40,217,0.14)] sm:h-40 sm:w-40" style={{ '--score': `${score}%` }}>
                  <div className="grid h-full w-full place-items-center rounded-full bg-white/95">
                    <p className="text-center text-3xl sm:text-4xl font-black text-white">{score}<span className="text-xs sm:text-sm text-slate-500">/100</span></p>
                  </div>
                </div>
              </div>
              <div>
                <p className="font-black text-white text-sm sm:text-base">Skills</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(analysis.skills || analysis.extractedSkills || []).map(skill => <span key={skill} className="rounded-full border border-white/10 bg-white/[0.055] px-3 py-1 text-xs font-bold text-slate-300">{skill}</span>)}
                </div>
              </div>
              <div>
                <p className="font-black text-white text-sm sm:text-base">Strengths</p>
                <ul className="mt-2 space-y-1 text-xs sm:text-sm text-slate-400">{(analysis.strengths || []).map(item => <li key={item} className="break-words">- {item}</li>)}</ul>
              </div>
              <div>
                <p className="font-black text-white text-sm sm:text-base">Improvements</p>
                <ul className="mt-2 space-y-1 text-xs sm:text-sm text-slate-400">{(analysis.improvements || []).map(item => <li key={item} className="break-words">- {item}</li>)}</ul>
              </div>
            </div>
          )}
        </GlassCard>
      </div>

      {analysis && <div className="mt-6"><RecommendedRoles analysis={analysis} /></div>}
    </MotionPage>
  );
}
