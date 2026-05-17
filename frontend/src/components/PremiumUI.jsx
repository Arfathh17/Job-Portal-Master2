import { useEffect } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import gsap from 'gsap';
import Lenis from 'lenis';
import { cn } from '../utils/cn';

export function MotionPage({ children, className = '' }) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 14, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -10, filter: 'blur(8px)' }}
      transition={{ duration: 0.52, ease: [0.16, 1, 0.3, 1] }}
      className={cn('relative min-h-screen text-stone-50', className)}
    >
      {children}
    </motion.main>
  );
}

export function PremiumBackground() {
  useEffect(() => {
    const updatePointer = event => {
      document.documentElement.style.setProperty('--cursor-x', `${event.clientX}px`);
      document.documentElement.style.setProperty('--cursor-y', `${event.clientY}px`);
    };

    window.addEventListener('pointermove', updatePointer, { passive: true });
    return () => window.removeEventListener('pointermove', updatePointer);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#08090d]">
      <div className="absolute inset-0 crafted-grid" />
      <div className="absolute inset-0 material-noise opacity-[0.06]" />
      <div className="absolute left-1/2 top-[-22rem] h-[42rem] w-[72rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(125,145,255,0.22),rgba(30,41,59,0.1)_42%,transparent_68%)] blur-3xl" />
      <div className="absolute bottom-[-20rem] left-[-14rem] h-[42rem] w-[42rem] rounded-full bg-[radial-gradient(circle,rgba(45,212,191,0.13),transparent_62%)] blur-3xl" />
      <div className="cursor-ambience" />
      <div className="ambient-thread left-[12%] top-[24%]" />
      <div className="ambient-thread right-[10%] top-[62%] [animation-delay:2s]" />
    </div>
  );
}

export function SmoothExperience() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 28, restDelta: 0.001 });

  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.82, smoothWheel: true });
    let frameId;

    function raf(time) {
      lenis.raf(time);
      frameId = requestAnimationFrame(raf);
    }

    frameId = requestAnimationFrame(raf);

    const ctx = gsap.context(() => {
      gsap.utils.toArray('.gsap-reveal').forEach((element, index) => {
        gsap.fromTo(
          element,
          { opacity: 0, y: 18, filter: 'blur(7px)' },
          { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.74, delay: index * 0.035, ease: 'power3.out' },
        );
      });
    });

    return () => {
      cancelAnimationFrame(frameId);
      lenis.destroy();
      ctx.revert();
    };
  }, []);

  return <motion.div className="fixed left-0 top-0 z-[70] h-[2px] origin-left bg-gradient-to-r from-sky-200 via-indigo-300 to-teal-200" style={{ scaleX }} />;
}

function updateLocalPointer(event) {
  const rect = event.currentTarget.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const rx = ((y / rect.height) - 0.5) * -5;
  const ry = ((x / rect.width) - 0.5) * 5;
  event.currentTarget.style.setProperty('--local-x', `${x}px`);
  event.currentTarget.style.setProperty('--local-y', `${y}px`);
  event.currentTarget.style.setProperty('--tilt-x', `${rx}deg`);
  event.currentTarget.style.setProperty('--tilt-y', `${ry}deg`);
}

function resetLocalPointer(event) {
  event.currentTarget.style.setProperty('--tilt-x', '0deg');
  event.currentTarget.style.setProperty('--tilt-y', '0deg');
}

export function GlassCard({ children, className = '', hover = true }) {
  return (
    <motion.div
      onPointerMove={updateLocalPointer}
      onPointerLeave={resetLocalPointer}
      whileHover={hover ? { y: -3 } : undefined}
      transition={{ type: 'spring', stiffness: 230, damping: 24 }}
      className={cn('glass-panel gsap-reveal', hover && 'motion-panel', className)}
    >
      {children}
    </motion.div>
  );
}

export function GlowButton({ children, className = '', as: Component = 'button', ...props }) {
  return (
    <Component
      className={cn(
        'magnetic-btn group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl border border-white/10 bg-stone-50 px-5 py-3 text-sm font-bold text-slate-950 shadow-[0_18px_42px_rgba(0,0,0,0.22)] transition duration-300 hover:-translate-y-0.5 hover:border-sky-200/50 hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-55',
        className,
      )}
      {...props}
    >
      <span className="absolute inset-0 translate-y-full bg-gradient-to-t from-sky-200/70 to-transparent transition duration-500 group-hover:translate-y-0" />
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </Component>
  );
}

export function NeonBadge({ children, className = '' }) {
  return (
    <span className={cn('inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.055] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-300', className)}>
      {children}
    </span>
  );
}

export function StatCard({ label, value, icon: Icon, tone = 'sky' }) {
  const toneClasses = {
    sky: 'bg-sky-200/10 text-sky-100 ring-sky-200/15',
    purple: 'bg-violet-200/10 text-violet-100 ring-violet-200/15',
    emerald: 'bg-teal-200/10 text-teal-100 ring-teal-200/15',
    amber: 'bg-amber-200/10 text-amber-100 ring-amber-200/15',
  };

  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-black text-stone-50">{value}</p>
        </div>
        {Icon && (
          <span className={cn('flex h-11 w-11 items-center justify-center rounded-2xl ring-1', toneClasses[tone])}>
            <Icon size={20} />
          </span>
        )}
      </div>
    </GlassCard>
  );
}
