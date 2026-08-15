import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import {
    MapPin,
    Navigation,
    Clock,
    CheckCircle2,
    Phone,
    Wrench,
    ShieldAlert
} from 'lucide-react';
import { ResolutionModal } from './ResolutionModal';

export interface WorkerViewProps {
    issues: any[];
    activeTab: string;
    onRefresh: () => void;
}

export const WorkerView: React.FC<WorkerViewProps> = ({ issues, activeTab, onRefresh }) => {
    const [resolvingIssue, setResolvingIssue] = useState<any | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Unresolved tasks for field queue
    const workerIssues = issues.filter(i => i.status !== 'resolved' && i.status !== 'closed');

    const handleStartJob = async (issueId: string) => {
        setActionLoading(issueId);
        try {
            await supabase
                .from('issues')
                .update({ status: 'in_progress', updated_at: new Date().toISOString() })
                .eq('id', issueId);

            await supabase.from('issue_timeline').insert({
                issue_id: issueId,
                status: 'in_progress',
                message: 'Field technician has arrived on site and started repair work.',
                actor_name: 'Field Crew',
            });

            onRefresh();
        } finally {
            setActionLoading(null);
        }
    };

    const handleOpenGoogleMaps = (lat: number, lng: number) => {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        window.open(url, '_blank');
    };

    return (
        <div className="space-y-4">
            {activeTab === 'tasks' && (
                <>
                    {/* Worker Status Banner */}
                    <div className="bg-slate-900 text-white p-4 rounded-3xl shadow-lg border border-slate-800 flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                                <Wrench className="w-3 h-3" /> Assigned Field Queue
                            </div>
                            <h2 className="text-xl font-black mt-0.5">{workerIssues.length} Active Work Orders</h2>
                            <p className="text-xs text-slate-400">Ward 14 • Bandra West Division</p>
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                                On Duty
                            </span>
                        </div>
                    </div>

                    {/* Task Queue Cards */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Priority Dispatch Queue</h3>
                            <button onClick={onRefresh} className="text-xs text-blue-600 font-bold">Refresh</button>
                        </div>

                        {workerIssues.length === 0 ? (
                            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 space-y-2">
                                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                                <h4 className="font-bold text-slate-800">All Field Tasks Cleared</h4>
                                <p className="text-xs text-slate-500">No pending repairs assigned to your shift right now.</p>
                            </div>
                        ) : (
                            workerIssues.map((issue) => {
                                const isCritical = issue.severity === 'Critical' || issue.severity === 'High';
                                const isInProgress = issue.status === 'in_progress';

                                return (
                                    <div
                                        key={issue.id}
                                        className={`bg-white rounded-2xl border p-4 shadow-xs transition space-y-3 ${isCritical ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200'
                                            }`}
                                    >
                                        {/* Urgency & Category */}
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${isCritical ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                                                    }`}>
                                                    {issue.severity} Urgency
                                                </span>
                                                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                                                    {issue.category}
                                                </span>
                                            </div>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isInProgress ? 'bg-amber-100 text-amber-800 animate-pulse' : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                {issue.status}
                                            </span>
                                        </div>

                                        {/* Site Details */}
                                        <div className="flex gap-3 items-center">
                                            <img
                                                src={issue.image_url}
                                                alt="Incident Site"
                                                className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <h4 className="text-sm font-extrabold text-slate-900 truncate">{issue.title}</h4>
                                                <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{issue.description}</p>
                                                <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
                                                    <MapPin className="w-3 h-3 text-slate-400" />
                                                    <span>{issue.ward || 'Ward 14'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Quick Routing & Action Buttons */}
                                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                                            <button
                                                onClick={() => handleOpenGoogleMaps(issue.latitude || 19.0760, issue.longitude || 72.8777)}
                                                className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition active:scale-[0.98]"
                                            >
                                                <Navigation className="w-3.5 h-3.5 text-blue-600" />
                                                <span>Google Maps</span>
                                            </button>

                                            {!isInProgress ? (
                                                <button
                                                    onClick={() => handleStartJob(issue.id)}
                                                    disabled={actionLoading === issue.id}
                                                    className="py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition active:scale-[0.98]"
                                                >
                                                    <Clock className="w-3.5 h-3.5" />
                                                    <span>{actionLoading === issue.id ? 'Starting...' : 'Start Job'}</span>
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => setResolvingIssue(issue)}
                                                    className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition active:scale-[0.98] shadow-xs shadow-emerald-600/30"
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    <span>Resolve Issue</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </>
            )}

            {activeTab === 'supervisor' && (
                <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-5">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 text-blue-700 rounded-2xl">
                            <Phone className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-base font-extrabold text-slate-900">Ward Dispatch Control</h3>
                            <p className="text-xs text-slate-500">Direct supervisor escalation hotline</p>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                        <div>
                            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Executive Supervisor</div>
                            <div className="text-sm font-extrabold text-slate-900 mt-0.5">Er. Rajesh Kadam</div>
                            <div className="text-xs text-slate-600">Ward 14 (Bandra West) • Municipal Engineering HQ</div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2">
                            <a
                                href="tel:+912226400000"
                                className="py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm shadow-blue-600/30"
                            >
                                <Phone className="w-3.5 h-3.5" /> Call Supervisor
                            </a>
                            <button
                                onClick={() => alert('SOS Delay notification logged and sent to Ward 14 Control Room.')}
                                className="py-2.5 bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 hover:bg-rose-100"
                            >
                                <ShieldAlert className="w-3.5 h-3.5" /> Trigger Delay Alert
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">On-Ground Incident Logging</div>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => alert('Material Shortage notice logged for your assigned ward.')}
                                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left text-xs font-bold text-slate-700"
                            >
                                ⚠️ Asphalt / Material Shortage
                            </button>
                            <button
                                onClick={() => alert('Traffic / Police Diversion delay logged.')}
                                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left text-xs font-bold text-slate-700"
                            >
                                🚧 Police Roadblock / Traffic
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Resolution Proof-of-Work Modal */}
            {resolvingIssue && (
                <ResolutionModal
                    issue={resolvingIssue}
                    isOpen={Boolean(resolvingIssue)}
                    onClose={() => setResolvingIssue(null)}
                    onSuccess={onRefresh}
                />
            )}
        </div>
    );
};

export default WorkerView;