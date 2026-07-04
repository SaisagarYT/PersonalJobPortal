# Backend Setup Guide

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Infisical account (for secrets management)
- Supabase account (for database)

## Environment Setup

### 1. Clone and Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and fill in your credentials:

```env
PORT=5000
machine_identity_client_id=your-infisical-client-id
machine_identity_client_secret=your-infisical-client-secret
PROJECT_ID=your-infisical-project-id
```

### 3. Infisical Configuration

1. Create an account at [Infisical](https://app.infisical.com)
2. Create a new project
3. Create a machine identity (Settings → Machine Identities)
4. Add the following secrets to your Infisical project (dev environment):
   - `supabaseUrl`: Your Supabase project URL
   - `supabaseKey`: Your Supabase anon/public key
5. Copy the client ID, client secret, and project ID to your `.env` file

### 4. Supabase Configuration

1. Create a project at [Supabase](https://supabase.com)
2. Create the following tables:

#### Tables Schema

**opportunity**

```sql
CREATE TABLE opportunity (
  id BIGSERIAL PRIMARY KEY,
  external_id VARCHAR NOT NULL UNIQUE,
  title VARCHAR NOT NULL,
  short_url VARCHAR,
  company_name VARCHAR,
  company_logo VARCHAR,
  description TEXT,
  status VARCHAR,
  max_salary INTEGER,
  currency VARCHAR,
  type VARCHAR,
  timing VARCHAR,
  payment_type VARCHAR,
  end_date TIMESTAMP,
  approved_date TIMESTAMP,
  register_count INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**opportunity_skill**

```sql
CREATE TABLE opportunity_skill (
  id BIGSERIAL PRIMARY KEY,
  opportunity_id VARCHAR REFERENCES opportunity(external_id),
  skill_id INTEGER,
  name VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**opportunity_jobs**

```sql
CREATE TABLE opportunity_jobs (
  id BIGSERIAL PRIMARY KEY,
  opportunity_id VARCHAR REFERENCES opportunity(external_id),
  work_id INTEGER,
  name VARCHAR,
  description TEXT,
  created_at TIMESTAMP
);
```

**opportunity_locations**

```sql
CREATE TABLE opportunity_locations (
  id BIGSERIAL PRIMARY KEY,
  location_id INTEGER,
  city VARCHAR,
  state VARCHAR,
  country VARCHAR,
  opportunity_id VARCHAR REFERENCES opportunity(external_id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**opportunity_filters**

```sql
CREATE TABLE opportunity_filters (
  id BIGSERIAL PRIMARY KEY,
  opportunity_id VARCHAR REFERENCES opportunity(external_id),
  filter_id INTEGER,
  name VARCHAR,
  type VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**wishlist**

```sql
CREATE TABLE wishlist (
  id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  opportunity_id VARCHAR REFERENCES opportunity(external_id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, opportunity_id)
);
```

## Running the Application

### Development Mode

```bash
npm run dev
```

The server will start on `http://localhost:5000` with hot-reload enabled.

### Production Mode

```bash
npm start
```

## Code Quality Tools

### Linting

Check for code issues:

```bash
npm run lint
```

Auto-fix linting issues:

```bash
npm run lint:fix
```

### Formatting

Check code formatting:

```bash
npm run format:check
```

Format all files:

```bash
npm run format
```

## API Endpoints

### Health Check

- `GET /` - Check if backend is live
- `GET /supabase` - Test Supabase connection

### Opportunities

- `POST /api/v1/opportunities` - Fetch opportunities from Unstop
  ```json
  {
    "page": 1,
    "pagination": 18,
    "role": "ai-engineer",
    "userType": "students"
  }
  ```
- `POST /api/v1/history` - Save opportunity to history

### Wishlist

- `POST /api/v1/wishlist` - Add to wishlist
- `DELETE /api/v1/wishlist` - Remove from wishlist
- `POST /api/v1/wishlist/all` - Display wishlist items

## Project Structure

```
backend/
├── config/           # Configuration files (Supabase, Infisical)
├── controllers/      # Request handlers
├── routes/           # API routes
├── scrapers/         # Web scraping logic (Unstop)
├── schedulers/       # Cron jobs (to be implemented)
├── service/          # Business logic layer
├── utils/            # Utility functions
├── .env              # Environment variables (not in git)
├── .env.example      # Example environment file
├── index.js          # Entry point
└── package.json      # Dependencies and scripts
```

## Development Guidelines

1. **Code Style**: Follow ESLint and Prettier configurations
2. **Commits**: Use conventional commits (feat:, fix:, docs:, etc.)
3. **Branches**: Create feature branches from `main`
4. **Testing**: Run linter before committing

## Troubleshooting

### Infisical Connection Issues

- Verify your client ID and secret are correct
- Check if the machine identity has access to the project
- Ensure the environment slug is set to 'dev'

### Supabase Connection Issues

- Verify credentials are correctly set in Infisical
- Check if your IP is allowed in Supabase dashboard
- Ensure all tables are created

### Playwright Issues

If Playwright fails to launch:

```bash
npx playwright install
npx playwright install-deps
```

## Next Steps

- [ ] Implement user authentication
- [ ] Add request validation middleware
- [ ] Set up cron jobs for automated scraping
- [ ] Add unit and integration tests
- [ ] Implement rate limiting
- [ ] Add API documentation (Swagger)
