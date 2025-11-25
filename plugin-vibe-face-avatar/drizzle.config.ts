import type { Config } from 'drizzle-kit';

export default {
  // schema: './src/db/schema.ts', // Commented out - no schema file exists
  out: './drizzle/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'sqlite:./data/dev.sqlite',
  },
  verbose: true,
  strict: true,
} satisfies Config;
