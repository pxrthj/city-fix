import React from 'react';
import { Home, PlusCircle, Ticket, User, Wrench, PhoneCall, LayoutDashboard, Users } from 'lucide-react';
import type { UserRole } from '../context/AuthContext';

export interface BottomNavProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    onOpenReport: () => void;
    role: UserRole;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, onOpenReport, role }) => {
    // 1. Field Worker Persona Navigation
    if (role === 'field_worker') {
        return (
            <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2">
                <div className="max-w-md mx-auto grid grid-cols-3 gap-1">
                    <button
                        onClick={() => onTabChange('tasks')}
                        className={`flex flex-col items-center py-1 transition ${activeTab === 'tasks' ? 'text-blue-600 font-bold' : 'text-slate-400'}`}
                    >
                        <Wrench className="w-5 h-5" />
                        <span className="text-[10px] mt-0.5">Task Queue</span>
                    </button>

                    <button
                        onClick={() => onTabChange('supervisor')}
                        className={`flex flex-col items-center py-1 transition ${activeTab === 'supervisor' ? 'text-blue-600 font-bold' : 'text-slate-400'}`}
                    >
                        <PhoneCall className="w-5 h-5" />
                        <span className="text-[10px] mt-0.5">Supervisor Desk</span>
                    </button>

                    <button
                        onClick={() => onTabChange('profile')}
                        className={`flex flex-col items-center py-1 transition ${activeTab === 'profile' ? 'text-blue-600 font-bold' : 'text-slate-400'}`}
                    >
                        <User className="w-5 h-5" />
                        <span className="text-[10px] mt-0.5">Profile</span>
                    </button>
                </div>
            </nav>
        );
    }

    // 2. Supervisor Persona Navigation
    if (role === 'supervisor') {
        return (
            <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2">
                <div className="max-w-md mx-auto grid grid-cols-3 gap-1">
                    <button
                        onClick={() => onTabChange('triage')}
                        className={`flex flex-col items-center py-1 transition ${activeTab === 'triage' ? 'text-blue-600 font-bold' : 'text-slate-400'}`}
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        <span className="text-[10px] mt-0.5">Ward Triage</span>
                    </button>

                    <button
                        onClick={() => onTabChange('crew')}
                        className={`flex flex-col items-center py-1 transition ${activeTab === 'crew' ? 'text-blue-600 font-bold' : 'text-slate-400'}`}
                    >
                        <Users className="w-5 h-5" />
                        <span className="text-[10px] mt-0.5">Field Crew</span>
                    </button>

                    <button
                        onClick={() => onTabChange('profile')}
                        className={`flex flex-col items-center py-1 transition ${activeTab === 'profile' ? 'text-blue-600 font-bold' : 'text-slate-400'}`}
                    >
                        <User className="w-5 h-5" />
                        <span className="text-[10px] mt-0.5">Profile</span>
                    </button>
                </div>
            </nav>
        );
    }

    // 3. Citizen Persona Navigation (Default)
    return (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2">
            <div className="max-w-md mx-auto grid grid-cols-4 gap-1 items-center">
                <button
                    onClick={() => onTabChange('home')}
                    className={`flex flex-col items-center py-1 transition ${activeTab === 'home' ? 'text-blue-600 font-bold' : 'text-slate-400'}`}
                >
                    <Home className="w-5 h-5" />
                    <span className="text-[10px] mt-0.5">Home</span>
                </button>

                <button
                    onClick={() => onTabChange('tickets')}
                    className={`flex flex-col items-center py-1 transition ${activeTab === 'tickets' ? 'text-blue-600 font-bold' : 'text-slate-400'}`}
                >
                    <Ticket className="w-5 h-5" />
                    <span className="text-[10px] mt-0.5">My Tickets</span>
                </button>

                <button
                    onClick={onOpenReport}
                    className="flex flex-col items-center -mt-4"
                >
                    <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/40 active:scale-95 transition">
                        <PlusCircle className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] mt-1 text-slate-700 font-bold">Report</span>
                </button>

                <button
                    onClick={() => onTabChange('profile')}
                    className={`flex flex-col items-center py-1 transition ${activeTab === 'profile' ? 'text-blue-600 font-bold' : 'text-slate-400'}`}
                >
                    <User className="w-5 h-5" />
                    <span className="text-[10px] mt-0.5">Profile</span>
                </button>
            </div>
        </nav>
    );
};

export default BottomNav;