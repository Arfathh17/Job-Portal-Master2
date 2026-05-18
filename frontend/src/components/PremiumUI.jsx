import { useEffect } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { cn } from '../utils/cn';

gsap.registerPlugin(ScrollTrigger);

export function MotionPage({ children, className = '' }) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 14, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -10, filter: 'blur(8px)' }}
      transition={{ duration: 0.52, ease: [0.16, 1, 0.3, 1] }}
      className={cn('relative min-h-screen text-slate-950', className)}
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
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#fbfaff]">
      <div className="absolute inset-0 crafted-grid" />
      <div className="absolute inset-0 material-noise opacity-[0.18]" />
      <div className="absolute left-1/2 top-[-24rem] h-[48rem] w-[78rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(221,214,254,0.72),rgba(250,245,255,0.52)_42%,transparent_70%)] blur-3xl" />
      <div className="absolute bottom-[-22rem] left-[-14rem] h-[46rem] w-[46rem] rounded-full bg-[radial-gradient(circle,rgba(233,213,255,0.55),transparent_64%)] blur-3xl" />
      <div className="absolute bottom-[-18rem] right-[-10rem] h-[40rem] w-[40rem] rounded-full bg-[radial-gradient(circle,rgba(244,244,245,0.9),transparent_60%)] blur-3xl" />
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
    lenis.on('scroll', ScrollTrigger.update);
    let frameId;
    const magneticCleanups = [];

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

      gsap.utils.toArray('[data-reveal="section"]').forEach(section => {
        gsap.fromTo(
          section,
          { opacity: 0, y: 48, filter: 'blur(12px)' },
          {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: 1.05,
            ease: 'power3.out',
            scrollTrigger: { trigger: section, start: 'top 82%', once: true },
          },
        );
      });

      gsap.utils.toArray('[data-parallax]').forEach(element => {
        const depth = Number(element.dataset.parallax || 14);
        gsap.to(element, {
          yPercent: -depth,
          ease: 'none',
          scrollTrigger: { trigger: element, start: 'top bottom', end: 'bottom top', scrub: true },
        });
      });

      gsap.utils.toArray('.masked-letter').forEach((letter, index) => {
        gsap.fromTo(
          letter,
          { yPercent: 118, rotate: 3 },
          { yPercent: 0, rotate: 0, delay: index * 0.012, duration: 0.92, ease: 'power4.out' },
        );
      });

      gsap.utils.toArray('.magnetic-btn').forEach(button => {
        const move = event => {
          const rect = button.getBoundingClientRect();
          const x = event.clientX - rect.left - rect.width / 2;
          const y = event.clientY - rect.top - rect.height / 2;
          gsap.to(button, { x: x * 0.16, y: y * 0.24, duration: 0.35, ease: 'power3.out' });
        };
        const leave = () => gsap.to(button, { x: 0, y: 0, duration: 0.55, ease: 'elastic.out(1, 0.45)' });
        button.addEventListener('pointermove', move);
        button.addEventListener('pointerleave', leave);
        magneticCleanups.push(() => {
          button.removeEventListener('pointermove', move);
          button.removeEventListener('pointerleave', leave);
        });
      });
    });

    return () => {
      magneticCleanups.forEach(cleanup => cleanup());
      cancelAnimationFrame(frameId);
      lenis.destroy();
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
      ctx.revert();
    };
  }, []);

  return <motion.div className="fixed left-0 top-0 z-[70] h-[2px] origin-left bg-gradient-to-r from-violet-200 via-fuchsia-100 to-slate-200" style={{ scaleX }} />;
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
        'primary-action magnetic-btn group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl border border-violet-200/70 bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-[0_18px_42px_rgba(109,40,217,0.16)] transition duration-300 hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-900 disabled:cursor-not-allowed disabled:opacity-55',
        className,
      )}
      {...props}
    >
      <span className="absolute inset-0 translate-y-full bg-gradient-to-t from-violet-300/45 to-transparent transition duration-500 group-hover:translate-y-0" />
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </Component>
  );
}

export function NeonBadge({ children, className = '' }) {
  return (
    <span className={cn('editorial-label inline-flex items-center gap-2 rounded-full border border-violet-200/70 bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-violet-700', className)}>
      {children}
    </span>
  );
}

export function MaskedHeadline({ children, className = '' }) {
  const text = String(children);

  return (
    <span className={cn('masked-headline', className)} aria-label={text}>
      {text.split('').map((char, index) => (
        <span className="masked-letter-wrap" aria-hidden="true" key={`${char}-${index}`}>
          <span className="masked-letter">{char === ' ' ? '\u00a0' : char}</span>
        </span>
      ))}
    </span>
  );
}

export function EditorialShell({ eyebrow, title, copy, children, className = '' }) {
  return (
    <section data-reveal="section" className={cn('section-shell', className)}>
      <div>
        {eyebrow && <NeonBadge>{eyebrow}</NeonBadge>}
        {title && <h2 className="mt-4 max-w-4xl text-4xl font-black leading-[0.92] tracking-normal text-slate-950 sm:text-6xl lg:text-7xl">{title}</h2>}
      </div>
      {copy && <p className="max-w-2xl text-base leading-7 text-slate-600">{copy}</p>}
      {children}
    </section>
  );
}

export function StatCard({ label, value, icon: Icon, tone = 'sky' }) {
  const toneClasses = {
    sky: 'bg-violet-100 text-violet-700 ring-violet-200/80',
    purple: 'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200/80',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200/80',
    amber: 'bg-amber-50 text-amber-700 ring-amber-200/80',
  };

  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
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
