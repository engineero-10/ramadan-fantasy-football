# 📚 Ramadan Fantasy Football - API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## 🔐 Authentication Endpoints

### Register User
```http
POST /api/auth/register
```

**Body:**
```json
{
  "name": "أحمد محمد",
  "email": "ahmed@example.com",
  "password": "strongPassword123",
  "role": "USER"
}
```

**Response (201):**
```json
{
  "status": "success",
  "message": "تم إنشاء الحساب بنجاح",
  "data": {
    "user": {
      "id": 1,
      "name": "أحمد محمد",
      "email": "ahmed@example.com",
      "role": "USER",
      "createdAt": "2026-02-09T10:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Login
```http
POST /api/auth/login
```

**Body:**
```json
{
  "email": "ahmed@example.com",
  "password": "strongPassword123"
}
```

**Response (200):**
```json
{
  "status": "success",
  "message": "تم تسجيل الدخول بنجاح",
  "data": {
    "user": {
      "id": 1,
      "name": "أحمد محمد",
      "email": "ahmed@example.com",
      "role": "USER"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Get Profile
```http
GET /api/auth/me
```

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "status": "success",
  "message": "تم جلب البيانات بنجاح",
  "data": {
    "id": 1,
    "name": "أحمد محمد",
    "email": "ahmed@example.com",
    "role": "USER",
    "createdAt": "2026-02-09T10:00:00.000Z",
    "_count": {
      "memberships": 2,
      "fantasyTeams": 2
    }
  }
}
```

### Update Profile
```http
PUT /api/auth/me
```

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "name": "أحمد محمد علي",
  "currentPassword": "oldPassword",
  "newPassword": "newPassword123"
}
```

---

## 🏆 League Endpoints

### Get All Leagues
```http
GET /api/leagues
```

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "leagues": [
      {
        "id": 1,
        "name": "دوري رمضان 2026",
        "description": "بطولة رمضان السنوية",
        "code": "RAM2026",
        "maxTeams": 10,
        "isActive": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1
    }
  }
}
```

### Get League by ID
```http
GET /api/leagues/:id
```

### Get League by Code
```http
GET /api/leagues/code/:code
```

### Create League (Admin)
```http
POST /api/leagues
```

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "name": "دوري رمضان 2026",
  "description": "بطولة رمضان السنوية",
  "maxTeams": 10,
  "playersPerTeam": 12,
  "startingPlayers": 8,
  "substitutes": 4,
  "maxPlayersPerRealTeam": 2,
  "budget": 100,
  "maxTransfersPerRound": 2
}
```

### Join League
```http
POST /api/leagues/join
```

**Body:**
```json
{
  "code": "RAM2026"
}
```

### Get League Members
```http
GET /api/leagues/:id/members
```

### Update League (Admin)
```http
PUT /api/leagues/:id
```

### Delete League (Admin)
```http
DELETE /api/leagues/:id
```

---

## ⚽ Team Endpoints (Real Teams)

### Get All Teams
```http
GET /api/teams
```

**Query Parameters:**
- `leagueId` (required): League ID

### Get Team by ID
```http
GET /api/teams/:id
```

### Create Team (Admin)
```http
POST /api/teams
```

**Body:**
```json
{
  "name": "الأهلي",
  "shortName": "AHL",
  "logo": "https://example.com/ahly.png",
  "leagueId": 1
}
```

### Update Team (Admin)
```http
PUT /api/teams/:id
```

### Delete Team (Admin)
```http
DELETE /api/teams/:id
```

---

## 👤 Player Endpoints

### Get All Players
```http
GET /api/players
```

**Query Parameters:**
- `leagueId` (required): League ID
- `teamId` (optional): Filter by team
- `position` (optional): Filter by position (GOALKEEPER, DEFENDER, MIDFIELDER, FORWARD)
- `search` (optional): Search by name
- `sortBy` (optional): Sort field (name, price, points)
- `order` (optional): Sort order (asc, desc)

### Get Top Players
```http
GET /api/players/top/:leagueId
```

**Query Parameters:**
- `limit` (optional): Number of players (default: 10)

### Get Player by ID
```http
GET /api/players/:id
```

### Create Player (Admin)
```http
POST /api/players
```

**Body:**
```json
{
  "name": "محمد صلاح",
  "position": "FORWARD",
  "price": 15.5,
  "teamId": 1,
  "leagueId": 1
}
```

### Update Player (Admin)
```http
PUT /api/players/:id
```

### Delete Player (Admin)
```http
DELETE /api/players/:id
```

---

## 📅 Round Endpoints

### Get All Rounds
```http
GET /api/rounds
```

**Query Parameters:**
- `leagueId` (required): League ID

### Get Current Round
```http
GET /api/rounds/current/:leagueId
```

### Get Round by ID
```http
GET /api/rounds/:id
```

### Create Round (Admin)
```http
POST /api/rounds
```

**Body:**
```json
{
  "name": "الجولة الأولى",
  "roundNumber": 1,
  "leagueId": 1,
  "startDate": "2026-03-01T18:00:00Z",
  "endDate": "2026-03-02T23:00:00Z",
  "lockTime": "2026-03-01T17:00:00Z"
}
```

### Update Round (Admin)
```http
PUT /api/rounds/:id
```

### Toggle Transfers (Admin)
```http
PUT /api/rounds/:id/transfers
```

**Body:**
```json
{
  "transfersOpen": true
}
```

### Complete Round (Admin)
```http
PUT /api/rounds/:id/complete
```

### Delete Round (Admin)
```http
DELETE /api/rounds/:id
```

---

## ⚔️ Match Endpoints

### Get All Matches
```http
GET /api/matches
```

**Query Parameters:**
- `leagueId` (required): League ID
- `roundId` (optional): Filter by round
- `status` (optional): Filter by status (SCHEDULED, LIVE, COMPLETED, CANCELLED)

### Get Match by ID
```http
GET /api/matches/:id
```

### Create Match (Admin)
```http
POST /api/matches
```

**Body:**
```json
{
  "homeTeamId": 1,
  "awayTeamId": 2,
  "roundId": 1,
  "matchDate": "2026-03-01T20:00:00Z"
}
```

### Update Match Result (Admin)
```http
PUT /api/matches/:id/result
```

**Body:**
```json
{
  "homeScore": 2,
  "awayScore": 1,
  "status": "COMPLETED"
}
```

### Update Match Stats (Admin)
```http
PUT /api/matches/:id/stats
```

**Body:**
```json
{
  "stats": [
    {
      "playerId": 1,
      "minutesPlayed": 90,
      "goals": 2,
      "assists": 1,
      "yellowCards": 0,
      "redCards": 0,
      "cleanSheet": false,
      "penaltySaves": 0
    }
  ]
}
```

### Delete Match (Admin)
```http
DELETE /api/matches/:id
```

---

## 🎮 Fantasy Team Endpoints

### Create Fantasy Team
```http
POST /api/fantasy-teams
```

**Body:**
```json
{
  "name": "فريق أحمد الخيالي",
  "leagueId": 1,
  "players": [
    { "playerId": 1, "isStarter": true },
    { "playerId": 2, "isStarter": true },
    { "playerId": 3, "isStarter": false }
  ]
}
```

### Get My Fantasy Team
```http
GET /api/fantasy-teams/:leagueId
```

### Get Fantasy Team by ID
```http
GET /api/fantasy-teams/team/:id
```

### Update Fantasy Team
```http
PUT /api/fantasy-teams/:id
```

### Update Lineup
```http
PUT /api/fantasy-teams/:id/lineup
```

**Body:**
```json
{
  "players": [
    { "playerId": 1, "isStarter": true, "position": 0 },
    { "playerId": 2, "isStarter": true, "position": 1 },
    { "playerId": 3, "isStarter": false, "position": 8 }
  ]
}
```

### Get Round Points
```http
GET /api/fantasy-teams/:id/points/:roundId
```

---

## 🔄 Transfer Endpoints

### Create Transfer
```http
POST /api/transfers
```

**Body:**
```json
{
  "fantasyTeamId": 1,
  "playerOutId": 5,
  "playerInId": 10,
  "roundId": 1
}
```

### Get Transfer History
```http
GET /api/transfers/:fantasyTeamId
```

### Get Remaining Transfers
```http
GET /api/transfers/:fantasyTeamId/remaining
```

### Get Round Transfers (Admin)
```http
GET /api/transfers/round/:roundId
```

---

## 📊 Leaderboard Endpoints

### Get League Leaderboard
```http
GET /api/leaderboard/:leagueId
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page

### Get Round Leaderboard
```http
GET /api/leaderboard/:leagueId/round/:roundId
```

### Get My Rank
```http
GET /api/leaderboard/:leagueId/my-rank
```

### Get League Stats
```http
GET /api/leaderboard/:leagueId/stats
```

### Get Head to Head
```http
GET /api/leaderboard/h2h/:teamId1/:teamId2
```

---

## 🏥 Health Check

### API Health
```http
GET /api/health
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Ramadan Fantasy Football API is running",
  "timestamp": "2026-02-09T10:00:00.000Z"
}
```

---

## ❌ Error Responses

### 400 Bad Request
```json
{
  "status": "error",
  "message": "خطأ في البيانات المدخلة",
  "errors": [
    {
      "field": "email",
      "message": "البريد الإلكتروني غير صالح"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "status": "error",
  "message": "غير مصرح بالدخول"
}
```

### 403 Forbidden
```json
{
  "status": "error",
  "message": "ليس لديك صلاحية لهذا الإجراء"
}
```

### 404 Not Found
```json
{
  "status": "error",
  "message": "الصفحة غير موجودة"
}
```

### 409 Conflict
```json
{
  "status": "error",
  "message": "البريد الإلكتروني مسجل مسبقاً"
}
```

### 500 Internal Server Error
```json
{
  "status": "error",
  "message": "خطأ في السيرفر"
}
```

---

## 📝 Notes

1. **Positions:** GOALKEEPER, DEFENDER, MIDFIELDER, FORWARD
2. **Match Status:** SCHEDULED, LIVE, COMPLETED, CANCELLED
3. **User Roles:** ADMIN, USER
4. **Points System:**
   - Goal: +5
   - Assist: +3
   - Appearance: +1
   - Yellow Card: -1
   - Red Card: -4
   - Clean Sheet (GK): +5
   - Penalty Save: +5
