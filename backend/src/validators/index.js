/**
 * Input Validators
 * Using express-validator
 */

const { body, param, query } = require('express-validator');

// ==================== AUTH VALIDATORS ====================

const registerValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('الاسم مطلوب')
    .isLength({ min: 2, max: 100 }).withMessage('الاسم يجب أن يكون بين 2 و 100 حرف'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('البريد الإلكتروني مطلوب')
    .isEmail().withMessage('البريد الإلكتروني غير صالح')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('كلمة المرور مطلوبة')
    .isLength({ min: 6 }).withMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
];

const loginValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('البريد الإلكتروني مطلوب')
    .isEmail().withMessage('البريد الإلكتروني غير صالح'),
  
  body('password')
    .notEmpty().withMessage('كلمة المرور مطلوبة')
];

// ==================== LEAGUE VALIDATORS ====================

const createLeagueValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('اسم الدوري مطلوب')
    .isLength({ min: 3, max: 100 }).withMessage('اسم الدوري يجب أن يكون بين 3 و 100 حرف'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('الوصف يجب ألا يتجاوز 500 حرف'),
  
  body('maxTeams')
    .optional()
    .isInt({ min: 2, max: 50 }).withMessage('عدد الفرق يجب أن يكون بين 2 و 50'),
  
  body('playersPerTeam')
    .optional()
    .isInt({ min: 5, max: 20 }).withMessage('عدد اللاعبين يجب أن يكون بين 5 و 20'),
  
  body('startingPlayers')
    .optional()
    .isInt({ min: 3, max: 15 }).withMessage('عدد اللاعبين الأساسيين يجب أن يكون بين 3 و 15'),
  
  body('substitutes')
    .optional()
    .isInt({ min: 0, max: 10 }).withMessage('عدد البدلاء يجب أن يكون بين 0 و 10'),
  
  body('maxPlayersPerRealTeam')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('الحد الأقصى من اللاعبين لكل فريق يجب أن يكون بين 1 و 5'),
  
  body('budget')
    .optional()
    .isFloat({ min: 10, max: 1000 }).withMessage('الميزانية يجب أن تكون بين 10 و 1000'),
  
  body('maxTransfersPerRound')
    .optional()
    .isInt({ min: 0, max: 10 }).withMessage('الحد الأقصى للانتقالات يجب أن يكون بين 0 و 10')
];

const joinLeagueValidator = [
  body('code')
    .trim()
    .notEmpty().withMessage('رمز الدوري مطلوب')
    .isLength({ min: 4, max: 20 }).withMessage('رمز الدوري يجب أن يكون بين 4 و 20 حرف')
];

// ==================== TEAM VALIDATORS ====================

const createTeamValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('اسم الفريق مطلوب')
    .isLength({ min: 2, max: 100 }).withMessage('اسم الفريق يجب أن يكون بين 2 و 100 حرف'),
  
  body('shortName')
    .optional()
    .trim()
    .isLength({ max: 5 }).withMessage('الاسم المختصر يجب ألا يتجاوز 5 أحرف'),
  
  body('leagueId')
    .notEmpty().withMessage('معرف الدوري مطلوب')
    .isInt().withMessage('معرف الدوري يجب أن يكون رقماً')
];

// ==================== PLAYER VALIDATORS ====================

const createPlayerValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('اسم اللاعب مطلوب')
    .isLength({ min: 2, max: 100 }).withMessage('اسم اللاعب يجب أن يكون بين 2 و 100 حرف'),
  
  body('position')
    .notEmpty().withMessage('مركز اللاعب مطلوب')
    .isIn(['GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'FORWARD'])
    .withMessage('مركز اللاعب غير صالح'),
  
  body('price')
    .notEmpty().withMessage('سعر اللاعب مطلوب')
    .isFloat({ min: 0.5, max: 50 }).withMessage('سعر اللاعب يجب أن يكون بين 0.5 و 50'),
  
  body('teamId')
    .notEmpty().withMessage('معرف الفريق مطلوب')
    .isInt().withMessage('معرف الفريق يجب أن يكون رقماً'),
  
  body('leagueId')
    .notEmpty().withMessage('معرف الدوري مطلوب')
    .isInt().withMessage('معرف الدوري يجب أن يكون رقماً')
];

// ==================== MATCH VALIDATORS ====================

const createMatchValidator = [
  body('homeTeamId')
    .notEmpty().withMessage('الفريق المضيف مطلوب')
    .isInt().withMessage('معرف الفريق المضيف يجب أن يكون رقماً'),
  
  body('awayTeamId')
    .notEmpty().withMessage('الفريق الضيف مطلوب')
    .isInt().withMessage('معرف الفريق الضيف يجب أن يكون رقماً'),
  
  body('roundId')
    .notEmpty().withMessage('معرف الجولة مطلوب')
    .isInt().withMessage('معرف الجولة يجب أن يكون رقماً'),
  
  body('matchDate')
    .notEmpty().withMessage('تاريخ المباراة مطلوب')
    .isISO8601().withMessage('تاريخ المباراة غير صالح')
];

const updateMatchResultValidator = [
  body('homeScore')
    .notEmpty().withMessage('نتيجة الفريق المضيف مطلوبة')
    .isInt({ min: 0 }).withMessage('النتيجة يجب أن تكون رقماً موجباً'),
  
  body('awayScore')
    .notEmpty().withMessage('نتيجة الفريق الضيف مطلوبة')
    .isInt({ min: 0 }).withMessage('النتيجة يجب أن تكون رقماً موجباً')
];

// ==================== MATCH STATS VALIDATORS ====================

const updateMatchStatsValidator = [
  body('stats')
    .isArray({ min: 1 }).withMessage('إحصائيات اللاعبين مطلوبة'),
  
  body('stats.*.playerId')
    .notEmpty().withMessage('معرف اللاعب مطلوب')
    .isInt().withMessage('معرف اللاعب يجب أن يكون رقماً'),
  
  body('stats.*.minutesPlayed')
    .optional()
    .isInt({ min: 0, max: 120 }).withMessage('دقائق اللعب يجب أن تكون بين 0 و 120'),
  
  body('stats.*.goals')
    .optional()
    .isInt({ min: 0, max: 10 }).withMessage('الأهداف يجب أن تكون بين 0 و 10'),
  
  body('stats.*.assists')
    .optional()
    .isInt({ min: 0, max: 10 }).withMessage('التمريرات الحاسمة يجب أن تكون بين 0 و 10'),
  
  body('stats.*.yellowCards')
    .optional()
    .isInt({ min: 0, max: 2 }).withMessage('البطاقات الصفراء يجب أن تكون بين 0 و 2'),
  
  body('stats.*.redCards')
    .optional()
    .isInt({ min: 0, max: 1 }).withMessage('البطاقات الحمراء يجب أن تكون 0 أو 1'),
  
  body('stats.*.cleanSheet')
    .optional()
    .isBoolean().withMessage('الشباك النظيفة يجب أن تكون صح أو خطأ'),
  
  body('stats.*.penaltySaves')
    .optional()
    .isInt({ min: 0, max: 5 }).withMessage('صد الركلات يجب أن تكون بين 0 و 5')
];

// ==================== ROUND VALIDATORS ====================

const createRoundValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('اسم الجولة مطلوب')
    .isLength({ min: 2, max: 100 }).withMessage('اسم الجولة يجب أن يكون بين 2 و 100 حرف'),
  
  body('roundNumber')
    .notEmpty().withMessage('رقم الجولة مطلوب')
    .isInt({ min: 1 }).withMessage('رقم الجولة يجب أن يكون رقماً موجباً'),
  
  body('leagueId')
    .notEmpty().withMessage('معرف الدوري مطلوب')
    .isInt().withMessage('معرف الدوري يجب أن يكون رقماً'),
  
  body('startDate')
    .notEmpty().withMessage('تاريخ البداية مطلوب')
    .isISO8601().withMessage('تاريخ البداية غير صالح'),
  
  body('endDate')
    .notEmpty().withMessage('تاريخ النهاية مطلوب')
    .isISO8601().withMessage('تاريخ النهاية غير صالح')
];

// ==================== FANTASY TEAM VALIDATORS ====================

const createFantasyTeamValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('اسم الفريق مطلوب')
    .isLength({ min: 2, max: 100 }).withMessage('اسم الفريق يجب أن يكون بين 2 و 100 حرف'),
  
  body('leagueId')
    .notEmpty().withMessage('معرف الدوري مطلوب')
    .isInt().withMessage('معرف الدوري يجب أن يكون رقماً'),
  
  body('players')
    .isArray({ min: 1 }).withMessage('يجب اختيار اللاعبين'),
  
  body('players.*.playerId')
    .notEmpty().withMessage('معرف اللاعب مطلوب')
    .isInt().withMessage('معرف اللاعب يجب أن يكون رقماً'),
  
  body('players.*.isStarter')
    .isBoolean().withMessage('حالة اللاعب يجب أن تكون صح أو خطأ')
];

// ==================== TRANSFER VALIDATORS ====================

const createTransferValidator = [
  body('fantasyTeamId')
    .notEmpty().withMessage('معرف الفريق الخيالي مطلوب')
    .isInt().withMessage('معرف الفريق الخيالي يجب أن يكون رقماً'),
  
  body('playerInId')
    .notEmpty().withMessage('معرف اللاعب الجديد مطلوب')
    .isInt().withMessage('معرف اللاعب يجب أن يكون رقماً'),
  
  body('playerOutId')
    .notEmpty().withMessage('معرف اللاعب المستبعد مطلوب')
    .isInt().withMessage('معرف اللاعب يجب أن يكون رقماً')
];

// ==================== PAGINATION VALIDATORS ====================

const paginationValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('رقم الصفحة يجب أن يكون رقماً موجباً'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('حد العناصر يجب أن يكون بين 1 و 100')
];

// ==================== ID PARAM VALIDATOR ====================

const idParamValidator = [
  param('id')
    .isInt().withMessage('المعرف يجب أن يكون رقماً')
];

module.exports = {
  registerValidator,
  loginValidator,
  createLeagueValidator,
  joinLeagueValidator,
  createTeamValidator,
  createPlayerValidator,
  createMatchValidator,
  updateMatchResultValidator,
  updateMatchStatsValidator,
  createRoundValidator,
  createFantasyTeamValidator,
  createTransferValidator,
  paginationValidator,
  idParamValidator
};
