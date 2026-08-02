import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, MapPin, Package, Tag, Box, Warehouse,
  Image, Ticket, Users2, Store, Bike, Users, MessageSquare, CreditCard,
  Wallet, Bell, BarChart2, Shield, Settings, ChevronDown, ChevronRight,
  Zap
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { NAV_ITEMS } from '../../config/navigation';
import { usePermission } from '../../hooks/usePermission';

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard, ShoppingBag, MapPin, Package, Tag, Box, Warehouse,
  Image, Ticket, Users2, Store, Bike, Users, MessageSquare, CreditCard,
  Wallet, Bell, BarChart2, Shield, Settings,
};

interface SidebarProps {
  collapsed: boolean;
}

export function Sidebar({ collapsed }: SidebarProps) {
  const { can } = usePermission();
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState<string[]>(['/catalog']);

  const toggleGroup = (href: string) => {
    setOpenGroups(prev =>
      prev.includes(href) ? prev.filter(h => h !== href) : [...prev, href]
    );
  };

  const visibleItems = NAV_ITEMS.filter(item =>
    !item.permission || can(item.permission)
  );

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-[#0F1923] transition-all duration-300 select-none shrink-0',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-[#EA580C] flex items-center justify-center shrink-0">
          <Zap size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <span className="font-bold text-white text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Jhatpats
            </span>
            <span className="block text-[10px] text-slate-400 leading-none">Admin Panel</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {visibleItems.map(item => {
          const Icon = iconMap[item.icon] ?? LayoutDashboard;
          const isGroupOpen = openGroups.includes(item.href);
          const isGroupActive = item.children?.some(c => location.pathname.startsWith(c.href));

          if (item.children) {
            return (
              <div key={item.href}>
                <button
                  onClick={() => toggleGroup(item.href)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                    isGroupActive
                      ? 'text-white bg-white/10'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  <Icon size={16} className="shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left font-medium">{item.label}</span>
                      {isGroupOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </>
                  )}
                </button>
                {!collapsed && isGroupOpen && (
                  <div className="ml-4 mt-0.5 space-y-0.5 border-l border-white/10 pl-3">
                    {item.children.map(child => (
                      <NavLink
                        key={child.href}
                        to={child.href}
                        className={({ isActive }) => cn(
                          'flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs transition-colors',
                          isActive
                            ? 'text-[#EA580C] bg-orange-500/10 font-semibold'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        )}
                      >
                        {(() => {
                          const ChildIcon = iconMap[child.icon] ?? Box;
                          return <ChildIcon size={13} className="shrink-0" />;
                        })()}
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === '/'}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                isActive
                  ? 'text-white bg-[#EA580C]/20 text-[#FB923C] font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={16} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
