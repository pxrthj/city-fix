import { useState, type FC, type FormEvent } from 'react';
import { X, Mail, Lock, LogIn, UserPlus, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AuthModal: FC<AuthModalProps> = ({ isOpen, onClose }) => {
    const [isSignUp, setIsSignUp] = useState<boolean>(false);
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage(null);

        try {
            if (isSignUp) {
                // Execute Supabase User Registration
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                alert('Registration successful! You are now authenticated.');
            } else {
                // Execute Supabase User Login
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            }
            // Reset form and close dialog
            setEmail('');
            setPassword('');
            onClose();
        } catch (err: any) {
            setErrorMessage(err.message || 'An unexpected authentication error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative border border-slate-100">

                {/* Header Bar */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">
                            {isSignUp ? 'Create Citizen Account' : 'Welcome Back'}
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {isSignUp ? 'Join CityFix to report and track issues' : 'Sign in to access your civic dashboard'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tab Switcher */}
                <div className="flex border-b border-slate-100 bg-slate-50 p-1.5 m-6 mb-0 rounded-xl">
                    <button
                        type="button"
                        onClick={() => { setIsSignUp(false); setErrorMessage(null); }}
                        className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${!isSignUp ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                            }`}
                    >
                        Sign In
                    </button>
                    <button
                        type="button"
                        onClick={() => { setIsSignUp(true); setErrorMessage(null); }}
                        className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${isSignUp ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                            }`}
                    >
                        Sign Up
                    </button>
                </div>

                {/* Dynamic Error Box */}
                {errorMessage && (
                    <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium flex items-center space-x-2">
                        <span>⚠️</span>
                        <span>{errorMessage}</span>
                    </div>
                )}

                {/* Form Inputs */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                            Email Address
                        </label>
                        <div className="relative">
                            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="citizen@cityfix.org"
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all text-slate-900"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                            Password
                        </label>
                        <div className="relative">
                            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all text-slate-900"
                            />
                        </div>
                        {isSignUp && (
                            <p className="text-[11px] text-slate-400 mt-1">Must be at least 6 characters long.</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all shadow-md shadow-blue-600/20 flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-[0.99]"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Contacting Supabase...</span>
                            </>
                        ) : isSignUp ? (
                            <>
                                <UserPlus className="w-4 h-4" />
                                <span>Register Account</span>
                            </>
                        ) : (
                            <>
                                <LogIn className="w-4 h-4" />
                                <span>Sign In</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};