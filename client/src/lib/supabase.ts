import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment
const supabaseUrl = (import.meta.env?.VITE_SUPABASE_URL as string) || 'https://flftwguecvlvnksvtgon.supabase.co';
const supabaseAnonKey = (import.meta.env?.VITE_SUPABASE_ANON_KEY as string) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsZnR3Z3VlY3Zsdm5rc3Z0Z29uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMTM2MjYsImV4cCI6MjA3Mzc4OTYyNn0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// أسماء buckets للتخزين
export const STORAGE_BUCKETS = {
  restaurants: 'restaurant-images',
  menuItems: 'menu-item-images',
  offers: 'offer-images', 
  categories: 'category-images',
  general: 'general-images'
};

export interface UploadResult {
  url: string;
  path: string;
}

export async function uploadImage(file: File, category: string = 'general'): Promise<UploadResult> {
  try {
    // الحصول على اسم bucket المناسب
    const bucketName = STORAGE_BUCKETS[category as keyof typeof STORAGE_BUCKETS] || STORAGE_BUCKETS.general;
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileName = `${category}/${timestamp}-${randomId}.${fileExt}`;

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      throw new Error(`فشل في رفع الصورة: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);

    return {
      url: publicUrl,
      path: data.path
    };
  } catch (error) {
    console.error('خطأ في رفع الصورة:', error);
    throw error;
  }
}

export async function deleteImage(path: string, category: string = 'general'): Promise<boolean> {
  try {
    const bucketName = STORAGE_BUCKETS[category as keyof typeof STORAGE_BUCKETS] || STORAGE_BUCKETS.general;
    
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([path]);

    if (error) {
      console.error('خطأ في حذف الصورة:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('خطأ في حذف الصورة:', error);
    return false;
  }
}