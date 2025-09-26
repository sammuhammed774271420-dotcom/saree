import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { storage } from './storage';
import { 
  type InsertAdminUser, 
  type User,
  type Driver,
  type AdminUser
} from '@shared/schema';

// نوع المستخدم الموحد للمصادقة
export interface AuthUser {
  id: string;
  name: string;
  username?: string;
  email?: string;
  phone?: string;
  userType: 'customer' | 'driver' | 'admin';
  isActive: boolean;
}

// نتيجة المصادقة
export interface AuthResult {
  success: boolean;
  token?: string;
  user?: AuthUser;
  message?: string;
}

// خدمة المصادقة المبسطة
export class SimpleAuthService {
  // البحث عن المدير بالبريد الإلكتروني أو اسم المستخدم
  async findAdminByIdentifier(identifier: string): Promise<AdminUser | null> {
    try {
      const admins = await storage.getAllAdminUsers();
      const admin = admins.find(a => 
        a.email === identifier || 
        a.username === identifier
      );
      return admin || null;
    } catch (error) {
      console.error('خطأ في البحث عن المدير:', error);
      return null;
    }
  }

  // البحث عن السائق برقم الهاتف
  async findDriverByPhone(phone: string): Promise<Driver | null> {
    try {
      const drivers = await storage.getAllDrivers();
      const driver = drivers.find(d => d.phone === phone);
      return driver || null;
    } catch (error) {
      console.error('خطأ في البحث عن السائق:', error);
      return null;
    }
  }

  // تسجيل دخول المدير
  async loginAdmin(identifier: string, password: string): Promise<AuthResult> {
    try {
      console.log('🔍 محاولة تسجيل دخول مدير:', identifier);
      
      // البحث عن المدير
      const admin = await this.findAdminByIdentifier(identifier);
      if (!admin) {
        return { 
          success: false, 
          message: 'بيانات الدخول غير صحيحة' 
        };
      }

      console.log('✅ تم العثور على المدير:', admin.name);

      // التحقق من حالة الحساب
      if (!admin.isActive) {
        return { 
          success: false, 
          message: 'الحساب غير مفعل' 
        };
      }

      // التحقق من كلمة المرور (مقارنة مباشرة بدون تشفير)
      if (password !== admin.password) {
        return { 
          success: false, 
          message: 'بيانات الدخول غير صحيحة' 
        };
      }

      // إنشاء رمز مميز بسيط
      const token = randomUUID();

      console.log('🎉 تم تسجيل الدخول بنجاح للمدير:', admin.name);
      
      return { 
        success: true, 
        token, 
        user: {
          id: admin.id,
          name: admin.name,
          username: admin.username || undefined,
          email: admin.email,
          phone: admin.phone || undefined,
          userType: 'admin',
          isActive: admin.isActive
        },
        message: 'تم تسجيل الدخول بنجاح' 
      };

    } catch (error) {
      console.error('خطأ في تسجيل الدخول:', error);
      return { 
        success: false, 
        message: 'حدث خطأ في الخادم' 
      };
    }
  }

  // تسجيل دخول السائق
  async loginDriver(phone: string, password: string): Promise<AuthResult> {
    try {
      console.log('🔍 محاولة تسجيل دخول سائق:', phone);
      
      // البحث عن السائق
      const driver = await this.findDriverByPhone(phone);
      if (!driver) {
        return { 
          success: false, 
          message: 'بيانات الدخول غير صحيحة' 
        };
      }

      console.log('✅ تم العثور على السائق:', driver.name);

      // التحقق من حالة الحساب
      if (!driver.isActive) {
        return { 
          success: false, 
          message: 'الحساب غير مفعل' 
        };
      }

      // التحقق من كلمة المرور (مقارنة مباشرة بدون تشفير)
      if (password !== driver.password) {
        return { 
          success: false, 
          message: 'بيانات الدخول غير صحيحة' 
        };
      }

      // إنشاء رمز مميز بسيط
      const token = randomUUID();

      console.log('🎉 تم تسجيل الدخول بنجاح للسائق:', driver.name);
      
      return { 
        success: true, 
        token, 
        user: {
          id: driver.id,
          name: driver.name,
          phone: driver.phone,
          userType: 'driver',
          isActive: driver.isActive
        },
        message: 'تم تسجيل الدخول بنجاح' 
      };

    } catch (error) {
      console.error('خطأ في تسجيل الدخول:', error);
      return { 
        success: false, 
        message: 'حدث خطأ في الخادم' 
      };
    }
  }
}

// إنشاء مثيل خدمة المصادقة المبسطة
export const simpleAuthService = new SimpleAuthService();