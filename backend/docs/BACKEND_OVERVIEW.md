# Ramadan Fantasy Football - Backend Overview

## Technologies Used

- **Node.js (Express):** The backend is built using Node.js with the Express framework, providing RESTful APIs for the frontend and handling business logic.
- **Prisma ORM:** Used for database access and modeling. Prisma provides type-safe queries and migrations for MySQL.
- **MySQL Database:** All persistent data (users, teams, matches, rounds, points, etc.) is stored in a MySQL database.
- **Docker & Docker Compose:** The backend can be run in a containerized environment using Docker. `docker-compose.yml` is used for local development and `docker-compose.prod.yml` for production.
- **JWT Authentication:** User authentication is handled using JSON Web Tokens (JWT).
- **Jest:** Unit and integration tests are written using Jest.

## Project Structure

- `src/`
  - `controllers/`: Contains route handlers for authentication, fantasy teams, matches, rounds, leagues, transfers, etc.
  - `middleware/`: Custom Express middleware (authentication, error handling, validation).
  - `models/`: (If used) Custom data models or business logic.
  - `routes/`: Express route definitions for each resource.
  - `services/`: Business logic and helpers (can include points calculation, team management, etc.).
  - `utils/`: Utility functions (helpers, response formatting, etc.).
  - `validators/`: Input validation logic for API endpoints.
  - `config/`: Configuration files (database, points rules, etc.).
  - `server.js`: Main entry point for the Express app.
- `prisma/`
  - `schema.prisma`: Prisma schema defining all database models.
  - `migrations/`: Database migration files.
  - `seed.js`: Script for seeding initial data.
- `scripts/`: Utility scripts for admin management and setup.
- `docs/`: Documentation files.

## Key Features

- **User Management:** Registration, login, JWT authentication, roles (OWNER, ADMIN, USER).
- **League Management:** Create leagues, join leagues, manage league members.
- **Fantasy Team Management:** Create fantasy teams, select players, manage team formation and budget.
- **Rounds & Matches:** Create rounds, schedule matches, update match results, lock/unlock transfers.
- **Points Calculation:** Automated calculation of player and team points at the end of each round, including captain multipliers and bonus points.
- **Transfers:** Manage player transfers between fantasy teams, enforce transfer rules.
- **Statistics & Rankings:** Track points history, round rankings, top players, and team performance.
- **API Validation:** Input validation for all endpoints using custom validators.
- **Error Handling:** Centralized error handling middleware.
- **Testing:** Unit and integration tests for core logic and endpoints.

## Authentication & Security
- JWT-based authentication for all protected routes.
- Role-based access control (OWNER, ADMIN, USER).
- Passwords hashed with bcrypt.

## Database
- MySQL database managed via Prisma ORM.
- Models include User, League, Team, Player, Round, Match, FantasyTeam, FantasyPlayer, Transfer, PointsHistory, etc.
- Relations and indexes defined for performance.

## Deployment
- Dockerized for easy deployment.
- Production and development compose files.

## How Points Are Calculated
- At the end of each round, the backend calculates points for each fantasy team based on player stats, captain multipliers, and bonus points.
- PointsHistory is updated for each team and round.
- Rankings are assigned based on points.

## Background Jobs
- Points calculation and ranking are triggered at round completion (can be moved to background jobs for scalability).

## Testing
- Jest is used for unit and integration tests.
- Test files are located in `__tests__` directory.

## Admin Scripts
- Utility scripts for admin management (create, delete, list admins, setup owner).

## API Documentation
- See `docs/API.md` for detailed endpoint documentation.

---

This backend is designed for scalability, modularity, and ease of maintenance. For more details, see the code and documentation files in the `docs/` folder.
