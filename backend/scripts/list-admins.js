#!/usr/bin/env node
/**
 * List All Admin Accounts Script
 * Usage: node scripts/list-admins.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listAdmins() {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        leagues: {
          select: {
            id: true,
            name: true,
            code: true,
            isActive: true,
            _count: {
              select: { members: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (admins.length === 0) {
      console.log('');
      console.log('⚠️ لا يوجد حسابات أدمن');
      console.log('');
      console.log('لإنشاء حساب أدمن جديد:');
      console.log('  npm run create-admin <email> <password> <name>');
      console.log('');
      process.exit(0);
    }

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 قائمة حسابات الأدمن');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.name}`);
      console.log(`   📧 البريد: ${admin.email}`);
      console.log(`   🆔 ID: ${admin.id}`);
      console.log(`   📅 تاريخ الإنشاء: ${admin.createdAt.toLocaleDateString('ar-EG')}`);
      
      if (admin.leagues.length > 0) {
        console.log(`   🏆 الدوري: ${admin.leagues[0].name}`);
        console.log(`      - الكود: ${admin.leagues[0].code}`);
        console.log(`      - الأعضاء: ${admin.leagues[0]._count.members}`);
        console.log(`      - نشط: ${admin.leagues[0].isActive ? '✅' : '❌'}`);
      } else {
        console.log(`   🏆 الدوري: لم ينشئ دوري بعد`);
      }
      console.log('');
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`إجمالي الأدمن: ${admins.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

  } catch (error) {
    console.error('❌ خطأ:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

listAdmins();
