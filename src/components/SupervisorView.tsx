import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    Phone,
    UserCheck,
    Send,
    Loader2,
    X,
    MapPin,
    AlertTriangle,
    RotateCcw,
    Star,
    CheckCircle2
} from 'lucide-react';

const FALLBACK_WORKERS = [
    { id: '00000000-0000-0000-0000-000000000001', full_name: 'Suresh Shinde', department: 'Roads & Infrastructure', badge_id: 'FW-1042', phone: '+91 98201 12345' },
    { id: '00000000-0000-0000-0000-000000000002', full_name: 'Mahesh Patel', department: 'Sanitation & Solid Waste', badge_id: 'FW-1088', phone: '+91 98202 23456' },
    { id: '00000000-0000-0000-0000-000000000003', full_name: 'Vikram Jadhav', department: 'Electrical & Streetlights', badge_id: 'FW-1105', phone: '+91 98203 34567' },
];

export interface SupervisorViewProps {
    issues: any[];
    activeTab: string;
    onRefresh: () => void;
}

export const SupervisorView: React.FC<SupervisorViewProps> = ({ issues, activeTab, onRefresh }) => {
    const [filter, setFilter] = useState<'all' | 'unassigned' | 'disputed' | 'in_progress' | 'resolved'>('all');
    const [workers, setWorkers] = useState<any[]>(FALLBACK_WORKERS);
    const [assigningIssue, setAssigningIssue] = useState<any | null>(null);
    const [reopeningIssue, setReopeningIssue] = useState<any | null>(null);
    const [reopenNotes, setReopenNotes] = useState('');
    const [selectedWorkerId, setSelectedWorkerId] = useState<string>(FALLBACK_WORKERS[0].id);
    const [loadingAction, setLoadingAction] = useState(false);

    useEffect(() => {
        const fetchWorkers = async () => {
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'field_worker');
            if (data && data.length > 0) {
                setWorkers(data);
                setSelectedWorkerId(data[0].id);
            }
        };
        fetchWorkers();
    }, []);

    const unassignedCount = issues.filter(i => !i.assigned_worker_id && i.status !== 'resolved').length;
    const disputedCount = issues.filter(i => i.dispute_status === 'disputed').length;
    const inProgressCount = issues.filter(i => i.status === 'in_progress' || i.status === 'reopened' || (i.assigned_worker_id && i.status !== 'resolved')).length;
    const resolvedCount = issues.filter(i => i.status === 'resolved').length;

    const filteredIssues = issues.filter(issue => {
        if (filter === 'unassigned') return !issue.assigned_worker_id && issue.status !== 'resolved';
        if (filter === 'disputed') return issue.dispute_status === 'disputed';
        if (filter === 'in_progress') return issue.status === 'in_progress' || issue.status === 'reopened' || (issue.assigned_worker_id && issue.status !== 'resolved');
        if (filter === 'resolved') return issue.status === 'resolved';
        return true;
    });

    const handleAssignWorker = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!assigningIssue) return;

        setLoadingAction(true);
        const workerId = selectedWorkerId || workers[0].id;
        const worker = workers.find(w => w.id === workerId) || workers[0];

        try {
            await supabase
                .from('issues')
                .update({
                    assigned_worker_id: workerId,
                    status: 'assigned',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', assigningIssue.id);

            await supabase.from('issue_timeline').insert({
                issue_id: assigningIssue.id,
                status: 'assigned',
                message: `Dispatched to technician ${worker.full_name} (${worker.badge_id || 'FW'})`,
                actor_name: 'Ward Supervisor',
            });

            setAssigningIssue(null);
            onRefresh();
        } finally {
            setLoadingAction(false);
        }
    };

    const handleReopenIssue = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reopeningIssue || !reopenNotes.trim()) return;

        setLoadingAction(true);
        try {
            await supabase
                .from('issues')
                .update({
                    status: 'reopened',
                    dispute_status: 'reviewed',
                    supervisor_reopen_notes: reopenNotes.trim(),
                    updated_at: new Date().toISOString(),
                })
                .eq('id', reopeningIssue.id);

            await supabase.from('issue_timeline').insert({
                issue_id: reopeningIssue.id,
                status: 'reopened',
                message: `Supervisor rejected resolution and reopened work order: "${reopenNotes.trim()}"`,
                actor_name: 'Er. Rajesh Kadam (Supervisor)',
            });

            setReopeningIssue(null);
            setReopenNotes('');
            onRefresh();
        } finally {
            setLoadingAction(false);
        }
    };

    return (
        <div className="space-y-4">
            {activeTab === 'triage' && (
                <>
                    {/* Metrics */}
                    <div className="grid grid-cols-4 gap-2">
                        <div className="bg-white p-2.5 rounded-2xl border border-slate-200 text-center shadow-xs">
                            <div className="text-base sm:text-lg font-black text-rose-600">{unassignedCount}</div>
                            <div className="text-[9px] font-bold text-slate-500 uppercase">Unassigned</div>
                        </div>
                        <div className="bg-white p-2.5 rounded-2xl border border-amber-200 bg-amber-50/40 text-center shadow-xs">
                            <div className="text-base sm:text-lg font-black text-amber-700">{disputedCount}</div>
                            <div className="text-[9px] font-bold text-amber-800 uppercase">Disputed ⚠️</div>
                        </div>
                        <div className="bg-white p-2.5 rounded-2xl border border-slate-200 text-center shadow-xs">
                            <div className="text-base sm:text-lg font-black text-blue-600">{inProgressCount}</div>
                            <div className="text-[9px] font-bold text-slate-500 uppercase">In Action</div>
                        </div>
                        <div className="bg-white p-2.5 rounded-2xl border border-slate-200 text-center shadow-xs">
                            <div className="text-base sm:text-lg font-black text-emerald-600">{resolvedCount}</div>
                            <div className="text-[9px] font-bold text-slate-500 uppercase">Resolved</div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                        {(['all', 'disputed', 'unassigned', 'in_progress', 'resolved'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition border ${filter === f
                                        ? 'bg-slate-900 text-white border-slate-900'
                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                    }`}
                            >
                                {f === 'disputed' ? '⚠️ Disputed by Citizen' : f.replace('_', ' ')}
                            </button>
                        ))}
                    </div>

                    {/* Tickets */}
                    <div className="space-y-3">
                        {filteredIssues.length === 0 ? (
                            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
                                <p className="text-xs font-bold text-slate-500">No tickets found under this filter.</p>
                            </div>
                        ) : (
                            filteredIssues.map((issue) => {
                                const isDisputed = issue.dispute_status === 'disputed';
                                const isResolved = issue.status === 'resolved';

                                return (
                                    <div key={issue.id} className={`bg-white p-4 rounded-2xl border shadow-xs space-y-3 ${isDisputed ? 'border-rose-300 ring-1 ring-rose-200 bg-rose-50/20' : 'border-slate-200'
                                        }`}>

                                        {/* Header */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] font-bold uppercase bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md">
                                                    {issue.category}
                                                </span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${isResolved ? 'bg-emerald-50 text-emerald-700' : issue.status === 'reopened' ? 'bg-rose-100 text-rose-800 font-extrabold' : 'bg-amber-50 text-amber-700'
                                                    }`}>
                                                    {issue.status}
                                                </span>
                                                {isDisputed && (
                                                    <span className="text-[10px] font-extrabold bg-rose-600 text-white px-2 py-0.5 rounded-md flex items-center gap-1 animate-pulse">
                                                        <AlertTriangle className="w-3 h-3" /> Citizen Dissatisfied
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[11px] text-slate-400 font-medium">
                                                {new Date(issue.created_at).toLocaleDateString()}
                                            </span>
                                        </div>

                                        {/* Content */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Before (Citizen)</div>
                                                <img src={issue.image_url} alt="Before" className="w-full h-24 rounded-xl object-cover border border-slate-200" />
                                            </div>
                                            {issue.resolution_image_url ? (
                                                <div>
                                                    <div className="text-[10px] font-bold text-emerald-700 uppercase mb-1">After (Field Work)</div>
                                                    <img src={issue.resolution_image_url} alt="After" className="w-full h-24 rounded-xl object-cover border border-emerald-300" />
                                                </div>
                                            ) : (
                                                <div className="border border-dashed border-slate-200 rounded-xl flex items-center justify-center p-2 text-center text-[11px] text-slate-400">
                                                    Awaiting Field Work
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <h4 className="text-sm font-bold text-slate-900">{issue.title}</h4>
                                            <p className="text-xs text-slate-600 mt-0.5">{issue.description}</p>
                                        </div>

                                        {/* Citizen Dispute Feedback Callout */}
                                        {issue.dispute_reason && (
                                            <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-xl text-xs text-rose-900">
                                                <strong>Citizen Dispute Reason:</strong> {issue.dispute_reason}
                                            </div>
                                        )}

                                        {/* Citizen Star Rating */}
                                        {issue.rating && (
                                            <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 p-2 rounded-xl">
                                                <span className="font-bold">Citizen Score:</span>
                                                <div className="flex text-amber-500">
                                                    {[...Array(issue.rating)].map((_, i) => (
                                                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                                                    ))}
                                                </div>
                                                {issue.rating_feedback && <span className="text-slate-500 italic">"{issue.rating_feedback}"</span>}
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                                            <div className="text-xs text-slate-500 flex items-center gap-1">
                                                <MapPin className="w-3 h-3" /> {issue.ward}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {/* Supervisor Reopen Action */}
                                                {isResolved && (
                                                    <button
                                                        onClick={() => setReopeningIssue(issue)}
                                                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-1 border border-rose-200 transition"
                                                    >
                                                        <RotateCcw className="w-3 h-3" />
                                                        <span>Reject & Reopen</span>
                                                    </button>
                                                )}

                                                {!isResolved && (
                                                    <button
                                                        onClick={() => setAssigningIssue(issue)}
                                                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition active:scale-[0.98] shadow-xs shadow-blue-600/30"
                                                    >
                                                        <Send className="w-3 h-3" />
                                                        <span>{issue.assigned_worker_id ? 'Reassign' : 'Dispatch'}</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </>
            )}

            {activeTab === 'crew' && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Field Crew Roster (Ward 14)</h3>
                        <span className="text-xs font-bold text-slate-600">{workers.length} Technicians</span>
                    </div>

                    {workers.map((worker) => (
                        <div key={worker.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 font-black flex items-center justify-center text-sm border border-blue-100">
                                    {worker.badge_id?.replace('FW-', '') || 'FW'}
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-slate-900">{worker.full_name}</div>
                                    <div className="text-xs text-slate-500">{worker.department || 'Infrastructure Repair'}</div>
                                    <div className="text-[10px] text-emerald-600 font-bold mt-0.5">● Available for Dispatch</div>
                                </div>
                            </div>

                            <a
                                href={`tel:${worker.phone || '+919820112345'}`}
                                className="p-2.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 rounded-xl transition"
                                title="Call Technician"
                            >
                                <Phone className="w-4 h-4" />
                            </a>
                        </div>
                    ))}
                </div>
            )}

            {/* Dispatch Modal */}
            {assigningIssue && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs">
                    <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 space-y-4 animate-slide-up">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900">Dispatch Field Technician</h3>
                                <p className="text-xs text-slate-500">Ticket #{assigningIssue.id.slice(0, 8)}</p>
                            </div>
                            <button onClick={() => setAssigningIssue(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAssignWorker} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                    Select On-Duty Technician *
                                </label>
                                <select
                                    value={selectedWorkerId}
                                    onChange={(e) => setSelectedWorkerId(e.target.value)}
                                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20"
                                >
                                    {workers.map((w) => (
                                        <option key={w.id} value={w.id}>
                                            {w.full_name} ({w.department})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={loadingAction}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-blue-600/30"
                            >
                                {loadingAction && <Loader2 className="w-4 h-4 animate-spin" />}
                                <span>{loadingAction ? 'Dispatching Crew...' : 'Confirm Dispatch'}</span>
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Reject & Reopen Modal */}
            {reopeningIssue && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs">
                    <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 space-y-4 animate-slide-up">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                            <div>
                                <h3 className="text-base font-extrabold text-rose-700 flex items-center gap-1.5">
                                    <RotateCcw className="w-4 h-4" /> Reject Proof & Reopen Order
                                </h3>
                                <p className="text-xs text-slate-500">Ticket #{reopeningIssue.id.slice(0, 8)}</p>
                            </div>
                            <button onClick={() => setReopeningIssue(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleReopenIssue} className="space-y-3.5">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                    Supervisor Instructions for Field Crew *
                                </label>
                                <textarea
                                    required
                                    rows={3}
                                    value={reopenNotes}
                                    onChange={(e) => setReopenNotes(e.target.value)}
                                    placeholder="e.g., Pothole patch uneven and lacks steam-roll seal. Resurface immediately."
                                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loadingAction}
                                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-rose-600/30"
                            >
                                {loadingAction && <Loader2 className="w-4 h-4 animate-spin" />}
                                <span>{loadingAction ? 'Reopening Order...' : 'Reopen Work Order'}</span>
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupervisorView;