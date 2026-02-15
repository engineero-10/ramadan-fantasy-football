#!/usr/bin/env node
/**
 * Setup Owner Account Script
 * This creates the main owner account that can manage all admins
 * Usage: node scripts/setup-owner.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const prisma = new PrismaClient();

async function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

async function setupOwner() {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔑 إعداد حساب المالك (Owner)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  try {
    // Check if owner already exists
    const existingOwner = await prisma.user.findFirst({
      where: { role: 'OWNER' }
    });

    if (existingOwner) {
      console.log('⚠️  يوجد مالك بالفعل:');
      console.log(`   📧 ${existingOwner.email}`);
      console.log(`   👤 ${existingOwner.name}`);
      console.log('');
      
      const answer = await prompt('هل تريد استبداله؟ (نعم/لا): ');
      if (answer !== 'نعم') {
        console.log('تم الإلغاء');
        process.exit(0);
      }
      
      // Delete existing owner
      await prisma.user.delete({ where: { id: existingOwner.id } });
      console.log('✅ تم حذف المالك السابق');
    }

    // Get owner details
    const email = await prompt('📧 البريد الإلكتروني: ');
    const password = await prompt('🔐 كلمة المرور: ');
    const name = await prompt('👤 الاسم: ');

    // Validate
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ البريد الإلكتروني غير صالح');
      process.exit(1);
    }

    if (password.length < 6) {
      console.log('❌ كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      process.exit(1);
    }

    // Check if email exists
    const emailExists = await prisma.user.findUnique({ where: { email } });
    if (emailExists) {
      console.log('❌ البريد الإلكتروني مستخدم');
      process.exit(1);
    }

    // Create owner
    const hashedPassword = await bcrypt.hash(password, 12);
    const owner = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'OWNER'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ تم إنشاء حساب المالك بنجاح!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📧 البريد الإلكتروني: ${owner.email}`);
    console.log(`👤 الاسم: ${owner.name}`);
    console.log(`🔑 كلمة المرور: ${password}`);
    console.log(`🏆 الصلاحية: مالك النظام (OWNER)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('📋 صلاحياتك:');
    console.log('   - إنشاء وإدارة حسابات الأدمن');
    console.log('   - رؤية جميع الدوريات في النظام');
    console.log('   - التحكم الكامل في النظام');
    console.log('');

  } catch (error) {
    console.error('❌ خطأ:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupOwner();
