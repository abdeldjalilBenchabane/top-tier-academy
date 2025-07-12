import React, { createContext, useContext, useState, useEffect } from 'react';

interface AvatarContextType {
    avatarUrl: string | null;
    updateAvatar: (newAvatarUrl: string) => void;
    refreshAvatar: () => Promise<void>;
    loading: boolean;
}

const AvatarContext = createContext<AvatarContextType | undefined>(undefined);

export const useAvatar = () => {
    const context = useContext(AvatarContext);
    if (context === undefined) {
        throw new Error('useAvatar must be used within an AvatarProvider');
    }
    return context;
};

export const AvatarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUserAvatar = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }

            const response = await fetch('/api/users/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const userData = await response.json();
                setAvatarUrl(userData.avatar_url);
            }
        } catch (error) {
            console.error('Error fetching user avatar:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateAvatar = (newAvatarUrl: string) => {
        setAvatarUrl(newAvatarUrl);
        // Store in localStorage for persistence
        localStorage.setItem('userAvatar', newAvatarUrl);
    };

    const refreshAvatar = async () => {
        await fetchUserAvatar();
    };

    useEffect(() => {
        // Try to get from localStorage first
        const storedAvatar = localStorage.getItem('userAvatar');
        if (storedAvatar) {
            setAvatarUrl(storedAvatar);
        }

        // Then fetch from server
        fetchUserAvatar();
    }, []);

    const value: AvatarContextType = {
        avatarUrl,
        updateAvatar,
        refreshAvatar,
        loading
    };

    return (
        <AvatarContext.Provider value={value}>
            {children}
        </AvatarContext.Provider>
    );
}; 