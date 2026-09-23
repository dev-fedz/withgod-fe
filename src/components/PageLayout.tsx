import React, { useEffect } from 'react';
import { useApp, BreadcrumbItem } from '../context/AppContext';

interface PageLayoutProps {
  title: string;
  items?: BreadcrumbItem[];
  actions?: React.ReactNode;
}

export const PageLayout: React.FC<PageLayoutProps> = ({ title, items, actions }) => {
  const { setPageMeta } = useApp();

  useEffect(() => {
    setPageMeta({ title, items, actions });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, setPageMeta]);

  return null;
};

export default PageLayout;
