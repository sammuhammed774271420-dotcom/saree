import express from 'express';
import multer from 'multer';
import { randomUUID } from 'crypto';
import { 
  uploadImageToSupabase, 
  deleteImageFromSupabase, 
  extractFilePathFromUrl,
  STORAGE_BUCKETS,
  ensureBucketsExist
} from './supabase';

const router = express.Router();

// إعداد multer للتعامل مع رفع الملفات في الذاكرة
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB حد أقصى
  },
  fileFilter: (req, file, cb) => {
    // التحقق من نوع الملف
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('نوع الملف غير مدعوم. يرجى رفع صورة بصيغة JPG, PNG, WebP, أو GIF'));
    }
  }
});

// دالة إنشاء اسم ملف فريد
function generateUniqueFilename(originalName: string, category: string): string {
  const timestamp = Date.now();
  const randomId = randomUUID().substring(0, 8);
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  return `${category}/${timestamp}-${randomId}.${extension}`;
}

// التأكد من إنشاء buckets عند بدء الخادم
ensureBucketsExist().catch(console.error);

// رفع صورة واحدة إلى Supabase
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'لم يتم اختيار ملف'
      });
    }

    const { category = 'general' } = req.body;
    
    // التحقق من صحة الفئة
    const bucketName = STORAGE_BUCKETS[category as keyof typeof STORAGE_BUCKETS];
    if (!bucketName) {
      return res.status(400).json({
        success: false,
        message: 'فئة غير صحيحة'
      });
    }

    // إنشاء اسم ملف فريد
    const fileName = generateUniqueFilename(req.file.originalname, category);

    // رفع الصورة إلى Supabase
    const uploadResult = await uploadImageToSupabase(
      req.file.buffer,
      fileName,
      bucketName,
      req.file.mimetype
    );

    if (!uploadResult) {
      return res.status(500).json({
        success: false,
        message: 'فشل في رفع الصورة إلى التخزين السحابي'
      });
    }

    res.json({
      success: true,
      message: 'تم رفع الصورة بنجاح',
      data: {
        url: uploadResult.url,
        path: uploadResult.path,
        filename: fileName,
        originalName: req.file.originalname,
        size: req.file.size,
        category,
        bucketName
      }
    });

  } catch (error) {
    console.error('خطأ في رفع الصورة:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'حدث خطأ أثناء رفع الصورة'
    });
  }
});

// رفع صور متعددة إلى Supabase
router.post('/upload-multiple', upload.array('images', 10), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'لم يتم اختيار ملفات'
      });
    }

    const { category = 'general' } = req.body;
    
    const bucketName = STORAGE_BUCKETS[category as keyof typeof STORAGE_BUCKETS];
    if (!bucketName) {
      return res.status(400).json({
        success: false,
        message: 'فئة غير صحيحة'
      });
    }

    const uploadedFiles = [];
    const failedFiles = [];

    for (const file of files) {
      const fileName = generateUniqueFilename(file.originalname, category);
      
      const uploadResult = await uploadImageToSupabase(
        file.buffer,
        fileName,
        bucketName,
        file.mimetype
      );

      if (uploadResult) {
        uploadedFiles.push({
          url: uploadResult.url,
          path: uploadResult.path,
          filename: fileName,
          originalName: file.originalname,
          size: file.size
        });
      } else {
        failedFiles.push(file.originalname);
      }
    }

    res.json({
      success: uploadedFiles.length > 0,
      message: `تم رفع ${uploadedFiles.length} من ${files.length} صورة بنجاح`,
      data: uploadedFiles,
      failed: failedFiles
    });

  } catch (error) {
    console.error('خطأ في رفع الصور:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'حدث خطأ أثناء رفع الصور'
    });
  }
});

// حذف صورة من Supabase
router.delete('/delete', async (req, res) => {
  try {
    const { url, category } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'رابط الصورة مطلوب'
      });
    }

    const bucketName = STORAGE_BUCKETS[category as keyof typeof STORAGE_BUCKETS];
    if (!bucketName) {
      return res.status(400).json({
        success: false,
        message: 'فئة غير صحيحة'
      });
    }

    // استخراج مسار الملف من الرابط
    const filePath = extractFilePathFromUrl(url, bucketName);
    if (!filePath) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن استخراج مسار الملف من الرابط'
      });
    }

    // حذف الصورة من Supabase
    const deleteSuccess = await deleteImageFromSupabase(filePath, bucketName);

    if (deleteSuccess) {
      res.json({
        success: true,
        message: 'تم حذف الصورة بنجاح'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'فشل في حذف الصورة'
      });
    }

  } catch (error) {
    console.error('خطأ في حذف الصورة:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف الصورة'
    });
  }
});

// الحصول على معلومات الصورة
router.get('/info/:category/:filename', async (req, res) => {
  try {
    const { category, filename } = req.params;
    
    const bucketName = STORAGE_BUCKETS[category as keyof typeof STORAGE_BUCKETS];
    if (!bucketName) {
      return res.status(400).json({
        success: false,
        message: 'فئة غير صحيحة'
      });
    }

    // الحصول على معلومات الملف من Supabase
    const { data, error } = await supabaseClient.storage
      .from(bucketName)
      .list(category, {
        search: filename
      });

    if (error || !data || data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'الصورة غير موجودة'
      });
    }

    const fileInfo = data[0];
    
    res.json({
      success: true,
      data: {
        filename: fileInfo.name,
        size: fileInfo.metadata?.size || 0,
        createdAt: fileInfo.created_at,
        modifiedAt: fileInfo.updated_at,
        url: `${process.env.SUPABASE_URL}/storage/v1/object/public/${bucketName}/${category}/${filename}`
      }
    });

  } catch (error) {
    console.error('خطأ في الحصول على معلومات الصورة:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء الحصول على معلومات الصورة'
    });
  }
});

export default router;