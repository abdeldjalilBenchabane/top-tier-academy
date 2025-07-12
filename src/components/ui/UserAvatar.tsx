import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { useAvatar } from '../../contexts/AvatarContext';

interface UserAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  name?: string;
  showFallback?: boolean;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16'
};

const textSizes = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl'
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  size = 'md',
  className = '',
  name,
  showFallback = true
}) => {
  const { avatarUrl, loading } = useAvatar();

  const getInitials = (userName?: string) => {
    if (!userName) return '?';
    return userName.charAt(0).toUpperCase();
  };

  if (loading && showFallback) {
    return (
      <Avatar className={`${sizeClasses[size]} ${className}`}>
        <AvatarFallback className="bg-gray-200 animate-pulse">
          <div className="w-4 h-4 bg-gray-300 rounded"></div>
        </AvatarFallback>
      </Avatar>
    );
  }

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      <AvatarImage 
        src={avatarUrl || undefined} 
        alt={name || 'صورة المستخدم'}
      />
      {showFallback && (
        <AvatarFallback className={`bg-gradient-to-br from-blue-500 to-blue-700 text-white font-bold ${textSizes[size]}`}>
          {getInitials(name)}
        </AvatarFallback>
      )}
    </Avatar>
  );
}; 