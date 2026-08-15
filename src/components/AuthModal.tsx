import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Mail, Lock, User, AlertCircle, Loader2, Info } from 'lucide-react';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
    const { signIn, signUp } = useAuth();
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (isSignUp) {
                if (!fullName.trim()) throw new Error('Please enter your full name');
                const { error: signUpError } = await signUp(email, password, fullName);
                if (signUpError) throw signUpError;
            } else {
                const { error: signInError } = await signIn(email, password);
                if (signInError) throw signInError;
            }
            onClose();
        } catch (err: any) {
            setError(err?.message || 'Authentication failed. Please verify credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-5 animate-slide-up">

                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">
                            {isSignUp ? 'Create CityFix Account' : 'Welcome to CityFix'}
                        </h2>
                        <p className="text-xs text-slate-500">Official Municipal Grievance Network</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Domain Guidance Note */}
                <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-3 text-[11px] text-slate-700 space-y-1">
                    <div className="flex items-center gap-1 font-bold text-blue-900">
                        <Info className="w-3.5 h-3.5 text-blue-600" /> Automatic Role Routing
                    </div>
                    <p>• <strong>@ves.ac.in:</strong> Field Technician Portal</p>
                    <p>• <strong>supervisor@... / @supervisor.ves.ac.in:</strong> Ward Supervisor</p>
                    <p>• <strong>Other emails (Gmail, etc.):</strong> Resident Citizen Portal</p>
                </div>

                {error && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3.5">
                    {isSignUp && (
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    required
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="e.g., Jane Doe"
                                    className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@ves.ac.in or name@gmail.com"
                                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-blue-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                    </button>
                </form>

                <div className="text-center pt-1 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={() => {
                            setIsSignUp(!isSignUp);
                            setError(null);
                        }}
                        className="text-xs font-bold text-blue-600 hover:underline"
                    >
                        {isSignUp ? 'Already registered? Sign In' : "Don't have an account? Sign Up"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthModal;