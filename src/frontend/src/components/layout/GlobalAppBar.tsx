import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GlobalAppBarProps {
  open: boolean;
  onDrawerToggle: () => void;
  drawerWidth: number;
  isMobile: boolean;
}

export function GlobalAppBar({ onDrawerToggle }: GlobalAppBarProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-30 flex h-[70px] items-center border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:left-[300px] lg:px-6">
      <Button
        type="button"
        variant="ghost"
        size="icon-lg"
        aria-label="Open menu"
        onClick={onDrawerToggle}
        className="lg:hidden"
      >
        <Menu className="size-5" />
      </Button>
      <div className="ml-auto" />
    </header>
  );
}
