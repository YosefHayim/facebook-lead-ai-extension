import express, { json, urlencoded } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import * as Sentry from '@sentry/node';
import { PostHog } from 'posthog-node';
import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';
import routes from './routes/index.js';

declare global {
  namespace Express {
    interface Request {
      rawBody?: string;
    }
  }
}

if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
  });
}

let posthog: PostHog | null = null;
if (env.POSTHOG_API_KEY) {
  posthog = new PostHog(env.POSTHOG_API_KEY, {
    host: env.POSTHOG_HOST,
  });
}

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(','),
    credentials: true,
  })
);

app.use(
  json({
    verify: (req, _res, buf) => {
      (req as express.Request).rawBody = buf.toString();
    },
  })
);

app.use(urlencoded({ extended: true }));

app.use('/api', routes);

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error('[Server] Error:', err);

    if (env.SENTRY_DSN) {
      Sentry.captureException(err);
    }

    res.status(500).json({
      success: false,
      error: env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    });
  }
);

async function startServer() {
  try {
    await connectDatabase();
    console.log('[Database] Connected to MongoDB');

    const port = parseInt(env.PORT, 10);
    app.listen(port, () => {
      console.log(`[Server] Running on http://localhost:${port}`);
      console.log(`[Server] Environment: ${env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('[Server] Failed to start:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  console.log('[Server] SIGTERM received, shutting down...');
  if (posthog) {
    await posthog.shutdown();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[Server] SIGINT received, shutting down...');
  if (posthog) {
    await posthog.shutdown();
  }
  process.exit(0);
});

startServer();
