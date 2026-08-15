import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { useAuth } from './context/AuthContext';
import { ShieldCheck, Sparkles, AlertCircle, Database, Lock } from 'lucide-react';

export default function App() {
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const { user, loading } = useAuth();

  const handleOpenReport = () => {
    if (!user) {
      setIsAuthOpen(true);
    } else {
      alert(`Authenticated as ${user.email}. Issue submission form will be wired on Day 3!`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-400 font-medium tracking-wide">Initializing CityFix Session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Top Navigation Header */}
      <Navbar
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenReport={handleOpenReport}
      />

      {/* Main Page Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Hero Section */}
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold mb-3 border border-blue-100">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Day 2 Auth & Data Contracts Active</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Municipal Infrastructure & Issue Tracker
            </h1>
            <p className="text-slate-600 text-sm mt-2 leading-relaxed">
              Report public infrastructure breakdowns, let Gemini AI auto-classify priority from photos, and track real-time resolution updates.
            </p>
          </div>

          {/* Session Indicator Card */}
          <div className="w-full md:w-auto bg-slate-50 p-5 rounded-2xl border border-slate-200 flex items-center space-x-4">
            <div className={`p-3 rounded-xl ${user ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {user ? <ShieldCheck className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Session Status
              </span>
              <span className="text-sm font-bold text-slate-900 block">
                {user ? 'Authenticated Citizen' : 'Guest Mode (Read Only)'}
              </span>
              <span className="text-xs text-slate-500 block truncate max-w-[200px]">
                {user ? user.email : 'Sign in to log grievances'}
              </span>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="bg-blue-50 text-blue-600 w-10 h-10 rounded-xl flex items-center justify-center mb-4">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">PostgreSQL Typed Schema</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Enforced by strict TypeScript contracts matching our remote Supabase relational database.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="bg-emerald-50 text-emerald-600 w-10 h-10 rounded-xl flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Row Level Security</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Database security enforced at the engine level using JWT user ID claims.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="bg-purple-50 text-purple-600 w-10 h-10 rounded-xl flex items-center justify-center mb-4">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Next: Day 3 Photo Storage</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              We will build file upload pipelines to Supabase Storage and create the issue report form.
            </p>
          </div>
        </div>
      </main>

      {/* Authentication Dialog */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />
    </div>
  );
}