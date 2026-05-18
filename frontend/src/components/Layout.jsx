import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Bot, Briefcase, LayoutDashboard, LogOut, Search, UserRound, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { label: 'Dashboard', path: 'dashboard', icon: LayoutDashboard },
  { label: 'Jobs', path: '/jobs', icon: Search },
  { label: 'AFAI', path: '/afai', icon: Bot, candidateOnly: true },
];

function navClass({ isActive }) {
  return `magnetic-btn inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-bold transition ${
    isActive
      ? 'border border-violet-200 bg-violet-100 text-violet-950 shadow-[0_16px_36px_rgba(109,40,217,0.12)]'
      : 'border border-transparent text-slate-500 hover:border-violet-200 hover:bg-white/80 hover:text-violet-900'
  }`;
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const dashboardPath = user?.role === 'recruiter' ? '/recruiter/dashboard' : '/candidate/dashboard';

  return (
    <div className="min-h-screen text-slate-950">
      <header className="sticky top-4 z-50 px-4">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto flex max-w-7xl flex-col gap-3 rounded-full border border-violet-200/60 bg-white/80 px-3 py-3 shadow-[0_22px_70px_rgba(109,40,217,0.12)] backdrop-blur-2xl md:flex-row md:items-center md:justify-between"
        >
          <Link to={dashboardPath} className="group flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-violet-200 bg-violet-100 text-violet-800 transition group-hover:scale-105">
              <Briefcase size={21} />
            </span>
            <div>
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                <Zap size={13} />
                AFAI
              </p>
              <p className="afai-wordmark text-base font-black text-slate-950">Talent Atelier</p>
            </div>
          </Link>

          <nav className="flex flex-wrap items-center gap-2 md:justify-end">
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
              <span className="inline-flex items-center gap-2 rounded-full border border-violet-200/60 bg-white/80 px-3.5 py-2 text-sm font-semibold text-slate-700">
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
                className="magnetic-btn inline-flex items-center gap-2 rounded-full border border-violet-200/60 bg-white/80 px-3.5 py-2 text-sm font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
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
