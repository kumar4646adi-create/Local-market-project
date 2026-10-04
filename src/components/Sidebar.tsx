import React from 'react';
import { NavTab } from '../types';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  pendingRetailersCount: number;
  openDisputesCount: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  pendingRetailersCount,
  openDisputesCount,
  isOpenMobile,
  onCloseMobile
}) => {
  const navItems: { id: NavTab; label: string; icon: string; badge?: string | number; badgeColor?: string; pulse?: boolean }[] = [
    { id: 'overview', label: 'Overview', icon: 'grid_view' },
    {
      id: 'retailers',
      label: 'Retailers',
      icon: 'storefront',
      badge: pendingRetailersCount,
      badgeColor: 'bg-secondary-container text-on-secondary-container'
    },
    { id: 'customers', label: 'Customers & Accounts', icon: 'group' },
    {
      id: 'orders',
      label: 'Live Orders & Dispatch',
      icon: 'local_shipping',
      pulse: true
    },
    { id: 'area', label: 'Area & Expansion', icon: 'map' },
    { id: 'catalog', label: 'Catalog & Categories', icon: 'inventory_2' },
    { id: 'appointments', label: 'Appointments', icon: 'event_available' },
    {
      id: 'disputes',
      label: 'Disputes & Support',
      icon: 'support_agent',
      badge: openDisputesCount,
      badgeColor: 'bg-error-container text-on-error-container'
    },
    { id: 'settings', label: 'Settings & Rules', icon: 'settings' }
  ];

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 gap-2 bg-surface-container-lowest border-b border-outline-variant/20">
          <img
            alt="LocalMarket Brand Logo"
            className="h-8 w-auto object-contain"
            src="https://lh3.googleusercontent.com/aida/AEtjO1VIeh1T8bbN7es0WOOfCHKun5UZc8cFyYMGCZTern3tkvb-qkThxTcrCVh9Algro_Usqfeq-oZiE-6pY7aAiTncc2EO4PW3wpjQwrrPdaZ5R9o3eYuQHExHjy_M9LQuil7TRarJfXU132mJPhiVDHVrfozB5pmP7LwtKDYyffq6v2Zqf6mbqDkuqhf08rDQnieIbTz3mR3x8Fv4AllPk-GBBCwWDYeSWQlGBeaQPdvWQOxkvdaYMCn_NBE"
          />
          <div className="flex flex-col">
            <span className="font-headline-sm text-headline-sm text-on-surface leading-none font-bold">
              LocalMarket
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              Admin Console
            </span>
          </div>
        </div>

        {/* Section Label */}
        <div className="px-4 py-2 mt-2">
          <div className="px-2 py-1 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
            Management Suite
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-left transition-colors font-label-lg text-label-lg ${
                  isActive
                    ? 'bg-primary text-on-primary font-bold shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="material-symbols-outlined text-[20px] shrink-0">
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full font-label-sm text-label-sm font-bold shrink-0 ${
                      item.badgeColor || 'bg-surface-container text-on-surface-variant'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

                {item.pulse && (
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse shrink-0" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Gateway Node Bottom Widget */}
      <div className="p-4 mt-auto border-t border-outline-variant/20">
        <div className="p-3 rounded-xl bg-surface-container-low flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-label-md text-label-md text-on-surface font-semibold">
              Gateway Node
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              HP-North Cluster
            </span>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded font-label-sm text-label-sm font-bold bg-secondary-container text-on-secondary-container">
            Active
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-72 bg-surface-container-lowest z-50 flex-col shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-r border-outline-variant/20">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <aside className="relative w-72 max-w-[85vw] h-full bg-surface-container-lowest shadow-xl flex flex-col z-10">
            <div className="absolute right-2 top-3">
              <button
                onClick={onCloseMobile}
                className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
