
import React from 'react';
import Breadcrumbs from './Breadcrumbs';
import { Breadcrumb } from '@/types';

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  action?: React.ReactNode;
}

const PageHeader = ({
  title,
  description,
  breadcrumbs,
  action,
}: PageHeaderProps) => {
  return (
    <div className="mb-8 space-y-4">
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          )}
        </div>
        
        {action && <div className="ml-4 flex-shrink-0">{action}</div>}
      </div>
    </div>
  );
};

export default PageHeader;
