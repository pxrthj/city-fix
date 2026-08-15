import type { FC } from 'react';
import { Building2, LogIn, LogOut, PlusCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
    onOpenAuth: () => void;
    onOpenReport: () => void;
}

export const Navbar: FC<NavbarProps> = ({ onOpenAuth, onOpenReport }) => {
    const { user, signOut } = useAuth();

    return (
        <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-md backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

                {/* Brand Identity */}
                <div className="flex items-center space-x-3">
                    <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-600/30">
                        <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <span className="text-xl font-black tracking-tight text-white block leading-none">
                            CityFix
                        </span>
                        <span className="text-[10px] text-blue-400 font-semibold tracking-wider uppercase">
                            Civic Infrastructure Portal
                        </span>
                    </div>
                </div>

                {/* Actions & User State */}
                <div className="flex items-center space-x-3">
                    {/* Report Button */}
                    <button
                        onClick={onOpenReport}
                        className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer"
                    >
                        <PlusCircle className="w-4 h-4" />
                        <span className="hidden sm:inline">Report Issue</span>
                    </button>

                    {/* Conditional Auth Rendering */}
                    {user ? (
                        <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
                            <div className="hidden md:flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
                                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                <span className="text-xs font-medium text-slate-200">
                                    {user.email}
                                </span>
                            </div>
                            <button
                                onClick={signOut}
                                title="Sign Out"
                                className="p-2 bg-slate-800 hover:bg-red-600/20 hover:text-red-400 text-slate-300 rounded-xl transition-all border border-slate-700 hover:border-red-500/30 cursor-pointer"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={onOpenAuth}
                            className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all border border-slate-700 cursor-pointer active:scale-95"
                        >
                            <LogIn className="w-4 h-4" />
                            <span>Sign In</span>
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};