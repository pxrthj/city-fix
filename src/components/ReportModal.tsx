import React, { useState, useRef } from 'react';
import { useAuth, WARDS } from '../context/AuthContext';
import { uploadIssuePhoto } from '../lib/storage';
import { supabase } from '../lib/supabase';
import {
    X,
    Camera,
    MapPin,
    AlertCircle,
    Loader2,
    CheckCircle2,
    Trash2,
    Flame,
    AlertTriangle,
    Info
} from 'lucide-react';

export interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const CATEGORIES = [
    { id: 'Roads', label: '🕳️ Roads & Potholes' },
    { id: 'Sanitation', label: '🗑️ Sanitation & Waste' },
    { id: 'Lighting', label: '💡 Street Lighting' },
    { id: 'Water', label: '🚰 Water & Sewage' },
    { id: 'Safety', label: '⚠️ Public Safety' },
    { id: 'Other', label: '📋 Other Civic Issue' },
];

const SEVERITY_LEVELS = [
    { id: 'Low', label: 'Low', icon: Info, color: 'border-slate-200 text-slate-700 active:bg-slate-100' },
    { id: 'Medium', label: 'Medium', icon: AlertTriangle, color: 'border-amber-200 text-amber-700 bg-amber-50/50' },
    { id: 'High', label: 'High', icon: Flame, color: 'border-orange-200 text-orange-700 bg-orange-50/50' },
    { id: 'Critical', label: 'Critical', icon: AlertCircle, color: 'border-rose-200 text-rose-700 bg-rose-50/50' },
];

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { user, profile } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [title, setTitle] = useState('');
    const [category, setCategory] = useState(CATEGORIES[0].id);
    const [severity, setSeverity] = useState('Medium');
    const [selectedWard, setSelectedWard] = useState<string>(
        profile?.ward && profile.ward !== 'Municipal HQ (All Wards)' ? profile.ward : WARDS[0]
    );
    const [description, setDescription] = useState('');

    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);
    const [locating, setLocating] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            setLocationError('Geolocation is not supported by your browser.');
            return;
        }
        setLocating(true);
        setLocationError(null);

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLatitude(pos.coords.latitude);
                setLongitude(pos.coords.longitude);
                setLocating(false);
            },
            () => {
                setLocationError('Please allow location access in your browser.');
                setLocating(false);
            },
            { enableHighAccuracy: true, timeout: 8000 }
        );
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleRemovePhoto = () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        if (!user) {
            setFormError('You must be signed in to submit a grievance.');
            return;
        }

        if (!selectedFile) {
            setFormError('Please attach photo evidence of the issue.');
            return;
        }

        if (!title.trim()) {
            setFormError('Please provide an issue title.');
            return;
        }

        setLoading(true);

        try {
            // 1. Upload photo to Supabase Storage
            const { url: imageUrl, error: uploadErr } = await uploadIssuePhoto(selectedFile, user.id);
            if (uploadErr || !imageUrl) {
                throw new Error(uploadErr?.message || 'Failed to upload photo to storage.');
            }

            // 2. Insert into PostgreSQL
            const { data: newIssue, error: dbError } = await supabase
                .from('issues')
                .insert({
                    title: title.trim(),
                    description: description.trim(),
                    category,
                    severity,
                    latitude: latitude || 19.0760,
                    longitude: longitude || 72.8777,
                    image_url: imageUrl,
                    user_id: user.id,
                    ward: selectedWard,
                    status: 'reported',
                })
                .select()
                .single();

            if (dbError) throw dbError;

            // 3. Log initial audit timeline event
            if (newIssue) {
                await supabase.from('issue_timeline').insert({
                    issue_id: newIssue.id,
                    status: 'reported',
                    message: `Grievance registered in ${selectedWard} and queued for supervisor dispatch.`,
                    actor_name: profile?.full_name || 'Citizen',
                });
            }

            handleRemovePhoto();
            setTitle('');
            setDescription('');
            onSuccess?.();
            onClose();
        } catch (err: any) {
            setFormError(err?.message || 'Submission failed. Please retry.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm">
            <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col animate-slide-up overflow-hidden">

                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">File a Grievance</h2>
                        <p className="text-xs text-slate-500">Route issue directly to municipal ward crews</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {formError && (
                    <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span className="break-words">{formError}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
                    {/* Photo Evidence */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                            Photo Evidence *
                        </label>
                        {!previewUrl ? (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-slate-200 hover:border-blue-500/50 bg-slate-50 hover:bg-blue-50/30 rounded-2xl p-5 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2"
                            >
                                <div className="p-3 bg-blue-100/60 text-blue-600 rounded-full">
                                    <Camera className="w-6 h-6" />
                                </div>
                                <div className="text-xs font-semibold text-slate-700">Tap to Capture or Upload Evidence</div>
                                <div className="text-[11px] text-slate-400">JPEG, PNG, WebP up to 10MB</div>
                            </div>
                        ) : (
                            <div className="relative rounded-2xl overflow-hidden border border-slate-200 group h-44">
                                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={handleRemovePhoto}
                                    className="absolute top-2.5 right-2.5 p-2 bg-rose-600 text-white rounded-xl shadow-lg hover:bg-rose-700"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </div>

                    {/* Issue Title */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                            Issue Title *
                        </label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Deep pothole near junction"
                            className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                        />
                    </div>

                    {/* Incident Ward */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-blue-600" />
                            <span>Incident Location (Ward) *</span>
                        </label>
                        <select
                            value={selectedWard}
                            onChange={(e) => setSelectedWard(e.target.value)}
                            className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                            {WARDS.map((w) => (
                                <option key={w} value={w}>{w}</option>
                            ))}
                        </select>
                    </div>

                    {/* Category Selection */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                            Category *
                        </label>
                        <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none">
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setCategory(cat.id)}
                                    className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${category === cat.id
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-600/30'
                                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                        }`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Severity Selection */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                            Assessed Urgency
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {SEVERITY_LEVELS.map((s) => (
                                <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => setSeverity(s.id)}
                                    className={`py-2 px-1 text-xs font-bold rounded-xl border text-center transition ${severity === s.id
                                            ? 'ring-2 ring-blue-600 border-blue-600 bg-blue-50 text-blue-900 font-extrabold'
                                            : s.color
                                        }`}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Geolocation Detection */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                            GPS Coordinates
                        </label>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleGetLocation}
                                disabled={locating}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-800 text-xs font-bold rounded-xl transition"
                            >
                                {locating ? <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" /> : <MapPin className="w-3.5 h-3.5 text-blue-600" />}
                                <span>{locating ? 'Detecting...' : 'Auto-Detect GPS'}</span>
                            </button>

                            {latitude && longitude && (
                                <div className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>{latitude.toFixed(4)}, {longitude.toFixed(4)}</span>
                                </div>
                            )}
                        </div>
                        {locationError && <p className="text-[11px] text-rose-500 mt-1">{locationError}</p>}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                            Description *
                        </label>
                        <textarea
                            required
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe landmarks, hazards, or repair requirements..."
                            className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition resize-none"
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-sm font-bold rounded-xl shadow-md shadow-blue-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            <span>{loading ? 'Submitting Grievance...' : 'Submit Grievance'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReportModal;