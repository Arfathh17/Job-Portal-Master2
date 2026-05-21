import { Award, Building2, Compass, GraduationCap, Lightbulb } from 'lucide-react';
import RoleCard from './RoleCard';
import { GlassCard, NeonBadge } from '../components/PremiumUI';

function InfoList({ icon: Icon, title, items }) {
  if (!items?.length) return null;

  return (
    <GlassCard className="overflow-hidden p-4" hover={false}>
      <div className="flex items-center gap-2">
        <Icon className="text-violet-700 flex-shrink-0" size={19} />
        <h3 className="afai-wordmark font-black text-white text-sm sm:text-base break-words">{title}</h3>
      </div>
      <ul className="mt-3 space-y-1 text-xs sm:text-sm text-slate-400">
        {items.map(item => <li key={item} className="break-words">- {item}</li>)}
      </ul>
    </GlassCard>
  );
}

export default function RecommendedRoles({ analysis }) {
  const nestedAnalysis = analysis?.analysis || {};
  const roles = analysis?.recommendedRoles || analysis?.roleRecommendations || nestedAnalysis.roleRecommendations || [];
  if (!roles.length) return null;
  const detectedRole = analysis?.detectedRole || nestedAnalysis.detectedRole || roles[0]?.role;
  const atsScore = analysis?.atsScore || nestedAnalysis.atsScore || analysis?.overallScore || nestedAnalysis.overallScore || '--';

  return (
    <section className="min-w-0 space-y-5 overflow-hidden">
      <GlassCard className="cinematic-stage overflow-hidden p-5 sm:p-6" hover={false}>
        <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <NeonBadge>AI role recommendation</NeonBadge>
            <h2 className="afai-wordmark mt-3 text-2xl sm:text-3xl font-black text-white break-words">{analysis.bestCareerPath || nestedAnalysis.bestCareerPath || roles[0]?.role}</h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-400">
              Detected role: {detectedRole} · Estimated level: {analysis.estimatedExperienceLevel || nestedAnalysis.estimatedExperienceLevel || 'Intermediate'}
            </p>
          </div>
          <div className="w-full rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3 text-center md:w-auto">
            <p className="text-2xl sm:text-3xl font-black text-white">{atsScore}</p>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Role ATS score</p>
          </div>
        </div>
      </GlassCard>

      <div className="grid min-w-0 gap-4">
        {roles.map(role => (
          <RoleCard key={role.role} recommendation={role} />
        ))}
      </div>

      <div className="grid min-w-0 gap-4 md:grid-cols-2">
        <InfoList icon={Lightbulb} title="Role keyword gaps" items={analysis.nextTechnologiesToLearn || nestedAnalysis.nextTechnologiesToLearn} />
        <InfoList icon={Compass} title="Role-specific improvements" items={analysis.portfolioImprovements || nestedAnalysis.portfolioImprovements} />
        <InfoList icon={Award} title="Suggested certifications" items={analysis.suggestedCertifications || nestedAnalysis.suggestedCertifications} />
        <InfoList icon={Building2} title="Top hiring companies" items={analysis.topHiringCompanies || nestedAnalysis.topHiringCompanies} />
        <InfoList icon={GraduationCap} title="Resume strengths" items={analysis.strengths || nestedAnalysis.strengthAreas} />
      </div>
    </section>
  );
}
