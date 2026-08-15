import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { ReportModal } from './components/ReportModal';
import { BottomNav } from './components/BottomNav';
import { WorkerView } from './components/WorkerView';
import { SupervisorView } from './components/SupervisorView';
import { useAuth } from './context/AuthContext';
import { supabase } from './lib/supabase';
import {
  Camera,
  Clock,
  CheckCircle2,
  MapPin,
  ChevronRight,
  Sparkles,
  Phone,
  Mail,
  Wrench,
  X,
  Star,
  AlertTriangle,
  Send,
  Loader2,
  Shield,
  UserCheck,
  Lock
} from 'lucide-react';

export default function App() {
  const { user, profile, loading } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [issues, setIssues] = useState<any[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<any | null>(null);

  // Citizen Rating & Dispute States
  const [ratingValue, setRatingValue] = useState<number>(5);
  const [ratingFeedback, setRatingFeedback] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [isDisputing, setIsDisputing] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const fetchIssues = async () => {
    const { data } = await supabase
      .from('issues')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) {
      setIssues(data);
      if (selectedIssue) {
        const updated = data.find(i => i.id === selectedIssue.id);
        if (updated) setSelectedIssue(updated);
      }
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  useEffect(() => {
    if (profile?.role === 'field_worker') setActiveTab('tasks');
    else if (profile?.role === 'supervisor') setActiveTab('triage');
    else setActiveTab('home');
  }, [profile?.role]);

  const handleOpenReport = () => {
    if (!user) {
      setAuthModalOpen(true);
    } else {
      setReportModalOpen(true);
    }
  };

  const handleSubmitRating = async (issueId: string) => {
    if (!user || user.id !== selectedIssue?.user_id) return;
    setSubmittingFeedback(true);

    try {
      await supabase
        .from('issues')
        .update({
          rating: ratingValue,
          rating_feedback: ratingFeedback.trim() || null,
        })
        .eq('id', issueId);

      await supabase.from('issue_timeline').insert({
        issue_id: issueId,
        status: 'resolved',
        message: `Citizen rated resolution ${ratingValue}★ ${ratingFeedback ? `("${ratingFeedback.trim()}")` : ''}`,
        actor_name: profile?.full_name || 'Citizen',
      });

      fetchIssues();
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleSubmitDispute = async (issueId: string) => {
    if (!user || user.id !== selectedIssue?.user_id || !disputeReason.trim()) return;
    setSubmittingFeedback(true);

    try {
      await supabase
        .from('issues')
        .update({
          dispute_status: 'disputed',
          dispute_reason: disputeReason.trim(),
        })
        .eq('id', issueId);

      await supabase.from('issue_timeline').insert({
        issue_id: issueId,
        status: 'disputed',
        message: `Citizen disputed repair: "${disputeReason.trim()}" (Escalated to Ward Supervisor)`,
        actor_name: profile?.full_name || 'Citizen',
      });

      setIsDisputing(false);
      setDisputeReason('');
      fetchIssues();
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const role = profile?.role || 'citizen';
  const isTicketAuthor = user && selectedIssue && user.id === selectedIssue.user_id;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans pb-24 md:pb-8">
      <Navbar
        onOpenAuth={() => setAuthModalOpen(true)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenReport={handleOpenReport}
      />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 pt-6 space-y-6">

        {/* FIELD WORKER */}
        {role === 'field_worker' && (
          <WorkerView
            issues={issues}
            activeTab={activeTab}
            onRefresh={fetchIssues}
          />
        )}

        {/* SUPERVISOR */}
        {role === 'supervisor' && (
          <SupervisorView
            issues={issues}
            activeTab={activeTab}
            onRefresh={fetchIssues}
          />
        )}

        {/* CITIZEN */}
        {role === 'citizen' && (
          <>
            {activeTab === 'home' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xl font-black text-slate-900">94.2%</div>
                      <div className="text-[11px] text-slate-500 font-semibold">Ward Fix Rate</div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xl font-black text-slate-900">18m</div>
                      <div className="text-[11px] text-slate-500 font-semibold">Avg Triage</div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
                    <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xl font-black text-slate-900">Ward 14</div>
                      <div className="text-[11px] text-slate-500 font-semibold">Bandra Division</div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
                    <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xl font-black text-slate-900">Live</div>
                      <div className="text-[11px] text-slate-500 font-semibold">Crews Active</div>
                    </div>
                  </div>
                </div>

                <div
                  onClick={handleOpenReport}
                  className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-6 rounded-3xl shadow-lg shadow-blue-600/25 cursor-pointer active:scale-[0.99] transition relative overflow-hidden flex items-center justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                      <Sparkles className="w-3 h-3" /> Live Municipal Dispatch
                    </div>
                    <h3 className="text-2xl font-extrabold">Report Civic Damage</h3>
                    <p className="text-xs text-blue-100 max-w-md">Snap a photo of roads, lighting, or sanitation issues. Routed directly to your ward maintenance crews.</p>
                  </div>
                  <div className="p-4 bg-white text-blue-600 rounded-2xl shadow-md hidden sm:flex items-center justify-center">
                    <Camera className="w-8 h-8" />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Recent Community Tickets</h4>
                    <button onClick={fetchIssues} className="text-xs text-blue-600 font-semibold hover:underline">Refresh Feed</button>
                  </div>

                  {issues.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                      <p className="text-sm font-semibold text-slate-500">No grievances filed yet.</p>
                      <button onClick={handleOpenReport} className="mt-3 text-xs font-bold text-blue-600 hover:underline">Be the first to report</button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {issues.map((issue) => (
                        <div
                          key={issue.id}
                          onClick={() => setSelectedIssue(issue)}
                          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3 cursor-pointer hover:border-blue-500/40 hover:shadow-md transition"
                        >
                          <img
                            src={issue.image_url || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=150'}
                            alt="Thumbnail"
                            className="w-16 h-16 rounded-xl object-cover border border-slate-100 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                                {issue.category}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${issue.status === 'resolved' ? 'bg-emerald-50 text-emerald-700' : issue.status === 'reopened' ? 'bg-rose-100 text-rose-800' : 'bg-amber-50 text-amber-700'
                                }`}>
                                {issue.status}
                              </span>
                              {issue.dispute_status === 'disputed' && (
                                <span className="text-[10px] font-bold bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded-md">
                                  In Review ⚠️
                                </span>
                              )}
                            </div>
                            <h5 className="text-sm font-bold text-slate-900 truncate mt-1">{issue.title}</h5>
                            <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                              <MapPin className="w-3 h-3" />
                              <span>{issue.ward || 'Ward 14'}</span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'tickets' && (
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-slate-900 px-1">My Submitted Tickets</h3>
                {issues.filter(i => i.user_id === user?.id).length === 0 ? (
                  <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-2">
                    <p className="text-sm font-semibold text-slate-500">You haven't submitted any complaints yet.</p>
                    <button onClick={handleOpenReport} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl">File First Ticket</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {issues.filter(i => i.user_id === user?.id).map((issue) => (
                      <div key={issue.id} onClick={() => setSelectedIssue(issue)} className="bg-white p-4 rounded-2xl border border-slate-200 cursor-pointer hover:border-blue-500/40 transition shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-blue-600">{issue.category}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${issue.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>{issue.status}</span>
                        </div>
                        <h4 className="font-bold text-slate-900 mt-1">{issue.title}</h4>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{issue.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* PROFILE */}
        {activeTab === 'profile' && (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs max-w-xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-2xl mx-auto border-2 border-blue-200">
                {profile?.full_name?.charAt(0) || 'U'}
              </div>
              <h3 className="text-xl font-bold text-slate-900">{profile?.full_name}</h3>
              <p className="text-xs text-slate-500 font-mono">{user?.email || 'Authenticated User'}</p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex justify-between py-3 border-b border-slate-100 text-sm">
                <span className="text-slate-500 font-medium">Registered Jurisdiction</span>
                <span className="font-bold text-slate-800">{profile?.ward}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-slate-100 text-sm">
                <span className="text-slate-500 font-medium">Assigned System Role</span>
                <span className="font-bold text-blue-600 capitalize">{role.replace('_', ' ')}</span>
              </div>
              {profile?.badge_id && (
                <div className="flex justify-between py-3 border-b border-slate-100 text-sm">
                  <span className="text-slate-500 font-medium">Technician Badge</span>
                  <span className="font-mono font-bold text-slate-800">{profile.badge_id}</span>
                </div>
              )}
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-500 leading-relaxed">
              <strong>Account Security Notice:</strong> System roles and duty jurisdictions are strictly derived from authenticated municipal domain email accounts. Contact Ward HQ for credentials updates.
            </div>
          </div>
        )}
      </main>

      {/* Ticket Detail Modal (With Author-Only Rating Guard) */}
      {selectedIssue && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md">Ticket Detail</span>
                <h3 className="text-lg font-extrabold text-slate-900 mt-1">{selectedIssue.title}</h3>
              </div>
              <button onClick={() => setSelectedIssue(null)} className="p-2 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <img src={selectedIssue.image_url} alt="Evidence" className="w-full h-48 rounded-2xl object-cover border border-slate-200" />

            {selectedIssue.resolution_image_url && (
              <div className="space-y-1.5">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-700">Proof of Fix ("AFTER" Photo)</div>
                <img src={selectedIssue.resolution_image_url} alt="Resolution" className="w-full h-48 rounded-2xl object-cover border border-emerald-300" />
                {selectedIssue.resolution_notes && (
                  <p className="text-xs text-slate-600 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                    <strong>Technician Note:</strong> {selectedIssue.resolution_notes}
                  </p>
                )}
              </div>
            )}

            {/* AUTHOR-ONLY RATING & DISPUTE SECTION */}
            {selectedIssue.status === 'resolved' && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Resolution Quality Feedback</span>
                  {selectedIssue.dispute_status === 'disputed' && (
                    <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-md">
                      ⚠️ Dispute Under Review
                    </span>
                  )}
                </div>

                {/* Case 1: Already Rated */}
                {selectedIssue.rating ? (
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <span>Citizen Rating:</span>
                    <div className="flex text-amber-500">
                      {[...Array(selectedIssue.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400" />
                      ))}
                    </div>
                    {selectedIssue.rating_feedback && <span className="italic text-slate-500">"{selectedIssue.rating_feedback}"</span>}
                  </div>
                ) : isTicketAuthor ? (
                  /* Case 2: Unrated AND Logged-in Ticket Author */
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRatingValue(star)}
                          className="p-1 text-slate-300 hover:text-amber-400 focus:outline-none"
                        >
                          <Star className={`w-6 h-6 ${star <= ratingValue ? 'fill-amber-400 text-amber-400' : ''}`} />
                        </button>
                      ))}
                      <span className="text-xs font-bold text-slate-700 ml-2">{ratingValue} of 5 Stars</span>
                    </div>

                    <input
                      type="text"
                      value={ratingFeedback}
                      onChange={(e) => setRatingFeedback(e.target.value)}
                      placeholder="Optional feedback on repair quality..."
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                    />

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSubmitRating(selectedIssue.id)}
                        disabled={submittingFeedback}
                        className="flex-1 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5"
                      >
                        {submittingFeedback ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        <span>Submit Feedback</span>
                      </button>

                      <button
                        onClick={() => setIsDisputing(!isDisputing)}
                        className="py-2 px-3 bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl hover:bg-rose-100"
                      >
                        Dispute Fix
                      </button>
                    </div>

                    {isDisputing && (
                      <div className="pt-2 space-y-2 border-t border-slate-200">
                        <label className="block text-[11px] font-bold text-rose-800 uppercase">Why is this fix unsatisfactory? *</label>
                        <textarea
                          rows={2}
                          value={disputeReason}
                          onChange={(e) => setDisputeReason(e.target.value)}
                          placeholder="Describe remaining damage or defects..."
                          className="w-full px-3 py-2 text-xs bg-white border border-rose-300 rounded-xl resize-none"
                        />
                        <button
                          onClick={() => handleSubmitDispute(selectedIssue.id)}
                          disabled={submittingFeedback || !disputeReason.trim()}
                          className="w-full py-2 bg-rose-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Escalate to Supervisor</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Case 3: Public / Non-Author Viewer */
                  <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>
                      {user
                        ? 'Only the resident citizen who reported this grievance can submit a quality rating.'
                        : 'Sign in with the reporting citizen account to rate or dispute this completed repair.'}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Citizen Description</div>
              <p className="text-sm text-slate-700">{selectedIssue.description}</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">Designated Ward Supervisor</span>
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">Er. Rajesh Kadam</div>
                <div className="text-xs text-slate-500">Municipal Executive Engineer</div>
              </div>
              <div className="flex gap-2 pt-1">
                <a href="tel:+912226400000" className="flex-1 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 flex items-center justify-center gap-1.5 transition">
                  <Phone className="w-3.5 h-3.5 text-blue-600" />
                  <span>Call Desk</span>
                </a>
                <a href="mailto:ward14@cityfix.gov.in" className="flex-1 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 flex items-center justify-center gap-1.5 transition">
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  <span>Official Email</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="md:hidden">
        <BottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onOpenReport={handleOpenReport}
          role={role}
        />
      </div>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      <ReportModal isOpen={reportModalOpen} onClose={() => setReportModalOpen(false)} onSuccess={fetchIssues} />
    </div>
  );
}