import React, { useState } from 'react';
import { useAuth, WARDS, determineRoleFromEmail } from '../context/AuthContext';
import { X, Mail, Lock, User, AlertCircle, Loader2, MapPin, KeyRound } from 'lucide-react';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type AuthMode = 'password' | 'otp';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
    const { signIn, signUp, signInWithGoogle, sendEmailOtp, verifyEmailOtp } = useAuth();

    const [authMode, setAuthMode] = useState<AuthMode>('password');
    const [isSignUp, setIsSignUp] = useState(false);
    const [otpSent, setOtpSent] = useState(false);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [fullName, setFullName] = useState('');
    const [selectedWard, setSelectedWard] = useState<string>(WARDS[0]);

    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const detectedRole = determineRoleFromEmail(email);
    const isSupervisor = detectedRole === 'supervisor';

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (isSignUp) {
                if (!fullName.trim()) throw new Error('Please enter your full name');
                const { error: signUpError } = await signUp(
                    email,
                    password,
                    fullName,
                    isSupervisor ? undefined : selectedWard
                );
                if (signUpError) throw signUpError;
            } else {
                const { error: signInError } = await signIn(email, password);
                if (signInError) throw signInError;
            }
            onClose();
        } catch (err: any) {
            setError(err?.message || 'Authentication failed. Please check credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMsg(null);
        setLoading(true);

        try {
            if (!email.trim()) throw new Error('Please enter your email address');
            const { error: otpErr } = await sendEmailOtp(
                email,
                fullName.trim() || undefined,
                isSupervisor ? undefined : selectedWard
            );
            if (otpErr) throw otpErr;

            setOtpSent(true);
            setSuccessMsg(`A 6-digit verification code was sent to ${email}`);
        } catch (err: any) {
            setError(err?.message || 'Failed to send OTP. Please retry.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (!otpCode.trim()) throw new Error('Please enter the 6-digit code');
            const { error: verifyErr } = await verifyEmailOtp(email, otpCode.trim());
            if (verifyErr) throw verifyErr;

            onClose();
        } catch (err: any) {
            setError(err?.message || 'Invalid or expired OTP code.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError(null);
        setLoading(true);
        try {
            const { error: gError } = await signInWithGoogle();
            if (gError) throw gError;
        } catch (err: any) {
            setError(err?.message || 'Google Sign-In failed.');
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-4 animate-slide-up">

                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                        <h2 className="text-base font-black text-slate-900">
                            {authMode === 'otp'
                                ? (otpSent ? 'Enter Email Code' : 'Sign In with Email Code')
                                : (isSignUp ? 'Create Account' : 'Welcome Back')}
                        </h2>
                        <p className="text-[11px] text-slate-500">CityFix Municipal Network</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Notifications */}
                {error && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span className="break-words line-clamp-2">{error}</span>
                    </div>
                )}

                {successMsg && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
                        <Mail className="w-4 h-4 shrink-0" />
                        <span className="break-words">{successMsg}</span>
                    </div>
                )}

                {/* Google Sign In Button */}
                <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
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
                    <div className="border-t border-slate-100 w-full" />
                    <span className="bg-white px-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">or</span>
                    <div className="border-t border-slate-100 w-full" />
                </div>

                {/* ================= PASSWORD AUTH MODE ================= */}
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
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="e.g., Rajesh Sharma"
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
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="resident@gmail.com or worker@ves.ac.in"
                                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none"
                                />
                            </div>
                        </div>

                        {isSignUp && !isSupervisor && (
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                                    <span>{detectedRole === 'field_worker' ? 'Assigned Field Ward *' : 'Residential Ward *'}</span>
                                </label>
                                <select
                                    value={selectedWard}
                                    onChange={(e) => setSelectedWard(e.target.value)}
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
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-xs rounded-xl shadow-sm shadow-blue-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                        </button>
                    </form>
                )}

                {/* ================= EMAIL OTP AUTH MODE ================= */}
                {authMode === 'otp' && (
                    <>
                        {!otpSent ? (
                            <form onSubmit={handleSendOtp} className="space-y-3">
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                                        Your Name (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="e.g., Jane Doe"
                                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                                        Email Address *
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter email to receive code"
                                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none"
                                    />
                                </div>

                                {!isSupervisor && (
                                    <div>
                                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                                            Ward Jurisdiction
                                        </label>
                                        <select
                                            value={selectedWard}
                                            onChange={(e) => setSelectedWard(e.target.value)}
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
                                    disabled={loading}
                                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
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
                                            value={otpCode}
                                            onChange={(e) => setOtpCode(e.target.value)}
                                            placeholder="123456"
                                            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white tracking-widest font-mono text-center text-sm font-bold outline-none"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
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

                {/* Footer Navigation */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <button
                        type="button"
                        onClick={() => {
                            setAuthMode(authMode === 'password' ? 'otp' : 'password');
                            setError(null);
                            setSuccessMsg(null);
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
                                setError(null);
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
};

export default AuthModal;