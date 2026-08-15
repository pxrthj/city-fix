import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type UserRole = 'citizen' | 'field_worker' | 'supervisor';

export const WARDS = [
    'Ward 14 (Bandra West)',
    'Ward 12 (Kurla / Chembur)',
    'Ward 9 (Dadar / Prabhadevi)',
    'Ward 7 (Andheri East)',
    'Ward 4 (Borivali West)',
    'Ward 1 (Colaba / Fort)',
] as const;

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
    signUp: (email: string, password: string, fullName: string, ward?: string) => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function determineRoleFromEmail(email: string): UserRole {
    const normalized = email.toLowerCase().trim();
    if (
        normalized.endsWith('@supervisor.ves.ac.in') ||
        normalized.endsWith('@supervisor.cityfix.in') ||
        normalized.startsWith('supervisor') ||
        normalized.includes('+supervisor@')
    ) {
        return 'supervisor';
    }
    if (
        normalized.endsWith('@ves.ac.in') ||
        normalized.endsWith('@worker.cityfix.in') ||
        normalized.startsWith('worker') ||
        normalized.includes('+worker@')
    ) {
        return 'field_worker';
    }
    return 'citizen';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    const syncProfile = async (authUser: User) => {
        const calculatedRole = determineRoleFromEmail(authUser.email || '');

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authUser.id)
                .single();

            if (error || !data) {
                const userWard = (authUser.user_metadata?.ward as string) || (calculatedRole === 'supervisor' ? 'Municipal HQ (All Wards)' : WARDS[0]);
                const newProfile: UserProfile = {
                    id: authUser.id,
                    full_name: (authUser.user_metadata?.full_name as string) || 'User',
                    phone: null,
                    ward: userWard,
                    role: calculatedRole,
                    department: calculatedRole === 'supervisor' ? 'Municipal Engineering' : calculatedRole === 'field_worker' ? 'Field Operations' : null,
                    badge_id: calculatedRole === 'field_worker' ? `FW-${authUser.id.slice(0, 4).toUpperCase()}` : null,
                };
                await supabase.from('profiles').upsert(newProfile);
                setProfile(newProfile);
            } else {
                if (data.role !== calculatedRole) {
                    await supabase.from('profiles').update({ role: calculatedRole }).eq('id', authUser.id);
                    setProfile({ ...(data as UserProfile), role: calculatedRole });
                } else {
                    setProfile(data as UserProfile);
                }
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
                syncProfile(session.user);
            }
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                syncProfile(session.user);
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

    const signUp = async (email: string, password: string, fullName: string, ward?: string) => {
        const role = determineRoleFromEmail(email);
        const assignedWard = role === 'supervisor' ? 'Municipal HQ (All Wards)' : (ward || WARDS[0]);

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName, role, ward: assignedWard } },
        });

        if (!error && data.user) {
            const newProfile: UserProfile = {
                id: data.user.id,
                full_name: fullName,
                phone: null,
                ward: assignedWard,
                role,
                department: role === 'supervisor' ? 'Municipal Engineering' : role === 'field_worker' ? 'Field Operations' : null,
                badge_id: role === 'field_worker' ? `FW-${data.user.id.slice(0, 4).toUpperCase()}` : null,
            };
            await supabase.from('profiles').upsert(newProfile);
            setProfile(newProfile);
        }

        return { error };
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setProfile(null);
    };

    return (
        <AuthContext.Provider value={{ user, profile, session, loading, signIn, signUp, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};