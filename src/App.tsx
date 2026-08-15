import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ReportModal } from './components/ReportModal';
import { BottomNav } from './components/BottomNav';
import { WorkerView } from './components/WorkerView';
import { SupervisorView } from './components/SupervisorView';
import { useAuth, WARDS, determineRoleFromEmail } from './context/AuthContext';
import { supabase } from './lib/supabase';
import {
  Camera,
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
  Lock,
  Edit3,
  Check,
  AlertCircle,
  KeyRound,
  User,
  Building2
} from 'lucide-react';

export default function App() {
  const {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    sendEmailOtp,
    verifyEmailOtp,
    updateProfile
  } = useAuth();

  // App Dashboard States
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [issues, setIssues] = useState<any[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<any | null>(null);

  // Profile Edit States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editWard, setEditWard] = useState<string>(WARDS[0]);
  const [savingProfile, setSavingProfile] = useState(false);

  // Citizen Rating & Dispute States
  const [ratingValue, setRatingValue] = useState<number>(5);
  const [ratingFeedback, setRatingFeedback] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [isDisputing, setIsDisputing] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Auth Screen States
  const [authMode, setAuthMode] = useState<'password' | 'otp'>('password');
  const [isSignUp, setIsSignUp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authOtpCode, setAuthOtpCode] = useState('');
  const [authFullName, setAuthFullName] = useState('');
  const [authWard, setAuthWard] = useState<string>(WARDS[0]);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const detectedRole = determineRoleFromEmail(authEmail);
  const isSupervisorAuth = detectedRole === 'supervisor';

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
    if (user) {
      fetchIssues();
    }
  }, [user]);

  useEffect(() => {
    if (profile?.role === 'field_worker') setActiveTab('tasks');
    else if (profile?.role === 'supervisor') setActiveTab('triage');
    else setActiveTab('home');

    if (profile) {
      setEditName(profile.full_name || '');
      setEditPhone(profile.phone || '');
      setEditWard(profile.ward || WARDS[0]);
    }
  }, [profile?.role, profile?.full_name, profile?.ward]);

  // Auth Handlers
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      if (isSignUp) {
        if (!authFullName.trim()) throw new Error('Please enter your full name');
        const { error } = await signUp(
          authEmail,
          authPassword,
          authFullName,
          isSupervisorAuth ? undefined : authWard
        );
        if (error) throw error;
      } else {
        const { error } = await signIn(authEmail, authPassword);
        if (error) throw error;
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setAuthLoading(true);

    try {
      if (!authEmail.trim()) throw new Error('Please enter your email address');
      const { error } = await sendEmailOtp(
        authEmail,
        authFullName.trim() || undefined,
        isSupervisorAuth ? undefined : authWard
      );
      if (error) throw error;

      setOtpSent(true);
      setAuthSuccess(`A 6-digit code has been sent to ${authEmail}`);
    } catch (err: any) {
      setAuthError(err?.message || 'Failed to send OTP code.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      if (!authOtpCode.trim()) throw new Error('Please enter the 6-digit code');
      const { error } = await verifyEmailOtp(authEmail, authOtpCode.trim());
      if (error) throw error;
    } catch (err: any) {
      setAuthError(err?.message || 'Invalid or expired code.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
    } catch (err: any) {
      setAuthError(err?.message || 'Google Sign-In failed.');
      setAuthLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile({
        full_name: editName.trim(),
        phone: editPhone.trim() || null,
        ward: profile?.role === 'supervisor' ? profile.ward : editWard,
      });
      setIsEditingProfile(false);
    } finally {
      setSavingProfile(false);
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

  // ==========================================
  // ONLY SIGN IN / REGISTER LANDING PAGE
  // ==========================================
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center px-4 py-8 font-sans">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl border border-slate-200/80 p-6 sm:p-7 space-y-4">

          <div className="text-center space-y-1">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-md shadow-blue-600/30 font-black">
              <Building2 className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 mt-2">
              City<span className="text-blue-600">Fix</span>
            </h1>
            <p className="text-xs text-slate-500">Municipal Civic Infrastructure Network</p>
          </div>

          {authError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="break-words line-clamp-2">{authError}</span>
            </div>
          )}

          {authSuccess && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
              <Mail className="w-4 h-4 shrink-0" />
              <span className="break-words line-clamp-2">{authSuccess}</span>
            </div>
          )}

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={authLoading}
            className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-xs"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">or</span>
            <div className="border-t border-slate-200 w-full" />
          </div>

          {/* Password Mode */}
          {authMode === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-3">
              {isSignUp && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={authFullName}
                      onChange={(e) => setAuthFullName(e.target.value)}
                      placeholder="e.g., Jane Doe"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="name@ves.ac.in or resident@gmail.com"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none"
                  />
                </div>
              </div>

              {isSignUp && !isSupervisorAuth && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    <span>{detectedRole === 'field_worker' ? 'Assigned Field Ward *' : 'Residential Ward *'}</span>
                  </label>
                  <select
                    value={authWard}
                    onChange={(e) => setAuthWard(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
                  >
                    {WARDS.map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-xs rounded-xl shadow-sm shadow-blue-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {authLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
              </button>
            </form>
          )}

          {/* Email OTP Mode */}
          {authMode === 'otp' && (
            <>
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="Enter email to receive login code"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none"
                    />
                  </div>

                  {!isSupervisorAuth && (
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Ward Jurisdiction
                      </label>
                      <select
                        value={authWard}
                        onChange={(e) => setAuthWard(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
                      >
                        {WARDS.map((w) => (
                          <option key={w} value={w}>{w}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {authLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Send Login Code</span>
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      6-Digit Email Code *
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={authOtpCode}
                        onChange={(e) => setAuthOtpCode(e.target.value)}
                        placeholder="123456"
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white tracking-widest font-mono text-center text-sm font-bold outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {authLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Verify & Sign In</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="w-full text-[11px] text-slate-500 font-bold hover:underline text-center"
                  >
                    Change Email / Resend Code
                  </button>
                </form>
              )}
            </>
          )}

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <button
              type="button"
              onClick={() => {
                setAuthMode(authMode === 'password' ? 'otp' : 'password');
                setAuthError(null);
                setAuthSuccess(null);
              }}
              className="font-bold text-slate-600 hover:text-slate-900"
            >
              {authMode === 'password' ? 'Sign in with Email Code' : 'Sign in with Password'}
            </button>

            {authMode === 'password' && (
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setAuthError(null);
                }}
                className="font-bold text-blue-600 hover:underline"
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // AUTHENTICATED DASHBOARD
  // ==========================================
  const role = profile?.role || 'citizen';
  const isTicketAuthor = user && selectedIssue && user.id === selectedIssue.user_id;

  const getStatusBadge = (status: string, disputeStatus?: string) => {
    if (disputeStatus === 'disputed') {
      return (
        <span className="text-[9px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-md shrink-0">
          DISPUTED ⚠️
        </span>
      );
    }
    switch (status) {
      case 'resolved':
        return <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md shrink-0">RESOLVED</span>;
      case 'reopened':
        return <span className="text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-md shrink-0">REOPENED</span>;
      case 'in_progress':
        return <span className="text-[9px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md shrink-0">IN PROGRESS</span>;
      case 'assigned':
        return <span className="text-[9px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md shrink-0">DISPATCHED</span>;
      default:
        return <span className="text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md shrink-0">REPORTED</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/60 text-slate-900 flex flex-col font-sans pb-24 md:pb-8">
      <Navbar
        onOpenAuth={() => { }}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenReport={() => setReportModalOpen(true)}
      />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 pt-6 space-y-6">

        {/* FIELD WORKER PORTAL */}
        {role === 'field_worker' && (
          <WorkerView
            issues={issues}
            activeTab={activeTab}
            onRefresh={fetchIssues}
          />
        )}

        {/* SUPERVISOR DASHBOARD */}
        {role === 'supervisor' && (
          <SupervisorView
            issues={issues}
            activeTab={activeTab}
            onRefresh={fetchIssues}
          />
        )}

        {/* CITIZEN PORTAL */}
        {role === 'citizen' && (
          <>
            {activeTab === 'home' && (
              <div className="space-y-5">
                <div
                  onClick={() => setReportModalOpen(true)}
                  className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-5 rounded-3xl shadow-lg shadow-blue-600/20 cursor-pointer active:scale-[0.99] transition relative overflow-hidden flex items-center justify-between"
                >
                  <div className="space-y-1 min-w-0 flex-1 pr-3">
                    <div className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                      <Sparkles className="w-3 h-3" /> Live Dispatch
                    </div>
                    <h3 className="text-xl font-black tracking-tight">Report Civic Damage</h3>
                    <p className="text-xs text-blue-100 line-clamp-1">
                      Upload photo & GPS to dispatch municipal repair crews to your ward.
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-white/10 border border-white/20 text-white rounded-2xl flex items-center justify-center shrink-0">
                    <Camera className="w-6 h-6" />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Recent Community Tickets</h4>
                    <button onClick={fetchIssues} className="text-xs text-blue-600 font-bold hover:underline">Refresh</button>
                  </div>

                  {issues.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                      <p className="text-sm font-semibold text-slate-500">No grievances filed yet.</p>
                      <button onClick={() => setReportModalOpen(true)} className="mt-2 text-xs font-bold text-blue-600 hover:underline">Be the first to report</button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {issues.map((issue) => (
                        <div
                          key={issue.id}
                          onClick={() => setSelectedIssue(issue)}
                          className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5 cursor-pointer hover:border-blue-500/40 hover:shadow-md transition h-24"
                        >
                          <img
                            src={issue.image_url || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=150'}
                            alt="Thumbnail"
                            className="w-16 h-16 aspect-square rounded-xl object-cover border border-slate-100 shrink-0"
                          />
                          <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="text-[10px] font-bold uppercase text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-md truncate max-w-[120px]">
                                {issue.category}
                              </span>
                              {getStatusBadge(issue.status, issue.dispute_status)}
                            </div>

                            <h5 className="text-xs font-bold text-slate-900 truncate">{issue.title}</h5>

                            <div className="flex items-center gap-1 text-[11px] text-slate-400 truncate">
                              <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                              <span className="truncate">{issue.ward || 'Ward 14'}</span>
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
                    <button onClick={() => setReportModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl">File First Ticket</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {issues.filter(i => i.user_id === user?.id).map((issue) => (
                      <div
                        key={issue.id}
                        onClick={() => setSelectedIssue(issue)}
                        className="bg-white p-4 rounded-2xl border border-slate-200 cursor-pointer hover:border-blue-500/40 transition shadow-xs flex flex-col justify-between h-32"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-blue-600 truncate">{issue.category}</span>
                            {getStatusBadge(issue.status, issue.dispute_status)}
                          </div>
                          <h4 className="font-bold text-slate-900 text-sm mt-1 truncate">{issue.title}</h4>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2">{issue.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* PROFILE WITH EDIT MODE */}
        {activeTab === 'profile' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs max-w-lg mx-auto space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-black text-xl border border-blue-200">
                  {profile?.full_name?.charAt(0) || 'U'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{profile?.full_name}</h3>
                  <p className="text-xs text-slate-500 font-mono">{user?.email}</p>
                </div>
              </div>

              {!isEditingProfile && (
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
              )}
            </div>

            {!isEditingProfile ? (
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-slate-100 text-xs">
                  <span className="text-slate-500 font-medium">Assigned Role</span>
                  <span className="font-bold text-blue-600 uppercase">{role.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 text-xs">
                  <span className="text-slate-500 font-medium">Duty / Resident Ward</span>
                  <span className="font-bold text-slate-800">{profile?.ward}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 text-xs">
                  <span className="text-slate-500 font-medium">Contact Phone</span>
                  <span className="font-bold text-slate-800">{profile?.phone || 'Not provided'}</span>
                </div>
                {profile?.badge_id && (
                  <div className="flex justify-between py-2 border-b border-slate-100 text-xs">
                    <span className="text-slate-500 font-medium">Technician Badge</span>
                    <span className="font-mono font-bold text-slate-800">{profile.badge_id}</span>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="+91 98200 00000"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none"
                  />
                </div>

                {role !== 'supervisor' && (
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      {role === 'field_worker' ? 'Assigned Field Ward' : 'Resident Ward'}
                    </label>
                    <select
                      value={editWard}
                      onChange={(e) => setEditWard(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
                    >
                      {WARDS.map((w) => (
                        <option key={w} value={w}>{w}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    {savingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>Save Changes</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </main>

      {/* Ticket Detail Drawer */}
      {selectedIssue && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md">Ticket Detail</span>
                <h3 className="text-lg font-extrabold text-slate-900 mt-1 truncate max-w-xs">{selectedIssue.title}</h3>
              </div>
              <button onClick={() => setSelectedIssue(null)} className="p-2 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <img src={selectedIssue.image_url} alt="Evidence" className="w-full h-48 aspect-video rounded-2xl object-cover border border-slate-200" />

            {selectedIssue.resolution_image_url && (
              <div className="space-y-1.5">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-700">Proof of Fix ("AFTER" Photo)</div>
                <img src={selectedIssue.resolution_image_url} alt="Resolution" className="w-full h-48 aspect-video rounded-2xl object-cover border border-emerald-300" />
                {selectedIssue.resolution_notes && (
                  <p className="text-xs text-slate-600 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                    <strong>Technician Note:</strong> {selectedIssue.resolution_notes}
                  </p>
                )}
              </div>
            )}

            {selectedIssue.status === 'resolved' && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Resolution Feedback</span>
                  {selectedIssue.dispute_status === 'disputed' && (
                    <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-md">
                      ⚠️ Under Review
                    </span>
                  )}
                </div>

                {selectedIssue.rating ? (
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <span>Citizen Rating:</span>
                    <div className="flex text-amber-500">
                      {[...Array(selectedIssue.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400" />
                      ))}
                    </div>
                    {selectedIssue.rating_feedback && <span className="italic text-slate-500 truncate max-w-[200px]">"{selectedIssue.rating_feedback}"</span>}
                  </div>
                ) : isTicketAuthor ? (
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
                          placeholder="Describe remaining defects..."
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
                  <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Only the authoring citizen can submit a quality review.</span>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Citizen Description</div>
              <p className="text-sm text-slate-700 break-words">{selectedIssue.description}</p>
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
                  <span>Email</span>
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
          onOpenReport={() => setReportModalOpen(true)}
          role={role}
        />
      </div>

      <ReportModal isOpen={reportModalOpen} onClose={() => setReportModalOpen(false)} onSuccess={fetchIssues} />
    </div>
  );
}