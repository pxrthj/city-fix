import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    Phone,
    UserCheck,
    Send,
    Loader2,
    X,
    MapPin
} from 'lucide-react';

export interface SupervisorViewProps {
    issues: any[];
    activeTab: string;
    onRefresh: () => void;
}

export const SupervisorView: React.FC<SupervisorViewProps> = ({ issues, activeTab, onRefresh }) => {
    const [filter, setFilter] = useState<'all' | 'unassigned' | 'in_progress' | 'resolved'>('all');
    const [workers, setWorkers] = useState<any[]>([]);
    const [assigningIssue, setAssigningIssue] = useState<any | null>(null);
    const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
    const [assignLoading, setAssignLoading] = useState(false);

    // Fetch field crew profiles
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
    const inProgressCount = issues.filter(i => i.status === 'in_progress' || (i.assigned_worker_id && i.status !== 'resolved')).length;
    const resolvedCount = issues.filter(i => i.status === 'resolved').length;

    const filteredIssues = issues.filter(issue => {
        if (filter === 'unassigned') return !issue.assigned_worker_id && issue.status !== 'resolved';
        if (filter === 'in_progress') return issue.status === 'in_progress' || (issue.assigned_worker_id && issue.status !== 'resolved');
        if (filter === 'resolved') return issue.status === 'resolved';
        return true;
    });

    const handleAssignWorker = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!assigningIssue || !selectedWorkerId) return;

        setAssignLoading(true);
        const worker = workers.find(w => w.id === selectedWorkerId);

        try {
            await supabase
                .from('issues')
                .update({
                    assigned_worker_id: selectedWorkerId,
                    status: 'assigned',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', assigningIssue.id);

            await supabase.from('issue_timeline').insert({
                issue_id: assigningIssue.id,
                status: 'assigned',
                message: `Dispatched to technician ${worker?.full_name || 'Worker'} (${worker?.badge_id || 'FW'})`,
                actor_name: 'Ward Supervisor',
            });

            setAssigningIssue(null);
            onRefresh();
        } finally {
            setAssignLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            {activeTab === 'triage' && (
                <>
                    {/* Triage Status Metrics */}
                    <div className="grid grid-cols-3 gap-2">
                        <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center shadow-xs">
                            <div className="text-lg font-black text-rose-600">{unassignedCount}</div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase">Unassigned</div>
                        </div>
                        <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center shadow-xs">
                            <div className="text-lg font-black text-amber-600">{inProgressCount}</div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase">In Progress</div>
                        </div>
                        <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center shadow-xs">
                            <div className="text-lg font-black text-emerald-600">{resolvedCount}</div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase">Resolved</div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                        {(['all', 'unassigned', 'in_progress', 'resolved'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition border ${filter === f
                                        ? 'bg-slate-900 text-white border-slate-900'
                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                    }`}
                            >
                                {f.replace('_', ' ')}
                            </button>
                        ))}
                    </div>

                    {/* Triage Ticket Feed */}
                    <div className="space-y-3">
                        {filteredIssues.length === 0 ? (
                            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
                                <p className="text-xs font-bold text-slate-500">No tickets found for this filter.</p>
                            </div>
                        ) : (
                            filteredIssues.map((issue) => {
                                const isAssigned = Boolean(issue.assigned_worker_id);
                                return (
                                    <div key={issue.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold uppercase bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md">
                                                    {issue.category}
                                                </span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${issue.status === 'resolved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                                    }`}>
                                                    {issue.status}
                                                </span>
                                            </div>
                                            <span className="text-[11px] text-slate-400 font-medium">
                                                {new Date(issue.created_at).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <div className="flex gap-3 items-center">
                                            <img
                                                src={issue.image_url}
                                                alt="Evidence"
                                                className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <h4 className="text-sm font-bold text-slate-900 truncate">{issue.title}</h4>
                                                <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{issue.description}</p>
                                                <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
                                                    <MapPin className="w-3 h-3" />
                                                    <span>{issue.ward}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Dispatch Workflow */}
                                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                            <div className="text-xs font-medium text-slate-600">
                                                {isAssigned ? (
                                                    <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                                                        <UserCheck className="w-3.5 h-3.5" /> Crew Dispatched
                                                    </span>
                                                ) : (
                                                    <span className="text-rose-600 font-bold">● Awaiting Crew Dispatch</span>
                                                )}
                                            </div>

                                            {issue.status !== 'resolved' && (
                                                <button
                                                    onClick={() => setAssigningIssue(issue)}
                                                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition active:scale-[0.98] shadow-xs shadow-blue-600/30"
                                                >
                                                    <Send className="w-3 h-3" />
                                                    <span>{isAssigned ? 'Reassign' : 'Dispatch'}</span>
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

            {/* Assignment Modal */}
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

                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600">
                                Assigning this ticket updates status to <strong>assigned</strong> and routes it to the technician's active field queue.
                            </div>

                            <button
                                type="submit"
                                disabled={assignLoading}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-blue-600/30"
                            >
                                {assignLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                <span>{assignLoading ? 'Dispatching Crew...' : 'Confirm Dispatch'}</span>
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupervisorView;