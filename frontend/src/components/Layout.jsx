import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Bot, Briefcase, LayoutDashboard, LogOut, Search, UserRound } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { label: 'Dashboard', path: 'dashboard', icon: LayoutDashboard },
  { label: 'Jobs', path: '/jobs', icon: Search },
  { label: 'AFAI', path: '/afai', icon: Bot, candidateOnly: true },
];

function navClass({ isActive }) {
  return `inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
    isActive
      ? 'border border-white/10 bg-white/[0.08] text-stone-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
      : 'text-slate-400 hover:bg-white/[0.055] hover:text-stone-100'
  }`;
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const dashboardPath = user?.role === 'recruiter' ? '/recruiter/dashboard' : '/candidate/dashboard';

  return (
    <div className="min-h-screen text-white">
      <header className="sticky top-3 z-50 px-4">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto flex max-w-7xl flex-col gap-3 rounded-[1.35rem] border border-white/10 bg-[#10131bcc] px-4 py-3 shadow-[0_18px_70px_rgba(0,0,0,0.34)] backdrop-blur-2xl md:flex-row md:items-center md:justify-between"
        >
          <Link to={dashboardPath} className="group flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.055] text-sky-100 transition group-hover:scale-105">
              <Briefcase size={21} />
            </span>
            <div>
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                AI Job Portal
              </p>
              <p className="text-base font-black tracking-tight text-stone-50">Hiring workspace</p>
            </div>
          </Link>

          <nav className="flex flex-wrap items-center gap-2">
            {navItems.map(item => {
              if (item.path === 'dashboard' && !user) return null;
              if (item.candidateOnly && user?.role !== 'candidate') return null;
              const Icon = item.icon;
              const to = item.path === 'dashboard' ? dashboardPath : item.path;
              return (
                <NavLink key={item.label} to={to} className={navClass}>
                  <Icon size={16} />
                  {item.label}
                </NavLink>
              );
            })}
            {user && (
              <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.045] px-3 py-2 text-sm font-semibold text-slate-200">
                <UserRound size={16} />
                {user.name}
              </span>
            )}
            {user ? (
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.045] px-3 py-2 text-sm font-semibold text-slate-300 transition hover:border-rose-200/30 hover:bg-rose-400/10 hover:text-rose-100"
              >
                <LogOut size={16} />
                Logout
              </button>
            ) : (
              <NavLink to="/login" className={navClass}>Login</NavLink>
            )}
          </nav>
        </motion.div>
      </header>

      <Outlet />
    </div>
  );
}
