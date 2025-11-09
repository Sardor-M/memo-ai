import * as React from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { Menu } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button, type ButtonProps } from '../ui/button';

type SidebarState = 'expanded' | 'collapsed';

type SidebarContextValue = {
  state: SidebarState;
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children, defaultOpen = true }: { children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [openMobile, setOpenMobile] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [state, setState] = useState<SidebarState>(defaultOpen ? 'expanded' : 'collapsed');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1024px)');

    const updateMatches = (matches: boolean) => {
      setIsMobile(matches);
      if (matches) {
        setState('collapsed');
        setOpen(false);
        setOpenMobile(false);
      } else {
        setOpen(defaultOpen);
        setState(defaultOpen ? 'expanded' : 'collapsed');
        setOpenMobile(false);
      }
    };

    updateMatches(mediaQuery.matches);

    const listener = (event: MediaQueryListEvent) => updateMatches(event.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [defaultOpen]);

  useEffect(() => {
    setState(open ? 'expanded' : 'collapsed');
  }, [open]);

  const toggleSidebar = () => {
    if (isMobile) {
      setOpenMobile(prev => !prev);
    } else {
      setOpen(prev => !prev);
    }
  };

  const value = useMemo<SidebarContextValue>(
    () => ({ state, open, setOpen, openMobile, setOpenMobile, isMobile, toggleSidebar }),
    [state, open, openMobile, isMobile]
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider.');
  }
  return context;
}

type SidebarProps = React.HTMLAttributes<HTMLDivElement> & {
  collapsible?: 'offcanvas' | 'icon' | 'none';
  showHandle?: boolean;
};

export function Sidebar({ className, collapsible = 'icon', showHandle = true, children, ...props }: SidebarProps) {
  const { state, openMobile, setOpenMobile, isMobile, open, setOpen } = useSidebar();
  const isCollapsed = collapsible === 'icon' && state === 'collapsed';

  const renderContent = () => (
    <div
      className={cn(
        'flex h-full flex-col gap-4 border-r border-sidebar-border bg-sidebar text-sidebar-foreground',
        isCollapsed && 'items-center pt-4'
      )}
    >
      {children}
    </div>
  );

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-200 md:hidden',
          openMobile ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={() => setOpenMobile(false)}
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-full w-[var(--sidebar-width-mobile,16rem)] flex-col overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-lg transition-transform duration-300 md:hidden',
          openMobile ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {renderContent()}
      </aside>

      <aside
        data-collapsible={collapsible}
        data-state={open ? 'expanded' : 'collapsed'}
        className={cn(
          'relative hidden h-full flex-col overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-300 md:flex',
          isCollapsed ? 'w-[var(--sidebar-width-icon,4.5rem)]' : 'w-[var(--sidebar-width,16rem)]',
          className
        )}
        {...props}
      >
        {showHandle && !isMobile && (
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="absolute top-5 right-6 z-100 flex h-6 w-6 items-center justify-center rounded-md border border-sidebar-border bg-black text-md text-white shadow-sm transition hover:bg-black/80"
            aria-label="Toggle sidebar"
          >
            <span className="absolute left-0 top-0 h-full w-[1px] bg-sidebar-border" />
            <span className="absolute left-0 top-0 h-[1px] w-full bg-sidebar-border" />
            <span className="relative">{open ? '‹' : '›'}</span>
          </button>
        )}
        {renderContent()}
      </aside>
    </>
  );
}

export function SidebarHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1 px-5 pt-6 text-sm', className)} {...props} />;
}

export function SidebarContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex-1 overflow-y-auto px-3 pb-6', className)} {...props} />;
}

export function SidebarFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-5 pb-6 text-xs text-sidebar-foreground/70', className)} {...props} />;
}

export function SidebarGroup({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-2 px-2', className)} {...props} />;
}

export function SidebarGroupLabel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-1 text-xs font-semibold uppercase tracking-wide text-sidebar-foreground/60', className)} {...props} />;
}

export function SidebarGroupContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1', className)} {...props} />;
}

export function SidebarMenu({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1', className)} {...props} />;
}

export function SidebarMenuItem({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('relative', className)} {...props} />;
}

export interface SidebarMenuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  isActive?: boolean;
}

export const SidebarMenuButton = React.forwardRef<HTMLButtonElement, SidebarMenuButtonProps>(
  ({ className, children, asChild = false, isActive = false, type, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    const componentProps = asChild
      ? props
      : {
          type: type ?? 'button',
          ...props,
        };
    return (
      <Comp
        ref={ref}
        className={cn(
          'group flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/80 transition hover:bg-sidebar-accent hover:text-sidebar-foreground',
          isActive && 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm hover:bg-sidebar-primary',
          className
        )}
        {...componentProps}
      >
        {children}
      </Comp>
    );
  }
);
SidebarMenuButton.displayName = 'SidebarMenuButton';

export function SidebarTrigger({ className, children, ...props }: ButtonProps) {
  const { toggleSidebar } = useSidebar();
  return (
    <Button
      variant="outline"
      size="icon"
      className={cn('h-9 w-9', className)}
      onClick={() => toggleSidebar()}
      {...props}
    >
      {children ?? <Menu size={16} />}
    </Button>
  );
}

export function SidebarInset({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { state } = useSidebar();
  const paddingClass = state === 'collapsed' ? 'md:pl-[var(--sidebar-width-icon,4.5rem)]' : 'md:pl-[var(--sidebar-width,16rem)]';
  return <div className={cn('flex-1', paddingClass, className)} {...props} />;
}
