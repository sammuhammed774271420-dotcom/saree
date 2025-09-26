/*
  # إعداد سياسات التخزين في Supabase

  1. إنشاء buckets التخزين
    - restaurant-images: صور المطاعم
    - menu-item-images: صور الوجبات
    - offer-images: صور العروض
    - category-images: صور التصنيفات
    - general-images: صور عامة

  2. سياسات الأمان
    - السماح بالقراءة العامة للصور
    - السماح بالرفع والحذف للخادم (service role)
    - تقييد أحجام الملفات وأنواعها
*/

-- تفعيل RLS على جدول storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- إنشاء buckets التخزين
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types, avif_autodetection)
VALUES 
  ('restaurant-images', 'restaurant-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'], false),
  ('menu-item-images', 'menu-item-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'], false),
  ('offer-images', 'offer-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'], false),
  ('category-images', 'category-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'], false),
  ('general-images', 'general-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'], false)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  avif_autodetection = EXCLUDED.avif_autodetection;

-- حذف السياسات الموجودة إذا كانت موجودة
DROP POLICY IF EXISTS "Public read access for restaurant images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for menu item images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for offer images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for category images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for general images" ON storage.objects;

DROP POLICY IF EXISTS "Service role can upload restaurant images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can upload menu item images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can upload offer images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can upload category images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can upload general images" ON storage.objects;

DROP POLICY IF EXISTS "Service role can update restaurant images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can update menu item images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can update offer images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can update category images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can update general images" ON storage.objects;

DROP POLICY IF EXISTS "Service role can delete restaurant images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can delete menu item images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can delete offer images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can delete category images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can delete general images" ON storage.objects;

-- سياسات القراءة العامة للصور
CREATE POLICY "Public read access for restaurant images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'restaurant-images');

CREATE POLICY "Public read access for menu item images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'menu-item-images');

CREATE POLICY "Public read access for offer images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'offer-images');

CREATE POLICY "Public read access for category images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'category-images');

CREATE POLICY "Public read access for general images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'general-images');

-- سياسات الرفع للخادم (service role)
CREATE POLICY "Service role can upload restaurant images"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'restaurant-images');

CREATE POLICY "Service role can upload menu item images"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'menu-item-images');

CREATE POLICY "Service role can upload offer images"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'offer-images');

CREATE POLICY "Service role can upload category images"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'category-images');

CREATE POLICY "Service role can upload general images"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'general-images');

-- سياسات التحديث للخادم
CREATE POLICY "Service role can update restaurant images"
ON storage.objects FOR UPDATE
TO service_role
USING (bucket_id = 'restaurant-images');

CREATE POLICY "Service role can update menu item images"
ON storage.objects FOR UPDATE
TO service_role
USING (bucket_id = 'menu-item-images');

CREATE POLICY "Service role can update offer images"
ON storage.objects FOR UPDATE
TO service_role
USING (bucket_id = 'offer-images');

CREATE POLICY "Service role can update category images"
ON storage.objects FOR UPDATE
TO service_role
USING (bucket_id = 'category-images');

CREATE POLICY "Service role can update general images"
ON storage.objects FOR UPDATE
TO service_role
USING (bucket_id = 'general-images');

-- سياسات الحذف للخادم
CREATE POLICY "Service role can delete restaurant images"
ON storage.objects FOR DELETE
TO service_role
USING (bucket_id = 'restaurant-images');

CREATE POLICY "Service role can delete menu item images"
ON storage.objects FOR DELETE
TO service_role
USING (bucket_id = 'menu-item-images');

CREATE POLICY "Service role can delete offer images"
ON storage.objects FOR DELETE
TO service_role
USING (bucket_id = 'offer-images');

CREATE POLICY "Service role can delete category images"
ON storage.objects FOR DELETE
TO service_role
USING (bucket_id = 'category-images');

CREATE POLICY "Service role can delete general images"
ON storage.objects FOR DELETE
TO service_role
USING (bucket_id = 'general-images');

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_storage_objects_bucket_id ON storage.objects(bucket_id);
CREATE INDEX IF NOT EXISTS idx_storage_objects_name ON storage.objects(name);
CREATE INDEX IF NOT EXISTS idx_storage_objects_created_at ON storage.objects(created_at);