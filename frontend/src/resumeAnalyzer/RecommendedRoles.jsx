import { Award, Building2, Compass, GraduationCap, Lightbulb } from 'lucide-react';
import RoleCard from './RoleCard';
import { GlassCard, NeonBadge } from '../components/PremiumUI';

function InfoList({ icon: Icon, title, items }) {
  if (!items?.length) return null;

  return (
    <GlassCard className="p-4">
      <div className="flex items-center gap-2">
        <Icon className="text-sky-100" size={19} />
        <h3 className="font-black text-white">{title}</h3>
      </div>
      <ul className="mt-3 space-y-1 text-sm text-slate-400">
        {items.map(item => <li key={item}>- {item}</li>)}
      </ul>
    </GlassCard>
  );
}

export default function RecommendedRoles({ analysis }) {
  const roles = analysis?.recommendedRoles || analysis?.roleRecommendations || [];
  if (!roles.length) return null;

  return (
    <section className="space-y-5">
      <GlassCard className="p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <NeonBadge>AI role recommendation</NeonBadge>
            <h2 className="mt-3 text-2xl font-black text-white">{analysis.bestCareerPath || roles[0]?.role}</h2>
            <p className="mt-2 text-sm text-slate-400">
              Estimated level: {analysis.estimatedExperienceLevel || 'Intermediate'}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3 text-center">
            <p className="text-3xl font-black text-white">{analysis.atsScore || analysis.overallScore || '--'}</p>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">ATS score</p>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-4">
        {roles.map(role => (
          <RoleCard key={role.role} recommendation={role} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <InfoList icon={Lightbulb} title="Next technologies to learn" items={analysis.nextTechnologiesToLearn} />
        <InfoList icon={Compass} title="Portfolio improvements" items={analysis.portfolioImprovements} />
        <InfoList icon={Award} title="Suggested certifications" items={analysis.suggestedCertifications} />
        <InfoList icon={Building2} title="Top hiring companies" items={analysis.topHiringCompanies} />
        <InfoList icon={GraduationCap} title="Resume strengths" items={analysis.strengths} />
      </div>
    </section>
  );
}
