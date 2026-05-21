import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Bot, Briefcase, FileText, LayoutDashboard, LogOut, Menu, Search, UserRound, X, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { label: 'Dashboard', path: 'dashboard', icon: LayoutDashboard },
  { label: 'Jobs', path: '/jobs', icon: Search },
  { label: 'ResumeIQ', path: '/resume-analyzer', icon: FileText, candidateOnly: true },
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dashboardPath = user?.role === 'recruiter' ? '/recruiter/dashboard' : '/candidate/dashboard';
  const visibleNavItems = navItems.filter(item => {
    if (item.path === 'dashboard' && !user) return false;
    if (item.authOnly && !user) return false;
    if (item.candidateOnly && user?.role !== 'candidate') return false;
    return true;
  });

  const handleLogout = () => {
    setIsMenuOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen text-slate-950">
      <header className="sticky top-4 z-50 overflow-hidden px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto w-full max-w-7xl rounded-[1.25rem] border border-violet-200/60 bg-white/80 px-3 py-3 shadow-[0_22px_70px_rgba(109,40,217,0.12)] backdrop-blur-2xl sm:px-5 lg:rounded-full"
        >
          <div className="flex items-center justify-between gap-3">
            <Link to={dashboardPath} className="group flex min-w-0 flex-shrink-0 items-center gap-3" onClick={() => setIsMenuOpen(false)}>
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-violet-200 bg-violet-100 text-violet-800 transition group-hover:scale-105">
                <Briefcase size={21} />
              </span>
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                  <Zap size={13} />
                  AFAI
                </p>
                <p className="afai-wordmark truncate text-base font-black text-slate-950">Talent Atelier</p>
              </div>
            </Link>

            <nav className="hidden min-w-0 items-center justify-end gap-2 lg:flex">
              {visibleNavItems.map(item => {
                const Icon = item.icon;
                const to = item.path === 'dashboard' ? dashboardPath : item.path;
                return (
                  <NavLink key={item.label} to={to} className={navClass}>
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
              {user && (
                <span className="inline-flex min-w-0 max-w-[180px] items-center gap-2 rounded-full border border-violet-200/60 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-700">
                  <UserRound size={16} />
                  <span className="truncate">{user.name}</span>
                </span>
              )}
              {user ? (
                <button
                  onClick={handleLogout}
                  className="magnetic-btn inline-flex items-center gap-2 rounded-full border border-violet-200/60 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              ) : (
                <NavLink to="/login" className={navClass}>Login</NavLink>
              )}
            </nav>

            <button
              type="button"
              aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen(open => !open)}
              className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-violet-200/60 bg-white/80 text-slate-700 transition hover:border-violet-300 hover:bg-violet-50 lg:hidden"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {isMenuOpen && (
            <nav className="mt-3 grid gap-2 border-t border-violet-200/50 pt-3 lg:hidden">
              {visibleNavItems.map(item => {
                const Icon = item.icon;
                const to = item.path === 'dashboard' ? dashboardPath : item.path;
                return (
                  <NavLink key={item.label} to={to} onClick={() => setIsMenuOpen(false)} className={navClass}>
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
              {user && (
                <span className="inline-flex min-w-0 max-w-full items-center gap-2 rounded-full border border-violet-200/60 bg-white/80 px-3.5 py-2 text-sm font-semibold text-slate-700">
                  <UserRound size={16} />
                  <span className="truncate">{user.name}</span>
                </span>
              )}
              {user ? (
              <button
                onClick={handleLogout}
                className="magnetic-btn inline-flex items-center gap-2 rounded-full border border-violet-200/60 bg-white/80 px-3.5 py-2 text-sm font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            ) : (
              <NavLink to="/login" onClick={() => setIsMenuOpen(false)} className={navClass}>Login</NavLink>
            )}
            </nav>
          )}
        </motion.div>
      </header>

      <Outlet />
    </div>
  );
}
