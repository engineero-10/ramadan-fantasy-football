/**
 * Database Seed File
 * Creates sample data for development/testing
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 بدء زراعة البيانات...');

  // Create Admin User
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ramadan-fantasy.com' },
    update: { password: adminPassword },
    create: {
      email: 'admin@ramadan-fantasy.com',
      name: 'المشرف',
      password: adminPassword,
      role: 'ADMIN'
    }
  });
  console.log('✅ تم إنشاء المشرف:', admin.email);

  // Create Test User
  const userPassword = await bcrypt.hash('user123', 12);
  const user = await prisma.user.upsert({
    where: { email: 'user@ramadan-fantasy.com' },
    update: { password: userPassword },
    create: {
      email: 'user@ramadan-fantasy.com',
      name: 'أحمد محمد',
      password: userPassword,
      role: 'USER'
    }
  });
  console.log('✅ تم إنشاء المستخدم:', user.email);

  // Create a sample league
  const league = await prisma.league.upsert({
    where: { code: 'RMDN2026' },
    update: {},
    create: {
      name: 'دوري رمضان 2026',
      description: 'دوري الفانتازي الرسمي لشهر رمضان المبارك 2026',
      code: 'RMDN2026',
      maxTeams: 20,
      playersPerTeam: 12,
      startingPlayers: 8,
      substitutes: 4,
      maxPlayersPerRealTeam: 2,
      budget: 100,
      maxTransfersPerRound: 2,
      createdById: admin.id
    }
  });
  console.log('✅ تم إنشاء الدوري:', league.name);

  // Add admin as league member
  await prisma.leagueMember.upsert({
    where: { userId_leagueId: { userId: admin.id, leagueId: league.id } },
    update: {},
    create: { userId: admin.id, leagueId: league.id }
  });

  // Create sample teams
  const teamsData = [
    { name: 'الأهلي', shortName: 'AHL' },
    { name: 'الزمالك', shortName: 'ZML' },
    { name: 'الاتحاد', shortName: 'ITD' },
    { name: 'النصر', shortName: 'NSR' },
    { name: 'الهلال', shortName: 'HLL' },
    { name: 'الشباب', shortName: 'SHB' },
    { name: 'الاتفاق', shortName: 'ITF' },
    { name: 'التعاون', shortName: 'TWN' }
  ];

  const teams = [];
  for (const teamData of teamsData) {
    const team = await prisma.team.upsert({
      where: { name_leagueId: { name: teamData.name, leagueId: league.id } },
      update: {},
      create: {
        name: teamData.name,
        shortName: teamData.shortName,
        leagueId: league.id
      }
    });
    teams.push(team);
  }
  console.log('✅ تم إنشاء', teams.length, 'فريق');

  // Create sample players for each team
  const positions = ['GOALKEEPER', 'DEFENDER', 'DEFENDER', 'MIDFIELDER', 'MIDFIELDER', 'FORWARD'];
  const playerNames = {
    GOALKEEPER: ['محمد الشناوي', 'أحمد الشناوي', 'عبدالله المعيوف', 'محمد العويس', 'مارتن كامبانها', 'فيصل الملكي', 'ياسر المسيليم', 'أحمد مدبولي'],
    DEFENDER: ['علي معلول', 'أحمد فتحي', 'ياسر الشهراني', 'سلطان الغنام', 'محمد البريك', 'عبدالله المالكي', 'أحمد هيكل', 'محمد عبدالشافي', 'أيمن أشرف', 'سعد بقير', 'فيصل الكنداري', 'علي الحبسي', 'أحمد حجازي', 'محمود علاء', 'محمد عبدالمنعم', 'أيمن الكاشف'],
    MIDFIELDER: ['حسين الشحات', 'محمد مجدي', 'سالم الدوسري', 'عبدالفتاح آدم', 'حامد صالح', 'محمد كنو', 'فهد المولد', 'عبدالإله المالكي', 'رمضان صبحي', 'طاهر محمد طاهر', 'ليو', 'كاريلو', 'البرقان', 'فيتينيو', 'تاليسكا', 'ميشائيل'],
    FORWARD: ['محمد شريف', 'بيرسي تاو', 'كريستيانو رونالدو', 'أوديون إيغالو', 'أندرسون تاليسكا', 'ميشائيل', 'فينسيوس', 'أحمد عبدالقادر']
  };

  const prices = {
    GOALKEEPER: [6.5, 5.5, 5.0, 4.5],
    DEFENDER: [6.0, 5.5, 5.0, 4.5, 4.0],
    MIDFIELDER: [8.5, 7.5, 7.0, 6.5, 6.0, 5.5],
    FORWARD: [10.0, 9.0, 8.5, 8.0, 7.5]
  };

  let playerCount = 0;
  for (const team of teams) {
    const teamIndex = teams.indexOf(team);
    
    // Add goalkeeper
    await prisma.player.create({
      data: {
        name: playerNames.GOALKEEPER[teamIndex] || `حارس ${team.name}`,
        position: 'GOALKEEPER',
        price: prices.GOALKEEPER[teamIndex % prices.GOALKEEPER.length],
        teamId: team.id,
        leagueId: league.id
      }
    });
    playerCount++;

    // Add 2 defenders
    for (let i = 0; i < 2; i++) {
      await prisma.player.create({
        data: {
          name: playerNames.DEFENDER[(teamIndex * 2 + i) % playerNames.DEFENDER.length],
          position: 'DEFENDER',
          price: prices.DEFENDER[(teamIndex + i) % prices.DEFENDER.length],
          teamId: team.id,
          leagueId: league.id
        }
      });
      playerCount++;
    }

    // Add 2 midfielders
    for (let i = 0; i < 2; i++) {
      await prisma.player.create({
        data: {
          name: playerNames.MIDFIELDER[(teamIndex * 2 + i) % playerNames.MIDFIELDER.length],
          position: 'MIDFIELDER',
          price: prices.MIDFIELDER[(teamIndex + i) % prices.MIDFIELDER.length],
          teamId: team.id,
          leagueId: league.id
        }
      });
      playerCount++;
    }

    // Add 1 forward
    await prisma.player.create({
      data: {
        name: playerNames.FORWARD[teamIndex % playerNames.FORWARD.length],
        position: 'FORWARD',
        price: prices.FORWARD[teamIndex % prices.FORWARD.length],
        teamId: team.id,
        leagueId: league.id
      }
    });
    playerCount++;
  }
  console.log('✅ تم إنشاء', playerCount, 'لاعب');

  // Create sample rounds
  const now = new Date();
  const rounds = [];
  for (let i = 1; i <= 5; i++) {
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() + (i - 1) * 7);
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    
    const lockTime = new Date(startDate);
    lockTime.setHours(lockTime.getHours() - 2);

    const round = await prisma.round.upsert({
      where: { roundNumber_leagueId: { roundNumber: i, leagueId: league.id } },
      update: {},
      create: {
        name: `الجولة ${i}`,
        roundNumber: i,
        leagueId: league.id,
        startDate,
        endDate,
        lockTime,
        transfersOpen: i === 1
      }
    });
    rounds.push(round);
  }
  console.log('✅ تم إنشاء', rounds.length, 'جولة');

  // Create sample matches for round 1
  const round1Matches = [
    { home: 0, away: 1 }, // الأهلي vs الزمالك
    { home: 2, away: 3 }, // الاتحاد vs النصر
    { home: 4, away: 5 }, // الهلال vs الشباب
    { home: 6, away: 7 }  // الاتفاق vs التعاون
  ];

  for (const matchData of round1Matches) {
    const matchDate = new Date(rounds[0].startDate);
    matchDate.setHours(20, 0, 0, 0);
    
    await prisma.match.create({
      data: {
        homeTeamId: teams[matchData.home].id,
        awayTeamId: teams[matchData.away].id,
        roundId: rounds[0].id,
        matchDate
      }
    });
  }
  console.log('✅ تم إنشاء', round1Matches.length, 'مباراة للجولة الأولى');

  console.log('\n🎉 اكتملت زراعة البيانات بنجاح!');
  console.log('\n📋 بيانات تسجيل الدخول:');
  console.log('   المشرف: admin@ramadan-fantasy.com / admin123');
  console.log('   المستخدم: user@ramadan-fantasy.com / user123');
  console.log('   رمز الدوري: RMDN2026');
}

main()
  .catch((e) => {
    console.error('❌ خطأ في زراعة البيانات:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
