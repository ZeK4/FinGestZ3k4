import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, Target, Settings } from 'lucide-react';

const Navbar: React.FC = () => {
  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center justify-center w-full h-full text-xs font-medium transition-colors ${
      isActive ? 'text-accent' : 'text-slate-400 hover:text-slate-200'
    }`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-primary border-t border-slate-700 md:top-0 md:left-0 md:h-screen md:w-20 md:border-r md:border-t-0 md:flex-col md:justify-start md:pt-8">
      <div className="flex w-full h-full md:flex-col md:h-auto md:gap-8">
        <NavLink to="/" className={navClass}>
          <LayoutDashboard className="w-6 h-6 mb-1" />
          <span className="md:hidden">Dash</span>
          <span className="hidden md:inline text-[10px]">Dash</span>
        </NavLink>
        <NavLink to="/investments" className={navClass}>
          <TrendingUp className="w-6 h-6 mb-1" />
          <span className="md:hidden">Invest</span>
          <span className="hidden md:inline text-[10px]">Invest</span>
        </NavLink>
        <NavLink to="/goals" className={navClass}>
          <Target className="w-6 h-6 mb-1" />
          <span className="md:hidden">Objectivos</span>
          <span className="hidden md:inline text-[10px]">Metas</span>
        </NavLink>
        <NavLink to="/settings" className={navClass}>
          <Settings className="w-6 h-6 mb-1" />
          <span className="md:hidden">Config</span>
          <span className="hidden md:inline text-[10px]">Config</span>
        </NavLink>
      </div>
    </nav>
  );
};

export default Navbar;