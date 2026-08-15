import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { uploadIssuePhoto } from '../lib/storage';
import { supabase } from '../lib/supabase';
import {
    X,
    Camera,
    CheckCircle2,
    Loader2,
    AlertCircle,
    Trash2,
    FileText
} from 'lucide-react';

export interface ResolutionModalProps {
    issue: any;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const ResolutionModal: React.FC<ResolutionModalProps> = ({
    issue,
    isOpen,
    onClose,
    onSuccess,
}) => {
    const { user, profile } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [notes, setNotes] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen || !issue) return null;

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

    const handleSubmitResolution = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!selectedFile) {
            setError('Please upload on-site "AFTER" photo evidence.');
            return;
        }

        if (!notes.trim()) {
            setError('Please provide resolution and repair notes.');
            return;
        }

        setLoading(true);

        try {
            // 1. Upload resolution photo
            const { url: resolutionPhotoUrl, error: uploadErr } = await uploadIssuePhoto(
                selectedFile,
                user?.id || 'worker'
            );

            if (uploadErr || !resolutionPhotoUrl) {
                throw new Error(uploadErr?.message || 'Failed to upload resolution proof photo.');
            }

            // 2. Update issue in PostgreSQL
            const { error: dbError } = await supabase
                .from('issues')
                .update({
                    status: 'resolved',
                    resolution_image_url: resolutionPhotoUrl,
                    resolution_notes: notes.trim(),
                    updated_at: new Date().toISOString(),
                })
                .eq('id', issue.id);

            if (dbError) throw dbError;

            // 3. Log audit event
            await supabase.from('issue_timeline').insert({
                issue_id: issue.id,
                status: 'resolved',
                message: `Field repair completed: ${notes.trim()}`,
                actor_name: profile?.full_name || 'Field Technician',
            });

            handleRemovePhoto();
            setNotes('');
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err?.message || 'Failed to submit resolution proof.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
            <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col animate-slide-up overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-emerald-50/50">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-600 text-white rounded-lg">
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-900">Proof of Work Resolution</h2>
                            <p className="text-[11px] text-emerald-800 font-medium">Ticket #{issue.id.slice(0, 8)}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {error && (
                    <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span className="break-words">{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmitResolution} className="p-6 overflow-y-auto space-y-4 flex-1">
                    {/* Issue Context Summary */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex gap-3 items-center">
                        <img
                            src={issue.image_url}
                            alt="Before"
                            className="w-14 h-14 rounded-lg object-cover border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                            <span className="text-[10px] font-bold uppercase text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                ORIGINAL ISSUE
                            </span>
                            <div className="text-xs font-bold text-slate-900 truncate mt-1">{issue.title}</div>
                            <div className="text-[11px] text-slate-500 truncate">{issue.category} • {issue.ward}</div>
                        </div>
                    </div>

                    {/* After Photo Capture */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                            Proof Photo ("AFTER" Repair) *
                        </label>
                        {!previewUrl ? (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50/80 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2"
                            >
                                <div className="p-3 bg-emerald-100 text-emerald-700 rounded-full">
                                    <Camera className="w-6 h-6" />
                                </div>
                                <div className="text-xs font-bold text-emerald-900">Snap or Upload Resolved Photo</div>
                                <div className="text-[11px] text-emerald-700">Required for municipal audit verification (up to 10MB)</div>
                            </div>
                        ) : (
                            <div className="relative rounded-2xl overflow-hidden border border-emerald-200 group h-44">
                                <img src={previewUrl} alt="Resolution Preview" className="w-full h-full object-cover" />
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

                    {/* Field Repair Notes */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-slate-500" />
                            <span>Repair & Material Notes *</span>
                        </label>
                        <textarea
                            required
                            rows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="e.g., Filled with cold-mix asphalt, leveled and steam-roller compressed. Traffic flow restored."
                            className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition resize-none"
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-emerald-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            <span>{loading ? 'Submitting Proof of Work...' : 'Mark as Fixed & Submit Proof'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ResolutionModal;