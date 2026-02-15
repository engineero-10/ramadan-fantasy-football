#!/usr/bin/env node
/**
 * Delete Admin Account Script
 * Usage: node scripts/delete-admin.js <email>
 * Example: node scripts/delete-admin.js client@fantasy.com
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteAdmin() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log('❌ Usage: node scripts/delete-admin.js <email>');
    console.log('   Example: node scripts/delete-admin.js client@fantasy.com');
    process.exit(1);
  }

  const [email] = args;

  try {
    // Find the admin
    const admin = await prisma.user.findUnique({
      where: { email },
      include: {
        leagues: {
          select: {
            id: true,
            name: true,
            _count: { select: { members: true } }
          }
        }
      }
    });

    if (!admin) {
      console.log('❌ المستخدم غير موجود');
      process.exit(1);
    }

    if (admin.role !== 'ADMIN') {
      console.log('❌ هذا المستخدم ليس أدمن');
      process.exit(1);
    }

    // Warning about leagues
    if (admin.leagues.length > 0) {
      console.log('');
      console.log('⚠️  تحذير: هذا الأدمن لديه دوري:');
      admin.leagues.forEach(league => {
        console.log(`   - ${league.name} (${league._count.members} عضو)`);
      });
      console.log('');
      console.log('حذف الأدمن سيؤدي لحذف الدوري وجميع بياناته!');
      console.log('');
      
      // Ask for confirmation
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise(resolve => {
        rl.question('هل أنت متأكد؟ اكتب "نعم" للتأكيد: ', resolve);
      });
      rl.close();

      if (answer !== 'نعم') {
        console.log('تم الإلغاء');
        process.exit(0);
      }
    }

    // Delete admin and their leagues (cascade should handle the rest)
    // First delete leagues
    for (const league of admin.leagues) {
      await prisma.league.delete({ where: { id: league.id } });
    }

    // Then delete admin
    await prisma.user.delete({ where: { id: admin.id } });

    console.log('');
    console.log('✅ تم حذف الأدمن بنجاح');
    console.log(`   📧 ${admin.email}`);
    console.log(`   👤 ${admin.name}`);
    console.log('');

  } catch (error) {
    console.error('❌ خطأ في الحذف:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAdmin();
