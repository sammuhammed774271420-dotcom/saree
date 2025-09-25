import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { randomUUID } from 'crypto';

const router = express.Router();

// إعداد مجلدات التخزين
const UPLOAD_DIRS = {
  restaurants: 'uploads/restaurants',
  menuItems: 'uploads/menu-items',
  offers: 'uploads/offers',
  categories: 'uploads/categories',
  general: 'uploads/general'
};

// إنشاء المجلدات إذا لم تكن موجودة
Object.values(UPLOAD_DIRS).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// إعداد multer للتعامل مع رفع الملفات
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB حد أقصى
  },
  fileFilter: (req, file, cb) => {
    // التحقق من نوع الملف
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('نوع الملف غير مدعوم. يرجى رفع صورة بصيغة JPG, PNG, أو WebP'));
    }
  }
});

// دالة تحسين الصورة
async function optimizeImage(buffer: Buffer, options: {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
} = {}): Promise<Buffer> {
  const {
    width = 800,
    height = 600,
    quality = 85,
    format = 'jpeg'
  } = options;

  return sharp(buffer)
    .resize(width, height, {
      fit: 'cover',
      position: 'center'
    })
    .toFormat(format, { quality })
    .toBuffer();
}

// دالة إنشاء اسم ملف فريد
function generateUniqueFilename(originalName: string, category: string): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const extension = path.extname(originalName).toLowerCase();
  return `${timestamp}-${randomId}${extension}`;
}

// رفع صورة واحدة
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'لم يتم اختيار ملف'
      });
    }

    const { category = 'general', optimize = 'true' } = req.body;
    
    // التحقق من صحة الفئة
    if (!UPLOAD_DIRS[category as keyof typeof UPLOAD_DIRS]) {
      return res.status(400).json({
        success: false,
        message: 'فئة غير صحيحة'
      });
    }

    // إنشاء اسم ملف فريد
    const filename = generateUniqueFilename(req.file.originalname, category);
    const uploadDir = UPLOAD_DIRS[category as keyof typeof UPLOAD_DIRS];
    const filePath = path.join(uploadDir, filename);

    let imageBuffer = req.file.buffer;

    // تحسين الصورة إذا كان مطلوباً
    if (optimize === 'true') {
      const optimizationOptions: any = {};
      
      // إعدادات مختلفة حسب الفئة
      switch (category) {
        case 'restaurants':
          optimizationOptions.width = 800;
          optimizationOptions.height = 400;
          break;
        case 'menuItems':
          optimizationOptions.width = 400;
          optimizationOptions.height = 300;
          break;
        case 'offers':
          optimizationOptions.width = 600;
          optimizationOptions.height = 300;
          break;
        default:
          optimizationOptions.width = 500;
          optimizationOptions.height = 400;
      }

      imageBuffer = await optimizeImage(imageBuffer, optimizationOptions);
    }

    // حفظ الملف
    await fs.promises.writeFile(filePath, imageBuffer);

    // إنشاء الرابط العام
    const publicUrl = `/uploads/${category}/${filename}`;

    // إنشاء نسخة مصغرة للمعاينة
    const thumbnailBuffer = await optimizeImage(imageBuffer, {
      width: 150,
      height: 150,
      quality: 70
    });
    
    const thumbnailFilename = `thumb_${filename}`;
    const thumbnailPath = path.join(uploadDir, thumbnailFilename);
    await fs.promises.writeFile(thumbnailPath, thumbnailBuffer);
    const thumbnailUrl = `/uploads/${category}/${thumbnailFilename}`;

    res.json({
      success: true,
      message: 'تم رفع الصورة بنجاح',
      data: {
        url: publicUrl,
        thumbnailUrl,
        filename,
        originalName: req.file.originalname,
        size: imageBuffer.length,
        category
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

// رفع صور متعددة
router.post('/upload-multiple', upload.array('images', 10), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'لم يتم اختيار ملفات'
      });
    }

    const { category = 'general', optimize = 'true' } = req.body;
    
    if (!UPLOAD_DIRS[category as keyof typeof UPLOAD_DIRS]) {
      return res.status(400).json({
        success: false,
        message: 'فئة غير صحيحة'
      });
    }

    const uploadedFiles = [];

    for (const file of files) {
      const filename = generateUniqueFilename(file.originalname, category);
      const uploadDir = UPLOAD_DIRS[category as keyof typeof UPLOAD_DIRS];
      const filePath = path.join(uploadDir, filename);

      let imageBuffer = file.buffer;

      if (optimize === 'true') {
        imageBuffer = await optimizeImage(imageBuffer);
      }

      await fs.promises.writeFile(filePath, imageBuffer);

      const publicUrl = `/uploads/${category}/${filename}`;
      
      uploadedFiles.push({
        url: publicUrl,
        filename,
        originalName: file.originalname,
        size: imageBuffer.length
      });
    }

    res.json({
      success: true,
      message: `تم رفع ${uploadedFiles.length} صورة بنجاح`,
      data: uploadedFiles
    });

  } catch (error) {
    console.error('خطأ في رفع الصور:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'حدث خطأ أثناء رفع الصور'
    });
  }
});

// حذف صورة
router.delete('/delete', async (req, res) => {
  try {
    const { url, category } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'رابط الصورة مطلوب'
      });
    }

    // استخراج اسم الملف من الرابط
    const filename = path.basename(url);
    const uploadDir = UPLOAD_DIRS[category as keyof typeof UPLOAD_DIRS] || UPLOAD_DIRS.general;
    const filePath = path.join(uploadDir, filename);

    // حذف الملف الأساسي
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }

    // حذف النسخة المصغرة إذا كانت موجودة
    const thumbnailPath = path.join(uploadDir, `thumb_${filename}`);
    if (fs.existsSync(thumbnailPath)) {
      await fs.promises.unlink(thumbnailPath);
    }

    res.json({
      success: true,
      message: 'تم حذف الصورة بنجاح'
    });

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
    
    if (!UPLOAD_DIRS[category as keyof typeof UPLOAD_DIRS]) {
      return res.status(400).json({
        success: false,
        message: 'فئة غير صحيحة'
      });
    }

    const uploadDir = UPLOAD_DIRS[category as keyof typeof UPLOAD_DIRS];
    const filePath = path.join(uploadDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'الصورة غير موجودة'
      });
    }

    const stats = await fs.promises.stat(filePath);
    
    res.json({
      success: true,
      data: {
        filename,
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        url: `/uploads/${category}/${filename}`
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