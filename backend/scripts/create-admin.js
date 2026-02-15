#!/usr/bin/env node
/**
 * Create Admin Account Script
 * Usage: node scripts/create-admin.js <email> <password> <name>
 * Example: node scripts/create-admin.js admin@example.com StrongPass123 "أحمد محمد"
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.log('❌ Usage: node scripts/create-admin.js <email> <password> <name>');
    console.log('   Example: node scripts/create-admin.js client@fantasy.com Pass123! "محمد أحمد"');
    process.exit(1);
  }

  const [email, password, name] = args;

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.log('❌ البريد الإلكتروني غير صالح');
    process.exit(1);
  }

  // Validate password (min 6 characters)
  if (password.length < 6) {
    console.log('❌ كلمة المرور يجب أن تكون 6 أحرف على الأقل');
    process.exit(1);
  }

  try {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('❌ البريد الإلكتروني مسجل مسبقاً');
      process.exit(1);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'ADMIN'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    console.log('');
    console.log('✅ تم إنشاء حساب الأدمن بنجاح!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📧 البريد الإلكتروني: ${admin.email}`);
    console.log(`👤 الاسم: ${admin.name}`);
    console.log(`🔑 كلمة المرور: ${password}`);
    console.log(`🆔 ID: ${admin.id}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('📋 يمكن للعميل الآن تسجيل الدخول وإنشاء الدوري الخاص به');
    console.log('');

  } catch (error) {
    console.error('❌ خطأ في إنشاء الحساب:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
