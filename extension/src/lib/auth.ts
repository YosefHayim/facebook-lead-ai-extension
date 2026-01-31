import { storage } from "wxt/storage";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  subscription: {
    plan: "free" | "pro" | "agency";
    status: string;
  };
  limits: {
    leadsPerMonth: number;
    aiCallsPerMonth: number;
  };
  usage: {
    leadsFoundThisMonth: number;
    aiCallsThisMonth: number;
  };
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
}

export const authStateStorage = storage.defineItem<AuthState>("local:authState", {
  fallback: {
    accessToken: null,
    user: null,
    isAuthenticated: false,
  },
});

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

class AuthService {
  private state: AuthState = {
    accessToken: null,
    user: null,
    isAuthenticated: false,
  };

  async init(): Promise<void> {
    const savedState = await authStateStorage.getValue();
    if (savedState.accessToken) {
      this.state = savedState;
      await this.refreshUserData();
    }
  }

  async signInWithGoogle(): Promise<{ user: AuthUser | null; error: Error | null }> {
    try {
      const token = await this.getGoogleToken();

      if (!token) {
        return { user: null, error: new Error("Failed to get Google token") };
      }

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: token }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return { user: null, error: new Error(data.error || "Login failed") };
      }

      this.state = {
        accessToken: token,
        user: data.data.user,
        isAuthenticated: true,
      };

      await authStateStorage.setValue(this.state);

      return { user: this.state.user, error: null };
    } catch (error) {
      console.error("[Auth] Sign in error:", error);
      return { user: null, error: error instanceof Error ? error : new Error("Sign in failed") };
    }
  }

  private async getGoogleToken(): Promise<string | null> {
    return new Promise((resolve) => {
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError) {
          console.error("[Auth] Chrome identity error:", chrome.runtime.lastError);
          resolve(null);
          return;
        }
        resolve(token || null);
      });
    });
  }

  async signOut(): Promise<void> {
    if (this.state.accessToken) {
      await new Promise<void>((resolve) => {
        chrome.identity.removeCachedAuthToken({ token: this.state.accessToken! }, () => resolve());
      });
    }

    this.state = {
      accessToken: null,
      user: null,
      isAuthenticated: false,
    };

    await authStateStorage.setValue(this.state);
  }

  async refreshUserData(): Promise<void> {
    if (!this.state.accessToken) return;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${this.state.accessToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          await this.signOut();
        }
        return;
      }

      const data = await response.json();

      if (data.success && data.data.user) {
        this.state.user = data.data.user;
        await authStateStorage.setValue(this.state);
      }
    } catch (error) {
      console.error("[Auth] Refresh user data error:", error);
    }
  }

  getAccessToken(): string | null {
    return this.state.accessToken;
  }

  getCurrentUser(): AuthUser | null {
    return this.state.user;
  }

  isAuthenticated(): boolean {
    return this.state.isAuthenticated;
  }

  async getAuthState(): Promise<AuthState> {
    return authStateStorage.getValue();
  }
}

export const authService = new AuthService();
