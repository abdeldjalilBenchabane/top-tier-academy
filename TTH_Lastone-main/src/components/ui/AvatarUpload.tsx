import React, { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { Button } from './button';
import { Camera, Loader2 } from 'lucide-react';
import { useAvatar } from '../../contexts/AvatarContext';

interface AvatarUploadProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    name?: string;
    showUploadButton?: boolean;
    onUploadSuccess?: (avatarUrl: string) => void;
    onUploadError?: (error: string) => void;
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

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
    size = 'md',
    className = '',
    name,
    showUploadButton = true,
    onUploadSuccess,
    onUploadError
}) => {
    const { avatarUrl, updateAvatar, loading } = useAvatar();
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const getInitials = (userName?: string) => {
        if (!userName) return '?';
        return userName.charAt(0).toUpperCase();
    };

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            const errorMsg = 'يرجى اختيار صورة بصيغة JPG أو PNG أو WebP';
            onUploadError?.(errorMsg);
            alert(errorMsg);
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            const errorMsg = 'حجم الصورة يجب أن يكون أقل من 5 ميجابايت';
            onUploadError?.(errorMsg);
            alert(errorMsg);
            return;
        }

        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('avatar', file);

            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`/api/users/avatar-profile`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Upload failed: ${response.status} - ${errorText}`);
            }

            const result = await response.json();

            // Update global avatar context
            updateAvatar(result.avatar_url);

            // Call success callback
            onUploadSuccess?.(result.avatar_url);

        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'فشل في رفع الصورة';
            console.error('Error uploading avatar:', err);
            onUploadError?.(errorMsg);
            alert(errorMsg);
        } finally {
            setUploading(false);
        }
    };

    const triggerFileUpload = () => {
        fileInputRef.current?.click();
    };

    if (loading) {
        return (
            <Avatar className={`${sizeClasses[size]} ${className}`}>
                <AvatarFallback className="bg-gray-200 animate-pulse">
                    <div className="w-4 h-4 bg-gray-300 rounded"></div>
                </AvatarFallback>
            </Avatar>
        );
    }

    return (
        <div className="relative group">
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
            />

            <Avatar className={`${sizeClasses[size]} ${className} cursor-pointer transition-transform group-hover:scale-105`}>
                <AvatarImage
                    src={avatarUrl || undefined}
                    alt={name || 'صورة المستخدم'}
                />
                <AvatarFallback className={`bg-gradient-to-br from-blue-500 to-blue-700 text-white font-bold ${textSizes[size]}`}>
                    {getInitials(name)}
                </AvatarFallback>
            </Avatar>

            {/* Upload overlay */}
            {showUploadButton && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 rounded-full p-0 bg-white text-gray-800 hover:bg-gray-100"
                        onClick={triggerFileUpload}
                        disabled={uploading}
                    >
                        {uploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Camera className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}; 