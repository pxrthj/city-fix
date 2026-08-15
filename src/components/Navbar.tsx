import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
    AlertCircle,
    LogOut,
    Shield,
    Wrench,
    User,
    Home,
    Ticket,
    PhoneCall,
    LayoutDashboard,
    Users
} from 'lucide-react';

export interface NavbarProps {
    onOpenAuth: () => void;
    activeTab: string;
    onTabChange: (tab: string) => void;
    onOpenReport: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
    onOpenAuth,
    activeTab,
    onTabChange,
    onOpenReport
}) => {
    const { user, profile, signOut } = useAuth();
    const role = profile?.role || 'citizen';

    const getRoleBadge = () => {
        if (role === 'supervisor') {
            return (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 px-2.5 py-0.5 rounded-lg flex items-center gap-1 border border-purple-200">
                    <Shield className="w-3 h-3" /> Supervisor
                </span>
            );
        }
        if (role === 'field_worker') {
            return (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-lg flex items-center gap-1 border border-amber-200">
                    <Wrench className="w-3 h-3" /> Field Worker
                </span>
            );
        }
        return (
            <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-lg flex items-center gap-1 border border-blue-100">
                <User className="w-3 h-3" /> Citizen
            </span>
        );
    };

    return (
        <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
            <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">

                {/* Brand & Identity */}
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-xl text-white shadow-sm shadow-blue-600/30">
                        <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-black tracking-tight text-slate-900">
                                City<span className="text-blue-600">Fix</span>
                            </span>
                            {user && getRoleBadge()}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                            {profile?.ward || 'Municipal Civic Portal'}
                        </div>
                    </div>
                </div>

                {/* Desktop Navigation Links */}
                {user && (
                    <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
                        {role === 'citizen' && (
                            <>
                                <button
                                    onClick={() => onTabChange('home')}
                                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === 'home' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                >
                                    <Home className="w-3.5 h-3.5" /> Home Feed
                                </button>
                                <button
                                    onClick={() => onTabChange('tickets')}
                                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === 'tickets' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                >
                                    <Ticket className="w-3.5 h-3.5" /> My Tickets
                                </button>
                                <button
                                    onClick={onOpenReport}
                                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-xs shadow-blue-600/30"
                                >
                                    + Report Issue
                                </button>
                            </>
                        )}

                        {role === 'field_worker' && (
                            <>
                                <button
                                    onClick={() => onTabChange('tasks')}
                                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === 'tasks' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                >
                                    <Wrench className="w-3.5 h-3.5" /> Dispatched Queue
                                </button>
                                <button
                                    onClick={() => onTabChange('supervisor')}
                                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === 'supervisor' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                >
                                    <PhoneCall className="w-3.5 h-3.5" /> Ward Desk
                                </button>
                            </>
                        )}

                        {role === 'supervisor' && (
                            <>
                                <button
                                    onClick={() => onTabChange('triage')}
                                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === 'triage' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                >
                                    <LayoutDashboard className="w-3.5 h-3.5" /> Ward Triage
                                </button>
                                <button
                                    onClick={() => onTabChange('crew')}
                                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === 'crew' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                >
                                    <Users className="w-3.5 h-3.5" /> Field Crew
                                </button>
                            </>
                        )}

                        <button
                            onClick={() => onTabChange('profile')}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === 'profile' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            <User className="w-3.5 h-3.5" /> Profile
                        </button>
                    </nav>
                )}

                {/* Auth / Profile Actions */}
                <div className="flex items-center gap-3">
                    {user ? (
                        <div className="flex items-center gap-3">
                            <div className="hidden sm:block text-right">
                                <div className="text-xs font-bold text-slate-900">{profile?.full_name}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{user.email}</div>
                            </div>
                            <button
                                onClick={() => signOut()}
                                className="flex items-center gap-1.5 py-1.5 px-3 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 rounded-xl text-xs font-bold transition"
                                title="Sign Out"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Sign Out</span>
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={onOpenAuth}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-sm shadow-blue-600/30 transition"
                        >
                            Sign In
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Navbar;