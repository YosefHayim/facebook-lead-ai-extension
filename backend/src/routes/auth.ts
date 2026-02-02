import { Router } from 'express';
import { User } from '../models/User.js';
import type { ApiResponse, GoogleTokenInfo } from '../types/index.js';

const router = Router();

const GOOGLE_TOKEN_INFO_URL = 'https://oauth2.googleapis.com/tokeninfo';

router.post('/login', async (req, res) => {
  const { accessToken } = req.body as { accessToken: string };

  if (!accessToken) {
    return res.status(400).json({
      success: false,
      error: 'Access token is required',
    } as ApiResponse);
  }

  try {
    const response = await fetch(`${GOOGLE_TOKEN_INFO_URL}?access_token=${accessToken}`);
    const tokenInfo = await response.json() as GoogleTokenInfo;

    if (tokenInfo.error) {
      return res.status(401).json({
        success: false,
        error: tokenInfo.error_description || 'Invalid token',
      } as ApiResponse);
    }

    if (!tokenInfo.email_verified) {
      return res.status(401).json({
        success: false,
        error: 'Email not verified',
      } as ApiResponse);
    }

    let user = await User.findByGoogleId(tokenInfo.sub);

    if (!user) {
      user = await User.create({
        googleId: tokenInfo.sub,
        email: tokenInfo.email,
        name: tokenInfo.name,
        avatarUrl: tokenInfo.picture,
      });
    } else {
      const updates: { name?: string; avatarUrl?: string } = {};
      if (tokenInfo.name && user.name !== tokenInfo.name) {
        updates.name = tokenInfo.name;
      }
      if (tokenInfo.picture && user.avatarUrl !== tokenInfo.picture) {
        updates.avatarUrl = tokenInfo.picture;
      }
      if (Object.keys(updates).length > 0) {
        user = await User.update(user.id, updates) ?? user;
      }
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          subscription: user.subscription,
          limits: user.limits,
          usage: user.usage,
        },
      },
    } as ApiResponse);
  } catch (error) {
    console.error('[Auth] Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
    } as ApiResponse);
  }
});

router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated',
    } as ApiResponse);
  }

  const accessToken = authHeader.slice(7);

  try {
    const response = await fetch(`${GOOGLE_TOKEN_INFO_URL}?access_token=${accessToken}`);
    const tokenInfo = await response.json() as GoogleTokenInfo;

    if (tokenInfo.error) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
      } as ApiResponse);
    }

    const user = await User.findByGoogleId(tokenInfo.sub);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          subscription: user.subscription,
          limits: user.limits,
          usage: user.usage,
        },
      },
    } as ApiResponse);
  } catch (error) {
    console.error('[Auth] Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user',
    } as ApiResponse);
  }
});

export default router;
