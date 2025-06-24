
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Breadcrumb } from '@/types';

interface BreadcrumbsProps {
  items: Breadcrumb[];
}

const Breadcrumbs = ({ items }: BreadcrumbsProps) => {
  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-1">
        {items.map((item, index) => (
          <li key={item.href} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="mx-1 h-4 w-4 flex-shrink-0 text-gray-400" />
            )}
            
            <Link
              to={item.href}
              className={cn(
                "text-sm font-medium",
                item.current
                  ? "text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              )}
              aria-current={item.current ? "page" : undefined}
            >
              {item.name}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
