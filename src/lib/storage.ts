import { supabase } from './supabase';

export interface UploadResult {
    url: string | null;
    error: Error | null;
}

export async function uploadIssuePhoto(file: File, userId: string): Promise<UploadResult> {
    try {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            throw new Error('Please upload a JPEG, PNG, or WebP image.');
        }


        if (file.size > 10 * 1024 * 1024) {
            throw new Error('Image size exceeds 10MB limit.');
        }

        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const randomHash = Math.random().toString(36).substring(2, 9);
        const filePath = `${userId}/${Date.now()}_${randomHash}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from('issue-photos')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true,
            });

        if (uploadError) {
            throw new Error(uploadError.message || 'Storage upload rejected');
        }

        const { data: urlData } = supabase.storage
            .from('issue-photos')
            .getPublicUrl(filePath);

        if (!urlData?.publicUrl) {
            throw new Error('Failed to generate public URL for photo.');
        }

        return { url: urlData.publicUrl, error: null };
    } catch (err: any) {
        const msg = err?.message || (typeof err === 'string' ? err : 'Image upload failed');
        return {
            url: null,
            error: new Error(msg),
        };
    }
}