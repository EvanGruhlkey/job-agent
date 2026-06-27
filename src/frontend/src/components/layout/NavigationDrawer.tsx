import { Building2, Clock3 } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { PRIMARY_NAV_ITEMS } from '../../config/routes.ts';

interface NavigationDrawerProps {
  open: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
  drawerWidth: number;
  isMobile: boolean;
}

type IconName = 'Business' | 'Schedule';

const iconMap = {
  Business: Building2,
  Schedule: Clock3,
} satisfies Record<IconName, typeof Building2>;

function DrawerContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-[70px] items-center px-5">
        <img
          src="/careerbase-logo.png"
          alt="Careerbase"
          className="h-11 w-auto max-w-[220px] object-contain"
        />
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-4 pt-6">
        {PRIMARY_NAV_ITEMS.map((item) => {
          const Icon = iconMap[item.icon as IconName];
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex h-12 items-center gap-3 rounded-xl px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  isActive && 'bg-sidebar-accent text-sidebar-accent-foreground shadow-xs'
                )
              }
            >
              <Icon className="size-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}

export function NavigationDrawer({ open, onClose, isMobile }: NavigationDrawerProps) {
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[300px] border-r bg-sidebar lg:block">
        <DrawerContent />
      </aside>

      {isMobile && (
        <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
          <SheetContent side="left" className="w-[300px] p-0 sm:max-w-[300px]" showCloseButton>
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <DrawerContent onNavigate={onClose} />
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
