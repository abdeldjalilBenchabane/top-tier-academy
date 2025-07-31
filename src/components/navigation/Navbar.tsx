import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/lib/toast';
import { UserAvatar } from '@/components/ui/UserAvatar';
import NotificationBell from '@/components/ui/NotificationBell';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/schoolhouse/login', { replace: true });
  };
  

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center">
          <img 
            src="/2.svg" 
            alt="SchoolHouse Logo" 
            className="h-8 w-auto"
          />
        </Link>

        <div className="flex items-center gap-4">
          <span className="hidden md:block text-sm text-gray-600">
            {isAdmin ? 'Admin Dashboard' : 'Professor Dashboard'}
          </span>
          
          <NotificationBell />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-2">
                <UserAvatar size="sm" className="h-6 w-6" />
                <span className="hidden md:block">{user?.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                <span>{user?.role}</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="flex items-center gap-2 text-red-600" 
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
