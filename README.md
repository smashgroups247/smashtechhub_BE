# Express.js Enterprise Boilerplate

A scalable **Express.js + TypeScript** boilerplate designed for building RESTful APIs with clean architecture principles. Includes logging, monitoring, modular structure, and ready-to-integrate features.

---

## Table of Contents

- [Folder Structure](#folder-structure)  
- [Getting Started](#getting-started)  
- [Adding Files & Modules](#adding-files--modules)  
- [Running the Application](#running-the-application)  
- [Testing](#testing)  
- [Docker Setup](#docker-setup)  
- [Notes](#notes)  

---

## Folder Structure

```plaintext
expressjs-boilerplate/
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tsconfig.json
├── src/
│   ├── api/                  # Versioned API layer
│   │   └── v1/
│   │       ├── controllers/  # API route controllers
│   │       ├── middlewares/  # Route-specific middlewares
│   │       ├── routes/       # Route definitions
│   │       └── validators/   # Request payload validation
│   ├── core/                 # Core modules & configuration
│   │   ├── config/           # App configuration
│   │   ├── cache/            # Caching layer
│   │   ├── database/         # DB connection & ORM setup
│   │   ├── events/           # Event emitters & listeners
│   │   └── queue/            # Job queues (e.g., Bull)
│   ├── domain/               # Business logic / domain layer
│   │   └── auth/
│   │       ├── models/       # DB models
│   │       ├── repositories/ # Data access layer
│   │       ├── services/     # Domain services
│   │       ├── interfaces/   # Domain interfaces
│   │       ├── types/        # Type definitions
│   │       └── __tests__/    # Unit & integration tests
│   ├── infrastructure/       # External service integrations
│   │   ├── email/
│   │   ├── payment/
│   │   ├── firebase/
│   │   ├── sms/
│   │   └── storage/
│   ├── monitoring/           # Logging, metrics, tracing
│   │   ├── logger/
│   │   ├── metrics/
│   │   └── tracing/
│   ├── shared/               # Shared utilities, constants, types
│   │   ├── constants/
│   │   ├── errors/
│   │   ├── types/
│   │   ├── utils/
│   │   └── auth.controller.ts
│   └── server.ts             # Entry point
├── scripts/                  # Scripts for automation
├── logs/                     # Application logs
├── docs/                     # Documentation
└── README.md
```

## Getting Started

1. Clone the repository

```bash
git clone <repo-url>
cd expressjs-boilerplate
```

2. Install dependencies

```bash
npm install
```

3. Activate virtual environment (if using Python venv for scripts)

```bash
source venv/bin/activate
```

4. Configure environment variables

* Copy .env.example to .env and update values.

```bash
cp .env.example .env
```
--

## Adding Files & Modules

1. API Layer

- Controllers: Define route logic in ```src/api/v1/controllers/```

- Routes: Register endpoints ```in src/api/v1/routes/```

- Validators: Define request payload validation in ```src/api/v1/validators/```

- Middlewares: Add route-specific middlewares in ```src/api/v1/middlewares/```

Example: Add a new user module

```
src/api/v1/
├── controllers/user.controller.ts
├── routes/user.route.ts
├── validators/user.validator.ts
└── middlewares/user.middleware.ts
```

2. Domain Layer

- Models: Database schemas

- Services: Business logic

- Repositories: Data access methods

- Interfaces & Types: Define contracts and type safety

Example: Adding a new feature
```
src/domain/user/
├── models/User.ts
├── repositories/UserRepository.ts
├── services/UserService.ts
├── interfaces/IUser.ts
└── types/UserTypes.ts
````

3. Infrastructure

- Place all external integrations like Firebase, email, payment providers in src/infrastructure/.

- Use the core services for shared resources.

4. Core

- ```config/``` → App configurations

- ```database/``` → ORM setup (TypeORM, Prisma, etc.)

- ```queue/``` → Background jobs

- ```events/``` → Domain events

5. Shared

- Place constants, utility functions, common errors, and types here.

- Reusable across all layers.

## Running the Application
```
# Compile TypeScript
npm run build

# Start server
npm run start
```

## Development
```
npm run dev
````

## Testing

- Unit & integration tests live under src/domain/**/__tests__/

- Run tests with:
```
npm run test
````



### Notes

- Follow modular structure when adding new features.

- Keep controllers thin; all business logic should reside in services.

- Use repositories for DB queries.

- Use shared for reusable utilities and constants.

- Add monitoring/logging for production-ready features.

### Request Flow Example (Optional Diagram)
```
Client Request → Route → Controller → Service → Repository → Database
                 ↑             ↓
               Middleware     Domain Logic
````

- Middleware handles authentication, validation, and request transformations.

- Controllers only orchestrate service calls.

- Services contain business logic.