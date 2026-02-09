/**
 * Points Configuration
 * Fantasy Football Points System
 */

const POINTS_CONFIG = {
  // نقاط الهدف - Goal points
  GOAL: 5,
  
  // نقاط التمريرة الحاسمة - Assist points
  ASSIST: 3,
  
  // نقاط المشاركة في المباراة - Match participation
  PLAYED_MATCH: 1,
  
  // البطاقة الصفراء - Yellow card
  YELLOW_CARD: -1,
  
  // البطاقة الحمراء - Red card
  RED_CARD: -4,
  
  // الشباك النظيفة (حارس المرمى) - Clean sheet (Goalkeeper)
  CLEAN_SHEET_GOALKEEPER: 5,
  
  // صد ركلة جزاء - Penalty save
  PENALTY_SAVE: 5,
  
  // نقاط إضافية للمدافعين عند الشباك النظيفة
  CLEAN_SHEET_DEFENDER: 3,
  
  // نقاط إضافية للاعبي الوسط عند الشباك النظيفة
  CLEAN_SHEET_MIDFIELDER: 1
};

/**
 * Calculate player points based on match stats
 * @param {Object} stats - Player match statistics
 * @param {string} position - Player position
 * @returns {number} Total points
 */
function calculatePlayerPoints(stats, position) {
  let points = 0;
  
  // تحقق من المشاركة في المباراة
  if (stats.minutesPlayed > 0) {
    points += POINTS_CONFIG.PLAYED_MATCH;
  }
  
  // الأهداف
  points += stats.goals * POINTS_CONFIG.GOAL;
  
  // التمريرات الحاسمة
  points += stats.assists * POINTS_CONFIG.ASSIST;
  
  // البطاقات الصفراء
  points += stats.yellowCards * POINTS_CONFIG.YELLOW_CARD;
  
  // البطاقات الحمراء
  points += stats.redCards * POINTS_CONFIG.RED_CARD;
  
  // الشباك النظيفة
  if (stats.cleanSheet) {
    switch (position) {
      case 'GOALKEEPER':
        points += POINTS_CONFIG.CLEAN_SHEET_GOALKEEPER;
        break;
      case 'DEFENDER':
        points += POINTS_CONFIG.CLEAN_SHEET_DEFENDER;
        break;
      case 'MIDFIELDER':
        points += POINTS_CONFIG.CLEAN_SHEET_MIDFIELDER;
        break;
    }
  }
  
  // صد ركلات الجزاء (لحراس المرمى)
  if (position === 'GOALKEEPER') {
    points += stats.penaltySaves * POINTS_CONFIG.PENALTY_SAVE;
  }
  
  return points;
}

module.exports = { POINTS_CONFIG, calculatePlayerPoints };
