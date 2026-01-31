import type { Response, NextFunction } from 'express';
import { User } from '../models/User.js';
import type { AuthenticatedRequest, GoogleTokenInfo } from '../types/index.js';

const GOOGLE_TOKEN_INFO_URL = 'https://oauth2.googleapis.com/tokeninfo';

async function validateGoogleToken(accessToken: string): Promise<GoogleTokenInfo | null> {
  try {
    const response = await fetch(`${GOOGLE_TOKEN_INFO_URL}?access_token=${accessToken}`);
    const data = await response.json() as GoogleTokenInfo;

    if (data.error) {
      console.error('[Auth] Google token validation error:', data.error_description);
      return null;
    }

    if (!data.email_verified) {
      console.error('[Auth] Google email not verified');
      return null;
    }

    return data;
  } catch (error) {
    console.error('[Auth] Failed to validate Google token:', error);
    return null;
  }
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Missing authorization header' });
  }

  const token = authHeader.slice(7);

  try {
    const googleUser = await validateGoogleToken(token);

    if (!googleUser) {
      return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }

    let dbUser = await User.findByGoogleId(googleUser.sub);

    if (!dbUser) {
      dbUser = await User.create({
        googleId: googleUser.sub,
        email: googleUser.email,
        name: googleUser.name,
        avatarUrl: googleUser.picture,
      });
    }

    req.user = {
      googleId: googleUser.sub,
      email: googleUser.email,
      dbUserId: dbUser._id.toString(),
    };

    next();
  } catch (error) {
    console.error('[Auth] Token validation error:', error);
    return res.status(401).json({ success: false, error: 'Authentication failed' });
  }
}

export async function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.slice(7);

  try {
    const googleUser = await validateGoogleToken(token);

    if (googleUser) {
      const dbUser = await User.findByGoogleId(googleUser.sub);

      if (dbUser) {
        req.user = {
          googleId: googleUser.sub,
          email: googleUser.email,
          dbUserId: dbUser._id.toString(),
        };
      }
    }

    next();
  } catch {
    next();
  }
}
