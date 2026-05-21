import { useState } from 'react';
import { AlertTriangle, CheckCircle2, FileScan, FileText, ListChecks, Radar, Sparkles, Target, Upload, UserRound } from 'lucide-react';
import { analyzeResumeText, uploadResume } from '../services/resumeService';
import RecommendedRoles from './RecommendedRoles';
import { GlassCard, GlowButton, MotionPage, NeonBadge } from '../components/PremiumUI';

function pickList(...lists) {
  return lists.find(items => Array.isArray(items) && items.length) || [];
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
      setAnalysis(null);
      setError(err.response?.data?.error || 'Backend analyzer unavailable. Please log in again or retry after the backend wakes up.');
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

  const nestedAnalysis = analysis?.analysis || {};
  const score = analysis?.overallScore || nestedAnalysis.overallScore || analysis?.atsScore || nestedAnalysis.atsScore || analysis?.score || 0;
  const atsScore = analysis?.atsScore || nestedAnalysis.atsScore || 0;
  const candidateName = analysis?.candidateName || nestedAnalysis.candidateName || '';
  const detectedRole = analysis?.detectedRole || nestedAnalysis.detectedRole || analysis?.bestCareerPath || nestedAnalysis.bestCareerPath || 'General Professional';
  const welcomeMessage = analysis?.welcomeMessage || nestedAnalysis.welcomeMessage || "Welcome to AFAI Resume IQ. Let's analyze your resume.";
  const skills = pickList(analysis?.skills, analysis?.extractedSkills, nestedAnalysis.extractedSkills);
  const strengths = pickList(analysis?.strengths, nestedAnalysis.strengthAreas);
  const weaknesses = pickList(analysis?.weaknesses, nestedAnalysis.weakAreas);
  const improvements = pickList(analysis?.actionableImprovements, analysis?.improvements, nestedAnalysis.actionableImprovements, nestedAnalysis.weakAreas);
  const missingKeywords = pickList(analysis?.missingKeywordSuggestions, nestedAnalysis.missingKeywordSuggestions);
  const matchedKeywords = pickList(analysis?.matchedRoleKeywords, nestedAnalysis.matchedRoleKeywords);
  const sectionAnalysis = pickList(analysis?.sectionAnalysis, nestedAnalysis.sectionAnalysis);

  return (
    <MotionPage className="mx-auto w-full max-w-7xl overflow-hidden px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <section className="cinematic-stage mb-6 overflow-hidden rounded-[1.5rem] p-5 sm:p-8">
        <NeonBadge><Sparkles size={14} /> AFAI Resume IQ</NeonBadge>
        <h1 className="dashboard-title mt-6 max-w-5xl overflow-hidden break-words text-3xl font-black uppercase leading-tight text-white sm:text-4xl md:text-6xl lg:text-7xl lg:leading-none">AFAI Resume IQ</h1>
        <p className="mt-5 max-w-2xl text-base sm:text-lg leading-7 sm:leading-8 text-slate-300">
          Resume-based scoring, ATS keyword intelligence, section feedback, and role recommendations in one focused review surface.
        </p>
      </section>

      <div className="grid min-w-0 gap-5 overflow-hidden lg:grid-cols-[minmax(0,1fr)_minmax(280px,380px)]">
        <GlassCard className="overflow-hidden p-5 sm:p-6" hover={false}>
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 text-violet-700 flex-shrink-0">
              <FileText size={24} />
            </span>
            <div className="min-w-0">
              <NeonBadge>Resume IQ Console</NeonBadge>
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
              {isAnalyzing ? 'Scanning Resume...' : 'Run AFAI Resume IQ'}
            </GlowButton>
          </form>
        </GlassCard>

        <GlassCard className="overflow-hidden p-5" hover={false}>
          <h2 className="afai-wordmark flex items-center gap-2 text-lg sm:text-xl font-black text-white"><Radar className="text-violet-700 flex-shrink-0" size={20} /> Resume IQ Report</h2>
          {!analysis && <p className="mt-3 text-xs sm:text-sm leading-6 text-slate-400">Paste resume text or upload a PDF to generate a resume-based score, weaknesses, section analysis, and ATS keyword suggestions.</p>}
          {analysis && (
            <div className="mt-5 space-y-5">
              <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                <div className="flex items-start gap-3">
                  <UserRound className="mt-0.5 flex-shrink-0 text-violet-300" size={20} />
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Candidate</p>
                    <p className="mt-1 break-words text-lg font-black text-white">{candidateName || 'Name not detected'}</p>
                    <p className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-violet-200">Detected role: {detectedRole}</p>
                    <p className="mt-2 text-xs leading-5 text-slate-400">{welcomeMessage}</p>
                  </div>
                </div>
              </div>
              <div className="grid place-items-center">
                <div className="grid h-32 w-32 place-items-center rounded-full border border-violet-200/70 bg-[conic-gradient(from_180deg,#a78bfa_var(--score),rgba(237,233,254,0.9)_0)] p-2 shadow-[0_24px_58px_rgba(109,40,217,0.14)] sm:h-40 sm:w-40" style={{ '--score': `${score}%` }}>
                  <div className="grid h-full w-full place-items-center rounded-full bg-white/95">
                    <p className="text-center text-3xl sm:text-4xl font-black text-slate-950">{score}<span className="text-xs sm:text-sm text-slate-500">/100</span></p>
                  </div>
                </div>
                <p className="mt-3 text-center text-xs font-black uppercase tracking-[0.18em] text-slate-500">Overall resume score</p>
                <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-2 text-center">
                  <p className="text-lg font-black text-white">{atsScore}<span className="text-xs text-slate-500">/100</span></p>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Role ATS score</p>
                </div>
              </div>
              <div>
                <p className="font-black text-white text-sm sm:text-base">Detected Skills</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {skills.map(skill => <span key={skill} className="rounded-full border border-white/10 bg-white/[0.055] px-3 py-1 text-xs font-bold text-slate-300">{skill}</span>)}
                  {!skills.length && <span className="text-xs text-slate-500">No strong technical skills detected yet.</span>}
                </div>
              </div>
              <div>
                <p className="flex items-center gap-2 font-black text-white text-sm sm:text-base"><CheckCircle2 size={17} className="text-emerald-300" /> Strengths</p>
                <ul className="mt-2 space-y-1 text-xs sm:text-sm text-slate-400">{strengths.map(item => <li key={item} className="break-words">- {item}</li>)}</ul>
                {!strengths.length && <p className="mt-2 text-xs text-slate-500">AFAI Resume IQ needs more resume evidence before naming strong areas.</p>}
              </div>
              <div>
                <p className="flex items-center gap-2 font-black text-white text-sm sm:text-base"><AlertTriangle size={17} className="text-amber-300" /> Weaknesses</p>
                <ul className="mt-2 space-y-1 text-xs sm:text-sm text-slate-400">{weaknesses.map(item => <li key={item} className="break-words">- {item}</li>)}</ul>
                {!weaknesses.length && <p className="mt-2 text-xs text-slate-500">No major resume weakness detected from the available text.</p>}
              </div>
              <div>
                <p className="flex items-center gap-2 font-black text-white text-sm sm:text-base"><ListChecks size={17} className="text-violet-300" /> Actionable Improvements</p>
                <ul className="mt-2 space-y-1 text-xs sm:text-sm text-slate-400">{improvements.map(item => <li key={item} className="break-words">- {item}</li>)}</ul>
                {!improvements.length && <p className="mt-2 text-xs text-slate-500">The resume is already covering the main improvement checks.</p>}
              </div>
              <div>
                <p className="flex items-center gap-2 font-black text-white text-sm sm:text-base"><Target size={17} className="text-cyan-300" /> Role ATS Keywords</p>
                {matchedKeywords.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-bold text-slate-500">Matched</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {matchedKeywords.map(keyword => <span key={keyword} className="rounded-full border border-emerald-200/20 bg-emerald-200/10 px-3 py-1 text-xs font-bold text-emerald-100">{keyword}</span>)}
                    </div>
                  </div>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  {missingKeywords.map(keyword => <span key={keyword} className="rounded-full border border-amber-200/20 bg-amber-200/10 px-3 py-1 text-xs font-bold text-amber-100">{keyword}</span>)}
                  {!missingKeywords.length && <span className="text-xs text-slate-500">Detected role keywords are well covered.</span>}
                </div>
              </div>
            </div>
          )}
        </GlassCard>
      </div>

      {analysis && sectionAnalysis.length > 0 && (
        <section className="mt-6 min-w-0 overflow-hidden">
          <GlassCard className="overflow-hidden p-5 sm:p-6" hover={false}>
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <NeonBadge>Section-wise analysis</NeonBadge>
                <h2 className="afai-wordmark mt-3 text-2xl font-black text-white">Resume Quality Breakdown</h2>
              </div>
            </div>
            <div className="mt-5 grid min-w-0 gap-3 md:grid-cols-2">
              {sectionAnalysis.map(section => (
                <div key={section.section} className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words text-sm font-black text-white">{section.section}</p>
                      <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{section.status}</p>
                    </div>
                    <span className="flex-shrink-0 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-black text-slate-200">{section.score}/100</span>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-slate-400">{section.feedback}</p>
                  <p className="mt-3 text-xs leading-5 text-slate-300">{section.recommendation}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </section>
      )}

      {analysis && <div className="mt-6"><RecommendedRoles analysis={analysis} /></div>}
    </MotionPage>
  );
}
