import React from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, LogOut, Shield, Wrench, User } from 'lucide-react';

interface NavbarProps {
    onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth }) => {
    const { user, profile, signOut } = useAuth();

    const getRoleBadge = () => {
        if (profile?.role === 'supervisor') {
            return (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md flex items-center gap-1 border border-purple-200">
                    <Shield className="w-3 h-3" /> Supervisor
                </span>
            );
        }
        if (profile?.role === 'field_worker') {
            return (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md flex items-center gap-1 border border-amber-200">
                    <Wrench className="w-3 h-3" /> Field Worker
                </span>
            );
        }
        return (
            <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md flex items-center gap-1">
                <User className="w-3 h-3" /> Citizen
            </span>
        );
    };

    return (
        <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md">
            <div className="max-w-md sm:max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-blue-600 rounded-xl text-white shadow-xs shadow-blue-600/30">
                        <AlertCircle className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-base font-extrabold tracking-tight text-slate-900">City<span className="text-blue-600">Fix</span></span>
                            {user && getRoleBadge()}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium leading-none mt-0.5">
                            {profile?.ward || 'Ward 14 (Bandra West)'}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {user ? (
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-semibold text-slate-600 hidden sm:inline">{profile?.full_name}</span>
                            <button
                                onClick={() => signOut()}
                                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
                                title="Sign Out"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={onOpenAuth}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
                        >
                            Sign In
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};