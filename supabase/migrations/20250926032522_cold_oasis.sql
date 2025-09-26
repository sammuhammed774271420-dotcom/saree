/*
  # إنشاء سياسات التخزين في Supabase

  1. إنشاء buckets التخزين
    - restaurant-images: صور المطاعم
    - menu-item-images: صور الوجبات
    - offer-images: صور العروض
    - category-images: صور التصنيفات
    - general-images: صور عامة

  2. سياسات الأمان
    - السماح بالقراءة العامة للصور
    - السماح بالرفع والحذف للمديرين والخادم
    - تقييد أحجام الملفات وأنواعها
*/

-- إنشاء buckets التخزين إذا لم تكن موجودة
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('restaurant-images', 'restaurant-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('menu-item-images', 'menu-item-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('offer-images', 'offer-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('category-images', 'category-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('general-images', 'general-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- سياسة القراءة العامة للصور
CREATE POLICY "Public read access for restaurant images"
ON storage.objects FOR SELECT
USING (bucket_id = 'restaurant-images');

CREATE POLICY "Public read access for menu item images"
ON storage.objects FOR SELECT
USING (bucket_id = 'menu-item-images');

CREATE POLICY "Public read access for offer images"
ON storage.objects FOR SELECT
USING (bucket_id = 'offer-images');

CREATE POLICY "Public read access for category images"
ON storage.objects FOR SELECT
USING (bucket_id = 'category-images');

CREATE POLICY "Public read access for general images"
ON storage.objects FOR SELECT
USING (bucket_id = 'general-images');

-- سياسة الرفع للخادم (service role)
CREATE POLICY "Service role can upload restaurant images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'restaurant-images' AND auth.role() = 'service_role');

CREATE POLICY "Service role can upload menu item images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'menu-item-images' AND auth.role() = 'service_role');

CREATE POLICY "Service role can upload offer images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'offer-images' AND auth.role() = 'service_role');

CREATE POLICY "Service role can upload category images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'category-images' AND auth.role() = 'service_role');

CREATE POLICY "Service role can upload general images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'general-images' AND auth.role() = 'service_role');

-- سياسة التحديث للخادم
CREATE POLICY "Service role can update restaurant images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'restaurant-images' AND auth.role() = 'service_role');

CREATE POLICY "Service role can update menu item images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'menu-item-images' AND auth.role() = 'service_role');

CREATE POLICY "Service role can update offer images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'offer-images' AND auth.role() = 'service_role');

CREATE POLICY "Service role can update category images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'category-images' AND auth.role() = 'service_role');

CREATE POLICY "Service role can update general images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'general-images' AND auth.role() = 'service_role');

-- سياسة الحذف للخادم
CREATE POLICY "Service role can delete restaurant images"
ON storage.objects FOR DELETE
USING (bucket_id = 'restaurant-images' AND auth.role() = 'service_role');

CREATE POLICY "Service role can delete menu item images"
ON storage.objects FOR DELETE
USING (bucket_id = 'menu-item-images' AND auth.role() = 'service_role');

CREATE POLICY "Service role can delete offer images"
ON storage.objects FOR DELETE
USING (bucket_id = 'offer-images' AND auth.role() = 'service_role');

CREATE POLICY "Service role can delete category images"
ON storage.objects FOR DELETE
USING (bucket_id = 'category-images' AND auth.role() = 'service_role');

CREATE POLICY "Service role can delete general images"
ON storage.objects FOR DELETE
USING (bucket_id = 'general-images' AND auth.role() = 'service_role');

-- تفعيل RLS على جدول storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;