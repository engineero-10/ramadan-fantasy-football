# 🗄️ Database Documentation

## Overview

This project uses **MySQL** as the database with **Prisma ORM** for database management and queries.

## Database Connection

```env
DATABASE_URL="mysql://username:password@localhost:3306/ramadan_fantasy"
```

## Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│      User       │       │     League      │       │      Team       │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │━━━━━━▷│ id (PK)         │◁━━━━━━│ id (PK)         │
│ email           │       │ name            │       │ name            │
│ password        │       │ description     │       │ shortName       │
│ name            │       │ code            │       │ logo            │
│ role            │       │ maxTeams        │       │ leagueId (FK)   │
│ createdAt       │       │ playersPerTeam  │       │ createdAt       │
│ updatedAt       │       │ budget          │       │ updatedAt       │
└─────────────────┘       │ createdById(FK) │       └─────────────────┘
        │                 └─────────────────┘               │
        │                         │                         │
        ▼                         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  LeagueMember   │       │     Round       │       │     Player      │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │       │ id (PK)         │
│ userId (FK)     │       │ name            │       │ name            │
│ leagueId (FK)   │       │ roundNumber     │       │ position        │
│ joinedAt        │       │ leagueId (FK)   │       │ price           │
└─────────────────┘       │ startDate       │       │ teamId (FK)     │
                          │ endDate         │       │ leagueId (FK)   │
                          │ transfersOpen   │       │ isActive        │
                          │ lockTime        │       └─────────────────┘
                          │ isCompleted     │               │
                          └─────────────────┘               │
                                  │                         ▼
                                  ▼                 ┌─────────────────┐
                          ┌─────────────────┐       │   MatchStat     │
                          │     Match       │       ├─────────────────┤
                          ├─────────────────┤       │ id (PK)         │
                          │ id (PK)         │◁━━━━━━│ playerId (FK)   │
                          │ homeTeamId (FK) │       │ matchId (FK)    │
                          │ awayTeamId (FK) │       │ minutesPlayed   │
                          │ roundId (FK)    │       │ goals           │
                          │ matchDate       │       │ assists         │
                          │ homeScore       │       │ yellowCards     │
                          │ awayScore       │       │ redCards        │
                          │ status          │       │ cleanSheet      │
                          └─────────────────┘       │ penaltySaves    │
                                                    │ points          │
                                                    └─────────────────┘

┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  FantasyTeam    │       │ FantasyPlayer   │       │    Transfer     │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │━━━━━━▷│ id (PK)         │       │ id (PK)         │
│ name            │       │ fantasyTeamId   │       │ fantasyTeamId   │
│ userId (FK)     │       │ playerId (FK)   │       │ userId (FK)     │
│ leagueId (FK)   │       │ isStarter       │       │ roundId (FK)    │
│ totalPoints     │       │ position        │       │ playerInId (FK) │
│ budget          │       │ addedAt         │       │ playerOutId(FK) │
└─────────────────┘       └─────────────────┘       │ transferDate    │
        │                                           └─────────────────┘
        ▼
┌─────────────────┐
│ PointsHistory   │
├─────────────────┤
│ id (PK)         │
│ fantasyTeamId   │
│ roundId (FK)    │
│ points          │
│ rank            │
│ createdAt       │
└─────────────────┘
```

---

## Tables Schema

### 1. users

Stores user account information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| email | VARCHAR(191) | UNIQUE, NOT NULL | User email |
| password | VARCHAR(191) | NOT NULL | Hashed password |
| name | VARCHAR(191) | NOT NULL | Display name |
| role | ENUM('ADMIN', 'USER') | DEFAULT 'USER' | User role |
| createdAt | DATETIME | DEFAULT NOW() | Creation timestamp |
| updatedAt | DATETIME | ON UPDATE | Last update timestamp |

**Indexes:** `email`

---

### 2. leagues

Stores fantasy league configurations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| name | VARCHAR(191) | NOT NULL | League name |
| description | TEXT | NULLABLE | League description |
| code | VARCHAR(191) | UNIQUE, NOT NULL | Join code |
| maxTeams | INT | DEFAULT 10 | Maximum fantasy teams |
| playersPerTeam | INT | DEFAULT 12 | Total players per team |
| startingPlayers | INT | DEFAULT 8 | Starting lineup count |
| substitutes | INT | DEFAULT 4 | Substitute count |
| maxPlayersPerRealTeam | INT | DEFAULT 2 | Max players from same team |
| budget | DECIMAL(10,2) | DEFAULT 100 | Starting budget |
| maxTransfersPerRound | INT | DEFAULT 2 | Transfer limit per round |
| isActive | BOOLEAN | DEFAULT TRUE | League active status |
| createdById | INT | FK(users.id) | Creator user ID |
| createdAt | DATETIME | DEFAULT NOW() | Creation timestamp |
| updatedAt | DATETIME | ON UPDATE | Last update timestamp |

**Indexes:** `code`, `createdById`

---

### 3. league_members

Junction table for user-league membership.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| userId | INT | FK(users.id), CASCADE | User ID |
| leagueId | INT | FK(leagues.id), CASCADE | League ID |
| joinedAt | DATETIME | DEFAULT NOW() | Join timestamp |

**Unique Constraint:** `(userId, leagueId)`

---

### 4. teams

Stores real football teams.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| name | VARCHAR(191) | NOT NULL | Team name |
| shortName | VARCHAR(191) | NULLABLE | Short team name |
| logo | VARCHAR(191) | NULLABLE | Team logo URL |
| leagueId | INT | FK(leagues.id), CASCADE | League ID |
| createdAt | DATETIME | DEFAULT NOW() | Creation timestamp |
| updatedAt | DATETIME | ON UPDATE | Last update timestamp |

**Unique Constraint:** `(name, leagueId)`

---

### 5. players

Stores real football players.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| name | VARCHAR(191) | NOT NULL | Player name |
| position | ENUM | NOT NULL | Player position |
| price | DECIMAL(10,2) | NOT NULL | Player price |
| teamId | INT | FK(teams.id), CASCADE | Real team ID |
| leagueId | INT | FK(leagues.id), CASCADE | League ID |
| isActive | BOOLEAN | DEFAULT TRUE | Player active status |
| createdAt | DATETIME | DEFAULT NOW() | Creation timestamp |
| updatedAt | DATETIME | ON UPDATE | Last update timestamp |

**Position Values:** `GOALKEEPER`, `DEFENDER`, `MIDFIELDER`, `FORWARD`

**Indexes:** `teamId`, `leagueId`, `position`

---

### 6. rounds

Stores league rounds/gameweeks.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| name | VARCHAR(191) | NOT NULL | Round name |
| roundNumber | INT | NOT NULL | Round sequence number |
| leagueId | INT | FK(leagues.id), CASCADE | League ID |
| startDate | DATETIME | NOT NULL | Round start time |
| endDate | DATETIME | NOT NULL | Round end time |
| transfersOpen | BOOLEAN | DEFAULT FALSE | Transfer window open |
| lockTime | DATETIME | NULLABLE | Lineup lock time |
| isCompleted | BOOLEAN | DEFAULT FALSE | Round completed status |
| createdAt | DATETIME | DEFAULT NOW() | Creation timestamp |
| updatedAt | DATETIME | ON UPDATE | Last update timestamp |

**Unique Constraint:** `(roundNumber, leagueId)`

---

### 7. matches

Stores individual match information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| homeTeamId | INT | FK(teams.id) | Home team ID |
| awayTeamId | INT | FK(teams.id) | Away team ID |
| roundId | INT | FK(rounds.id), CASCADE | Round ID |
| matchDate | DATETIME | NOT NULL | Match date/time |
| homeScore | INT | NULLABLE | Home team score |
| awayScore | INT | NULLABLE | Away team score |
| status | ENUM | DEFAULT 'SCHEDULED' | Match status |
| createdAt | DATETIME | DEFAULT NOW() | Creation timestamp |
| updatedAt | DATETIME | ON UPDATE | Last update timestamp |

**Status Values:** `SCHEDULED`, `LIVE`, `COMPLETED`, `CANCELLED`

---

### 8. match_stats

Stores individual player statistics per match.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| playerId | INT | FK(players.id), CASCADE | Player ID |
| matchId | INT | FK(matches.id), CASCADE | Match ID |
| minutesPlayed | INT | DEFAULT 0 | Minutes on field |
| goals | INT | DEFAULT 0 | Goals scored |
| assists | INT | DEFAULT 0 | Assists made |
| yellowCards | INT | DEFAULT 0 | Yellow cards received |
| redCards | INT | DEFAULT 0 | Red cards received |
| cleanSheet | BOOLEAN | DEFAULT FALSE | Clean sheet (for GK/DEF) |
| penaltySaves | INT | DEFAULT 0 | Penalty saves |
| points | INT | DEFAULT 0 | Total fantasy points |
| createdAt | DATETIME | DEFAULT NOW() | Creation timestamp |
| updatedAt | DATETIME | ON UPDATE | Last update timestamp |

**Unique Constraint:** `(playerId, matchId)`

---

### 9. fantasy_teams

Stores user fantasy teams.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| name | VARCHAR(191) | NOT NULL | Fantasy team name |
| userId | INT | FK(users.id), CASCADE | Owner user ID |
| leagueId | INT | FK(leagues.id), CASCADE | League ID |
| totalPoints | INT | DEFAULT 0 | Total accumulated points |
| budget | DECIMAL(10,2) | NOT NULL | Remaining budget |
| createdAt | DATETIME | DEFAULT NOW() | Creation timestamp |
| updatedAt | DATETIME | ON UPDATE | Last update timestamp |

**Unique Constraint:** `(userId, leagueId)`

---

### 10. fantasy_players

Junction table for fantasy team player roster.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| fantasyTeamId | INT | FK(fantasy_teams.id), CASCADE | Fantasy team ID |
| playerId | INT | FK(players.id), CASCADE | Player ID |
| isStarter | BOOLEAN | DEFAULT TRUE | Starting lineup flag |
| position | INT | DEFAULT 0 | Position in formation |
| addedAt | DATETIME | DEFAULT NOW() | Addition timestamp |

**Unique Constraint:** `(fantasyTeamId, playerId)`

---

### 11. transfers

Stores transfer history.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| fantasyTeamId | INT | FK(fantasy_teams.id), CASCADE | Fantasy team ID |
| userId | INT | FK(users.id), CASCADE | User ID |
| roundId | INT | FK(rounds.id), CASCADE | Round ID |
| playerInId | INT | FK(players.id) | Incoming player ID |
| playerOutId | INT | FK(players.id) | Outgoing player ID |
| transferDate | DATETIME | DEFAULT NOW() | Transfer timestamp |

---

### 12. points_history

Stores historical points per round.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| fantasyTeamId | INT | FK(fantasy_teams.id), CASCADE | Fantasy team ID |
| roundId | INT | FK(rounds.id), CASCADE | Round ID |
| points | INT | DEFAULT 0 | Points earned |
| rank | INT | NULLABLE | Rank for that round |
| createdAt | DATETIME | DEFAULT NOW() | Creation timestamp |

**Unique Constraint:** `(fantasyTeamId, roundId)`

---

## Prisma Commands

### Generate Client
```bash
npx prisma generate
```

### Create Migration
```bash
npx prisma migrate dev --name <migration_name>
```

### Apply Migrations
```bash
npx prisma migrate deploy
```

### Push Schema (Development)
```bash
npx prisma db push
```

### Seed Database
```bash
npx prisma db seed
```

### View Database (Prisma Studio)
```bash
npx prisma studio
```

### Reset Database
```bash
npx prisma migrate reset
```

---

## Points Calculation

The points are calculated based on match statistics:

| Event | Points |
|-------|--------|
| Goal | +5 |
| Assist | +3 |
| Appearance (minutes > 0) | +1 |
| Yellow Card | -1 |
| Red Card | -4 |
| Clean Sheet (GK only) | +5 |
| Penalty Save | +5 |

Formula in code (from `config/points.js`):
```javascript
const calculatePoints = (stats) => {
  let points = 0;
  
  if (stats.minutesPlayed > 0) points += 1;
  points += stats.goals * 5;
  points += stats.assists * 3;
  points -= stats.yellowCards * 1;
  points -= stats.redCards * 4;
  if (stats.cleanSheet) points += 5;
  points += stats.penaltySaves * 5;
  
  return points;
};
```

---

## Sample Queries

### Get League Leaderboard
```sql
SELECT 
  ft.id,
  ft.name,
  u.name as ownerName,
  ft.totalPoints
FROM fantasy_teams ft
JOIN users u ON ft.userId = u.id
WHERE ft.leagueId = ?
ORDER BY ft.totalPoints DESC;
```

### Get Player Stats for Season
```sql
SELECT 
  p.name,
  p.position,
  t.name as teamName,
  SUM(ms.goals) as totalGoals,
  SUM(ms.assists) as totalAssists,
  SUM(ms.points) as totalPoints
FROM players p
JOIN teams t ON p.teamId = t.id
LEFT JOIN match_stats ms ON p.id = ms.playerId
WHERE p.leagueId = ?
GROUP BY p.id
ORDER BY totalPoints DESC;
```

### Get Transfer History
```sql
SELECT 
  tr.transferDate,
  pi.name as playerIn,
  po.name as playerOut,
  r.name as roundName
FROM transfers tr
JOIN players pi ON tr.playerInId = pi.id
JOIN players po ON tr.playerOutId = po.id
JOIN rounds r ON tr.roundId = r.id
WHERE tr.fantasyTeamId = ?
ORDER BY tr.transferDate DESC;
```
