import React from 'react';
import ThemeToggle from './ThemeToggle';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Package, ScanLine, Camera, Clapperboard, FolderSearch,
  Table2, BrainCircuit, Radio, ArrowLeftRight, Play, Info, ShieldCheck,
  ShoppingCart, Volume2
} from 'lucide-react';

const GROUPS = [
 {label:'Everyday',items:[
  {to:'/customer',label:'My deliveries',icon:Package},
  {to:'/packages',label:'Packages',icon:Package},
  {to:'/live-events',label:'Live events',icon:Play},
  {to:'/validation',label:'Scan validation',icon:ScanLine},
  {to:'/investigations',label:'Cases',icon:FolderSearch},
  {to:'/alerts',label:'Alerts',icon:FolderSearch}]},
 {label:'Warehouse tools',items:[
  {to:'/dashboard',label:'Command center',icon:LayoutDashboard},
  {to:'/monitoring',label:'Live monitoring',icon:Camera},
  {to:'/scanners',label:'Scanners',icon:ScanLine},
  {to:'/cameras',label:'Cameras',icon:Camera},
  {to:'/evidence',label:'Video evidence',icon:Clapperboard},
  {to:'/logistics',label:'Logistics grid',icon:Table2},
  {to:'/ai-tracking',label:'Hands-free preview',icon:BrainCircuit},
  {to:'/activity',label:'Activity history',icon:Table2}]},
 {label:'Connections and help',items:[
  {to:'/connections',label:'Connections',icon:Radio},
  {to:'/ring',label:'Ring integration',icon:Radio},
  {to:'/amazon',label:'Amazon integration',icon:ShoppingCart},
  {to:'/alexa',label:'Alexa voice',icon:Volume2},
  {to:'/interop',label:'Package P.I.',icon:ArrowLeftRight},
  {to:'/guided-demo',label:'Walkthrough',icon:Play},
  {to:'/settings',label:'Settings',icon:Info},
  {to:'/about',label:'About',icon:Info}]}
];

export default function Sidebar({ onNavigate }) {
  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex items-center gap-2.5 border-b border-sidebar-border px-4 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
          <ShieldCheck className="h-4 w-4" strokeWidth={2.4} />
        </div>
        <div className="min-w-0">
          <p className="truncate font-heading text-sm font-semibold tracking-tight text-foreground">Ring Guardian</p>
          <p className="truncate text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Evidence console</p>
        </div>
      </div>

      <nav className="rgc-scroll flex-1 overflow-y-auto px-2.5 py-3">
        {GROUPS.map((group) => (
          <details key={group.label} open={group.label==='Everyday'} className="mb-4 last:mb-1">
            <summary className="cursor-pointer px-2 pb-2 text-xs font-semibold text-muted-foreground">
              {group.label}
            </summary>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        'group flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] transition-colors ' +
                        (isActive
                          ? 'bg-sidebar-accent font-medium text-foreground'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-foreground')
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            className={'h-3.5 w-3.5 shrink-0 ' + (isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')}
                            strokeWidth={2}
                          />
                          <span className="truncate">{item.label}</span>
                        </>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </details>
        ))}
      </nav>

      <div className="border-t border-sidebar-border px-4 py-3">
        <ThemeToggle />
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          Demonstration build. Fictional logistics data, proposed wearable hardware, simulated device events.
        </p>
      </div>
    </div>
  );
}