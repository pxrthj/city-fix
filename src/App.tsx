import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { ReportModal } from './components/ReportModal';
import { BottomNav } from './components/BottomNav';
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
  Wrench
} from 'lucide-react';

export default function App() {
  const { user, profile, loading } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [issues, setIssues] = useState<any[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<any | null>(null);

  const fetchIssues = async () => {
    const { data } = await supabase
      .from('issues')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setIssues(data);
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  const handleOpenReport = () => {
    if (!user) {
      setAuthModalOpen(true);
    } else {
      setReportModalOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans pb-24">
      <Navbar onOpenAuth={() => setAuthModalOpen(true)} />

      <main className="flex-1 max-w-md sm:max-w-2xl mx-auto w-full px-4 pt-4 space-y-4">
        {activeTab === 'home' && (
          <>
            <div className="grid grid-cols-2 gap-3">
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
            </div>

            <div
              onClick={handleOpenReport}
              className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-5 rounded-3xl shadow-lg shadow-blue-600/25 cursor-pointer active:scale-[0.99] transition relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-28 h-28 bg-white/10 rounded-full blur-xl" />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                    <Sparkles className="w-3 h-3" /> Live Dispatch
                  </div>
                  <h3 className="text-xl font-extrabold">Report Civic Damage</h3>
                  <p className="text-xs text-blue-100 max-w-[220px]">Snap a photo & let AI route directly to municipal repair crews.</p>
                </div>
                <div className="p-3 bg-white text-blue-600 rounded-2xl shadow-md">
                  <Camera className="w-7 h-7" />
                </div>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Recent Community Tickets</h4>
                <button onClick={fetchIssues} className="text-xs text-blue-600 font-semibold">Refresh</button>
              </div>

              {issues.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
                  <p className="text-sm font-semibold text-slate-500">No grievances filed yet in this ward.</p>
                  <button onClick={handleOpenReport} className="mt-3 text-xs font-bold text-blue-600">Be the first to report</button>
                </div>
              ) : (
                issues.map((issue) => (
                  <div
                    key={issue.id}
                    onClick={() => setSelectedIssue(issue)}
                    className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3 cursor-pointer hover:border-blue-500/40 transition"
                  >
                    <img
                      src={issue.image_url || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=150'}
                      alt="Thumbnail"
                      className="w-14 h-14 rounded-xl object-cover border border-slate-100 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md">
                          {issue.category}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${issue.status === 'resolved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                          {issue.status}
                        </span>
                      </div>
                      <h5 className="text-sm font-bold text-slate-900 truncate mt-1">{issue.title}</h5>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        <span>{issue.ward || 'Ward 14'}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {activeTab === 'tickets' && (
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900 px-1">My Submitted Tickets</h3>
            {issues.filter(i => i.user_id === user?.id).length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 space-y-2">
                <p className="text-sm font-semibold text-slate-500">You haven't submitted any complaints yet.</p>
                <button onClick={handleOpenReport} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl">File First Ticket</button>
              </div>
            ) : (
              issues.filter(i => i.user_id === user?.id).map((issue) => (
                <div key={issue.id} onClick={() => setSelectedIssue(issue)} className="bg-white p-4 rounded-2xl border border-slate-200 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-600">{issue.category}</span>
                    <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">{issue.status}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 mt-1">{issue.title}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{issue.description}</p>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div className="text-center space-y-2">
              <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-2xl mx-auto">
                {profile?.full_name?.charAt(0) || 'C'}
              </div>
              <h3 className="text-lg font-bold text-slate-900">{profile?.full_name}</h3>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex justify-between py-2.5 border-b border-slate-100 text-sm">
                <span className="text-slate-500 font-medium">Registered Ward</span>
                <span className="font-bold text-slate-800">{profile?.ward}</span>
              </div>
              <div className="flex justify-between py-2.5 border-b border-slate-100 text-sm">
                <span className="text-slate-500 font-medium">System Role</span>
                <span className="font-bold text-blue-600 capitalize">{profile?.role?.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {selectedIssue && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm">
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
                <div className="text-xs text-slate-500">Ward 14 Executive Engineer (Roads & Infra)</div>
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

      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenReport={handleOpenReport}
        role={profile?.role || 'citizen'}
      />

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      <ReportModal isOpen={reportModalOpen} onClose={() => setReportModalOpen(false)} onSuccess={fetchIssues} />
    </div>
  );
}