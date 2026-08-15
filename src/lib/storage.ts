import { supabase } from './supabase';

export interface UploadResult {
    url: string | null;
    error: Error | null;
}

/**
 * Uploads a local image file to the Supabase 'issue-photos' bucket
 * using a collision-proof path: userId/timestamp_randomHash.ext
 */
export async function uploadIssuePhoto(file: File, userId: string): Promise<UploadResult> {
    try {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            throw new Error('Invalid file format. Please upload JPEG, PNG, or WebP.');
        }

        const maxSizeInBytes = 5 * 1024 * 1024; // 5 MB
        if (file.size > maxSizeInBytes) {
            throw new Error('File size exceeds the 5MB limit.');
        }

        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const randomHash = Math.random().toString(36).substring(2, 9);
        const filePath = `${userId}/${Date.now()}_${randomHash}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from('issue-photos')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false,
            });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
            .from('issue-photos')
            .getPublicUrl(filePath);

        return { url: urlData.publicUrl, error: null };
    } catch (err: unknown) {
        return {
            url: null,
            error: err instanceof Error ? err : new Error('Image upload failed'),
        };
    }
}