import React, { useState } from 'react';
import { Territory, AppRole } from '../types';

interface HeaderProps {
  currentTerritory: Territory;
  onSelectTerritory: (territory: Territory) => void;
  onToggleMobileMenu: () => void;
  onOpenNotifications: () => void;
  notificationCount: number;
  currentRole: AppRole | 'register';
  onSelectRole: (role: AppRole | 'register') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTerritory,
  onSelectTerritory,
  onToggleMobileMenu,
  onOpenNotifications,
  notificationCount,
  currentRole,
  onSelectRole
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className={`fixed top-0 left-0 ${currentRole === 'admin' ? 'lg:left-72' : ''} right-0 h-16 bg-surface-container-lowest/90 backdrop-blur-xl z-40 shadow-[0_1px_8px_rgba(0,0,0,0.04)] px-3 sm:px-6 flex items-center justify-between border-b border-outline-variant/20`}>
      {/* Left: Mobile Toggle, Portal Switcher & Territory Picker */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-lg text-on-surface-variant hover:bg-surface-container"
          aria-label="Open menu"
        >
          <span className="material-symbols-outlined text-[24px]">menu</span>
        </button>

        {/* Portal Switcher */}
        <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl border border-outline-variant/30">
          <button
            onClick={() => onSelectRole('admin')}
            className={`px-2.5 py-1 rounded-lg font-label-sm text-label-sm transition flex items-center gap-1 ${
              currentRole === 'admin'
                ? 'bg-surface-container-lowest text-on-surface font-bold shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">admin_panel_settings</span>
            <span className="hidden sm:inline">Admin</span>
          </button>

          <button
            onClick={() => onSelectRole('retailer')}
            className={`px-2.5 py-1 rounded-lg font-label-sm text-label-sm transition flex items-center gap-1 ${
              currentRole === 'retailer'
                ? 'bg-surface-container-lowest text-on-surface font-bold shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">storefront</span>
            <span className="hidden sm:inline">Retailer</span>
          </button>

          <button
            onClick={() => onSelectRole('customer')}
            className={`px-2.5 py-1 rounded-lg font-label-sm text-label-sm transition flex items-center gap-1 ${
              currentRole === 'customer'
                ? 'bg-surface-container-lowest text-on-secondary-container bg-secondary-container font-bold shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">shopping_bag</span>
            <span className="hidden sm:inline">Customer App</span>
          </button>

          <button
            onClick={() => onSelectRole('register')}
            className={`px-2 py-1 rounded-lg font-label-sm text-label-sm transition flex items-center gap-1 ${
              currentRole === 'register'
                ? 'bg-primary text-on-primary font-bold shadow-xs'
                : 'text-primary hover:bg-surface-container font-bold'
            }`}
            title="Register new store application"
          >
            <span className="material-symbols-outlined text-[15px]">add_business</span>
            <span className="hidden md:inline">+ Onboard Store</span>
          </button>
        </div>

        {/* Territory Dropdown */}
        <div className="hidden xl:flex items-center gap-1.5 bg-surface-container-low px-3 py-1.5 rounded-lg border border-outline-variant/30">
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
            location_on
          </span>
          <select
            value={currentTerritory}
            onChange={(e) => onSelectTerritory(e.target.value as Territory)}
            className="bg-transparent font-label-md text-label-md text-on-surface font-semibold focus:outline-none cursor-pointer pr-1"
          >
            <option value="all">All Territories</option>
            <option value="ghumarwin">Ghumarwin</option>
            <option value="bilaspur">Bilaspur</option>
            <option value="sundernagar">Sundernagar</option>
          </select>
        </div>
      </div>

      {/* Right: Notifications & Super Admin Profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* System Healthy Uptime Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container/50 text-on-secondary-container font-label-sm text-label-sm font-semibold">
          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
          <span>System Healthy • Firebase Live</span>
        </div>

        {/* Notifications Button */}
        <div className="relative">
          <button
            onClick={onOpenNotifications}
            aria-label="Notifications"
            className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors relative"
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-error text-on-error rounded-full font-label-sm text-[10px] flex items-center justify-center font-bold">
                {notificationCount}
              </span>
            )}
          </button>
        </div>

        <div className="h-6 w-px bg-outline-variant/40" />

        {/* Super Admin Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 cursor-pointer p-1 rounded-lg hover:bg-surface-container-low transition-colors text-left"
          >
            <div className="hidden md:flex flex-col text-right">
              <span className="font-label-md text-label-md text-on-surface font-bold leading-tight">
                Aditya Kumar
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant leading-tight">
                Super Admin
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary text-on-primary font-bold text-xs flex items-center justify-center shadow-sm ring-1 ring-outline-variant/30 tracking-tight">
              AK
            </div>
          </button>

          {/* Quick Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant/20 p-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="p-3 border-b border-outline-variant/20">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-10 h-10 rounded-full bg-primary text-on-primary font-bold text-sm flex items-center justify-center shadow-xs">
                    AK
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-label-md text-label-md text-on-surface font-bold truncate">Aditya Kumar</p>
                    <p className="font-body-sm text-[11px] text-on-surface-variant truncate font-medium">ADI98712KUMAR@GMAIL.COM</p>
                  </div>
                </div>
                <div className="mt-1 inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-[11px] font-bold">
                  <span className="material-symbols-outlined text-[14px]">verified_user</span>
                  LocalMarket Super Admin
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    onSelectRole('admin');
                    setShowProfileMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-on-surface font-label-md text-label-md hover:bg-surface-container-low rounded-lg text-left"
                >
                  <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                  Super Admin Console
                </button>
                <button
                  onClick={() => {
                    onSelectRole('retailer');
                    setShowProfileMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-on-surface font-label-md text-label-md hover:bg-surface-container-low rounded-lg text-left"
                >
                  <span className="material-symbols-outlined text-[18px]">store</span>
                  Retailer Merchant Dashboard
                </button>
                <button
                  onClick={() => {
                    onSelectRole('customer');
                    setShowProfileMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-on-surface font-label-md text-label-md hover:bg-surface-container-low rounded-lg text-left"
                >
                  <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
                  Local Consumer App View
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
