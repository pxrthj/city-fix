import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type UserRole = 'citizen' | 'field_worker' | 'supervisor';

export interface UserProfile {
    id: string;
    full_name: string;
    phone: string | null;
    ward: string;
    role: UserRole;
    department?: string | null;
    badge_id?: string | null;
    supervisor_id?: string | null;
}

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    session: Session | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signUp: (email: string, password: string, fullName: string, role?: UserRole) => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
    switchDemoRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (userId: string, userMeta?: Record<string, unknown>) => {
        try {
            const savedRole = (localStorage.getItem('cityfix_demo_role') as UserRole) || null;

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error || !data) {
                const fallbackProfile: UserProfile = {
                    id: userId,
                    full_name: (userMeta?.full_name as string) || 'Citizen User',
                    phone: null,
                    ward: 'Ward 14 (Bandra West)',
                    role: savedRole || ((userMeta?.role as string) as UserRole) || 'citizen',
                };
                await supabase.from('profiles').upsert(fallbackProfile);
                setProfile(fallbackProfile);
            } else {
                setProfile({
                    ...(data as UserProfile),
                    role: savedRole || (data.role as UserRole) || 'citizen',
                });
            }
        } catch {
            setProfile(null);
        }
    };

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id, session.user.user_metadata);
            }
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id, session.user.user_metadata);
            } else {
                setProfile(null);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error };
    };

    const signUp = async (email: string, password: string, fullName: string, role: UserRole = 'citizen') => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName, role } },
        });

        if (!error && data.user) {
            const newProfile: UserProfile = {
                id: data.user.id,
                full_name: fullName,
                phone: null,
                ward: 'Ward 14 (Bandra West)',
                role,
            };
            await supabase.from('profiles').insert(newProfile);
            localStorage.setItem('cityfix_demo_role', role);
            setProfile(newProfile);
        }

        return { error };
    };

    const signOut = async () => {
        localStorage.removeItem('cityfix_demo_role');
        await supabase.auth.signOut();
        setProfile(null);
    };

    const switchDemoRole = async (role: UserRole) => {
        localStorage.setItem('cityfix_demo_role', role);
        if (profile) {
            setProfile({ ...profile, role });
        }
        if (user) {
            await supabase.from('profiles').update({ role }).eq('id', user.id);
        }
    };

    return (
        <AuthContext.Provider value={{ user, profile, session, loading, signIn, signUp, signOut, switchDemoRole }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};