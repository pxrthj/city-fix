import React from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, LogOut, Shield } from 'lucide-react';

interface NavbarProps {
    onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth }) => {
    const { user, profile, signOut, switchDemoRole } = useAuth();

    return (
        <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md">
            <div className="max-w-md sm:max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-blue-600 rounded-xl text-white shadow-sm shadow-blue-600/30">
                        <AlertCircle className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-base font-extrabold tracking-tight text-slate-900">City<span className="text-blue-600">Fix</span></span>
                            {profile?.role !== 'citizen' && (
                                <span className="text-[9px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                    <Shield className="w-2.5 h-2.5" />
                                    {profile?.role?.replace('_', ' ')}
                                </span>
                            )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium leading-none mt-0.5">
                            {profile?.ward || 'Ward 14 (Bandra West)'}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {user ? (
                        <div className="flex items-center gap-2">
                            <select
                                value={profile?.role || 'citizen'}
                                onChange={(e) => switchDemoRole(e.target.value as any)}
                                className="text-[11px] font-bold bg-slate-100 text-slate-700 border-none rounded-lg px-2 py-1 outline-none cursor-pointer"
                                title="Switch Persona Role"
                            >
                                <option value="citizen">Citizen</option>
                                <option value="field_worker">Field Worker</option>
                                <option value="supervisor">Supervisor</option>
                            </select>

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
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
                        >
                            Sign In
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};