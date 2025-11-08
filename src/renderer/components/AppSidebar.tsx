import { Calendar, History, Home, Inbox, Search, Settings } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Sidebar as SidebarRoot,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from './ui/sidebar';
import { cn } from '../lib/utils';

const navItems = [
  { title: 'Home', url: '/', icon: Home },
  { title: 'History', url: '/history', icon: History },
  { title: 'Schedule', url: '/schedule', icon: Inbox },
  { title: 'Calendar', url: '/calendar', icon: Calendar },
  { title: 'Settings', url: '/settings', icon: Settings },
];

/**
 * AppSidebar component is the sidebar component for the app.
 */
export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  return (
    <SidebarRoot collapsible="icon" showHandle={false} className="bg-black text-white">
      <SidebarHeader className="flex items-center justify-end px-4 pt-1">
        {collapsed && (
          <SidebarTrigger
            variant="ghost"
            size="icon"
            className="hidden md:flex h-8 w-8 items-center justify-center rounded-md border border-white/15 bg-white/10 text-white hover:bg-white/20"
            aria-label="Expand sidebar"
          />
        )}
      </SidebarHeader>
      <SidebarContent className={cn('mt-6 space-y-6 px-2', collapsed && 'mt-4 px-0')}
        data-state={state}
      >
        <SidebarGroup>
          {collapsed ? null : (
            <div className="flex items-center justify-between px-1 text-[11px] font-medium uppercase tracking-wider text-white/40">
              <SidebarGroupLabel className="px-0 text-white/60">
                Main navigation
              </SidebarGroupLabel>
              <SidebarTrigger
                variant="ghost"
                size="icon"
                className="hidden h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white hover:bg-white/10 md:flex"
                aria-label="Collapse sidebar"
              />
            </div>
          )}
          <SidebarGroupContent className={cn('mt-2', collapsed && 'mt-0')}>
            <SidebarMenu className="space-y-1">
              {navItems.map(item => {
                const active = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title} className={collapsed ? 'flex justify-center' : undefined}>
                    <SidebarMenuButton
                      isActive={active}
                      onClick={() => navigate(item.url)}
                      className={cn(
                        'justify-start gap-3 rounded-lg border border-transparent bg-white/5 text-sm text-white/70 transition hover:border-white/10 hover:bg-white/10 hover:text-white',
                        active && 'border-white/15 bg-white/15 text-white shadow-sm',
                        collapsed && 'h-10 w-10 justify-center rounded-full p-0'
                      )}
                    >
                      <item.icon size={16} className={cn('text-white/50 transition', active && 'text-white')} />
                      {!collapsed && <span className="truncate">{item.title}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {!collapsed && (
        <SidebarFooter className="px-6 pb-6 text-white/60">
          <div className="space-y-1">
            <p className="font-medium text-white">Memo-AI v0.0.1</p>
            <p>sardor0968@gmail.com</p>
          </div>
        </SidebarFooter>
      )}
    </SidebarRoot>
  );
}
