import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { GlobalAppBar } from './GlobalAppBar';
import { NavigationDrawer } from './NavigationDrawer';

const DRAWER_WIDTH = 300;

export function RootLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const syncDrawer = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      setDrawerOpen(desktop);
    };
    syncDrawer();
    window.addEventListener('resize', syncDrawer);
    return () => window.removeEventListener('resize', syncDrawer);
  }, []);

  return (
    <div className="min-h-svh bg-background text-foreground">
      <NavigationDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onToggleCollapse={() => setDrawerOpen((open) => !open)}
        drawerWidth={DRAWER_WIDTH}
        isMobile={!isDesktop}
      />
      <div className="min-w-0 lg:pl-[300px]">
        <GlobalAppBar
          open={drawerOpen}
          onDrawerToggle={() => setDrawerOpen((open) => !open)}
          drawerWidth={DRAWER_WIDTH}
          isMobile={!isDesktop}
        />
        <main className="min-w-0 pt-[70px]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
