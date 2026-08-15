import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import {
    MapPin,
    Navigation,
    Clock,
    CheckCircle2,
    Phone,
    Wrench,
    ShieldAlert,
    Loader2,
    AlertTriangle,
    Inbox
} from 'lucide-react';
import { ResolutionModal } from './ResolutionModal';

export interface WorkerViewProps {
    issues: any[];
    activeTab: string;
    onRefresh: () => void;
}

export const WorkerView: React.FC<WorkerViewProps> = ({ issues, activeTab, onRefresh }) => {
    const { user, profile } = useAuth();
    const [resolvingIssue, setResolvingIssue] = useState<any | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // STRICT RULE: Worker ONLY sees tickets specifically dispatched to them (assigned_worker_id === user.id)
    const workerIssues = issues.filter(
        i => i.assigned_worker_id === user?.id && i.status !== 'resolved' && i.status !== 'closed'
    );

    const handleStartJob = async (issueId: string) => {
        setActionLoading(issueId);
        try {
            const { error: updateErr } = await supabase
                .from('issues')
                .update({
                    status: 'in_progress',
                    updated_at: new Date().toISOString()
                })
                .eq('id', issueId);

            if (updateErr) throw new Error(updateErr.message);

            await supabase.from('issue_timeline').insert({
                issue_id: issueId,
                status: 'in_progress',
                message: 'Field technician has arrived on site and commenced repairs.',
                actor_name: profile?.full_name || 'Field Crew',
            });

            onRefresh();
        } catch (err: any) {
            alert(`Error starting job: ${err?.message || 'Database error'}`);
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
                    <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white p-5 rounded-3xl shadow-lg shadow-blue-600/20 border border-blue-500/30 flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-100">
                                <Wrench className="w-3.5 h-3.5 text-amber-300" /> Dispatched Work Orders
                            </div>
                            <h2 className="text-xl font-black mt-1 text-white">{workerIssues.length} Assigned Tasks</h2>
                            <p className="text-xs text-blue-100 mt-0.5">{profile?.ward || 'Ward Duty Area'}</p>
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-bold bg-white/20 text-white border border-white/30 backdrop-blur-xs px-3 py-1 rounded-full shadow-xs">
                                On Duty
                            </span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Your Dispatched Tasks</h3>
                            <button onClick={onRefresh} className="text-xs text-blue-600 font-bold">Refresh</button>
                        </div>

                        {workerIssues.length === 0 ? (
                            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 space-y-3">
                                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                                    <Inbox className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800">No Dispatched Work Orders</h4>
                                    <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                                        Unassigned tickets in <strong>{profile?.ward}</strong> must be dispatched to you by the Ward Supervisor before appearing here.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            workerIssues.map((issue) => {
                                const isReopened = issue.status === 'reopened';
                                const isCritical = issue.severity === 'Critical' || issue.severity === 'High';
                                const isInProgress = issue.status === 'in_progress';

                                return (
                                    <div
                                        key={issue.id}
                                        className={`bg-white rounded-2xl border p-4 shadow-xs transition space-y-3 ${isReopened ? 'border-rose-400 ring-2 ring-rose-200 bg-rose-50/15' : isCritical ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-1.5">
                                                {isReopened ? (
                                                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-rose-600 text-white flex items-center gap-1 animate-pulse">
                                                        <AlertTriangle className="w-3 h-3" /> Reopened by Supervisor
                                                    </span>
                                                ) : (
                                                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${isCritical ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                                                        }`}>
                                                        {issue.severity} Urgency
                                                    </span>
                                                )}
                                                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                                                    {issue.category}
                                                </span>
                                            </div>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isInProgress ? 'bg-amber-100 text-amber-800 animate-pulse' : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                {issue.status}
                                            </span>
                                        </div>

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
                                                    <span>{issue.ward}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {issue.supervisor_reopen_notes && (
                                            <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-xl text-xs text-rose-900">
                                                <strong>⚠️ Supervisor Rework Instructions:</strong> {issue.supervisor_reopen_notes}
                                            </div>
                                        )}

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
                                                    {actionLoading === issue.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
                                                    <span>{actionLoading === issue.id ? 'Starting...' : 'Start Repair'}</span>
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => setResolvingIssue(issue)}
                                                    className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition active:scale-[0.98] shadow-xs shadow-emerald-600/30"
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    <span>Submit Proof</span>
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
                            <div className="text-xs text-slate-600">Municipal Engineering HQ</div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2">
                            <a
                                href="tel:+912226400000"
                                className="py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm shadow-blue-600/30"
                            >
                                <Phone className="w-3.5 h-3.5" /> Call Supervisor
                            </a>
                            <button
                                onClick={() => alert('Delay notification logged to Ward Control Desk.')}
                                className="py-2.5 bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 hover:bg-rose-100"
                            >
                                <ShieldAlert className="w-3.5 h-3.5" /> Log Delay / SOS
                            </button>
                        </div>
                    </div>
                </div>
            )}

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