import React from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { BottomNav } from './BottomNav';

interface PersistentLayoutProps {
  children: React.ReactNode;
}

export const PersistentLayout: React.FC<PersistentLayoutProps> = ({ children }) => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col md:flex-row text-stone-900 dark:text-stone-100 font-sans antialiased">
      {/* Persistent Static Sidebar on Desktop */}
      <Sidebar />

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {/* Persistent Static Navbar & Breadcrumbs */}
        <Navbar />

        {/* Dynamic Content animating with framer-motion keyed by router.pathname */}
        <main className="flex-1 overflow-x-hidden">
          <motion.div
            key={router.pathname}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className="w-full h-full"
          >
            {children}
          </motion.div>
        </main>

        {/* Persistent Mobile Bottom Navigation */}
        <BottomNav />
      </div>
    </div>
  );
};

export default PersistentLayout;
