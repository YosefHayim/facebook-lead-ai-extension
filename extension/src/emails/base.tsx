/**
 * Base Email Components for LeadScout AI
 * 
 * These templates are designed to work with:
 * - @react-email/components (Resend)
 * - SendGrid
 * - Any HTML email provider
 * 
 * Colors match LeadScout AI dark theme branding
 */

import React from 'react';

// Brand colors
export const colors = {
  primary: '#3B82F6',      // Blue accent
  primaryHover: '#2563EB',
  purple: '#8B5CF6',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  bgPrimary: '#0F0F0F',
  bgSecondary: '#1A1A1A',
  bgCard: '#1F1F1F',
  bgElevated: '#2A2A2A',
  border: '#2E2E2E',
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0A0',
  textMuted: '#6B6B6B',
};

// Base styles
export const styles = {
  body: {
    backgroundColor: colors.bgPrimary,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    margin: '0',
    padding: '0',
  },
  container: {
    backgroundColor: colors.bgSecondary,
    borderRadius: '16px',
    margin: '40px auto',
    maxWidth: '600px',
    padding: '0',
  },
  header: {
    backgroundColor: colors.bgCard,
    borderRadius: '16px 16px 0 0',
    padding: '32px',
    textAlign: 'center' as const,
  },
  logo: {
    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.purple} 100%)`,
    borderRadius: '12px',
    display: 'inline-block',
    padding: '12px 16px',
    marginBottom: '16px',
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: '24px',
    fontWeight: '700',
    margin: '0',
  },
  content: {
    padding: '32px',
  },
  heading: {
    color: colors.textPrimary,
    fontSize: '24px',
    fontWeight: '600',
    margin: '0 0 16px 0',
    textAlign: 'center' as const,
  },
  subheading: {
    color: colors.textSecondary,
    fontSize: '16px',
    lineHeight: '1.6',
    margin: '0 0 24px 0',
    textAlign: 'center' as const,
  },
  paragraph: {
    color: colors.textSecondary,
    fontSize: '15px',
    lineHeight: '1.6',
    margin: '0 0 16px 0',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: '10px',
    color: '#FFFFFF',
    display: 'inline-block',
    fontSize: '15px',
    fontWeight: '600',
    padding: '14px 28px',
    textDecoration: 'none',
    textAlign: 'center' as const,
  },
  buttonSecondary: {
    backgroundColor: colors.bgElevated,
    border: `1px solid ${colors.border}`,
    borderRadius: '10px',
    color: colors.textPrimary,
    display: 'inline-block',
    fontSize: '15px',
    fontWeight: '500',
    padding: '14px 28px',
    textDecoration: 'none',
    textAlign: 'center' as const,
  },
  card: {
    backgroundColor: colors.bgCard,
    border: `1px solid ${colors.border}`,
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '16px',
  },
  divider: {
    backgroundColor: colors.border,
    height: '1px',
    margin: '24px 0',
  },
  footer: {
    backgroundColor: colors.bgCard,
    borderRadius: '0 0 16px 16px',
    padding: '24px 32px',
    textAlign: 'center' as const,
  },
  footerText: {
    color: colors.textMuted,
    fontSize: '13px',
    lineHeight: '1.5',
    margin: '0',
  },
  link: {
    color: colors.primary,
    textDecoration: 'none',
  },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: '100px',
    color: '#FFFFFF',
    display: 'inline-block',
    fontSize: '12px',
    fontWeight: '600',
    padding: '4px 12px',
  },
  badgeSuccess: {
    backgroundColor: '#052E16',
    color: colors.success,
  },
  badgeWarning: {
    backgroundColor: '#2D1F04',
    color: colors.warning,
  },
  badgeError: {
    backgroundColor: '#2D0A0A',
    color: colors.error,
  },
};

// Email Layout Component
interface EmailLayoutProps {
  children: React.ReactNode;
  previewText?: string;
}

export const EmailLayout: React.FC<EmailLayoutProps> = ({ children, previewText }) => {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {previewText && (
          <meta name="x-apple-data-detectors" content="none" />
        )}
      </head>
      <body style={styles.body}>
        {previewText && (
          <div style={{ display: 'none', maxHeight: 0, overflow: 'hidden' }}>
            {previewText}
          </div>
        )}
        <table width="100%" cellPadding="0" cellSpacing="0" style={{ backgroundColor: colors.bgPrimary }}>
          <tr>
            <td align="center" style={{ padding: '40px 20px' }}>
              <table width="100%" cellPadding="0" cellSpacing="0" style={styles.container}>
                {children}
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  );
};

// Email Header Component
interface EmailHeaderProps {
  showLogo?: boolean;
}

export const EmailHeader: React.FC<EmailHeaderProps> = ({ showLogo = true }) => {
  return (
    <tr>
      <td style={styles.header}>
        {showLogo && (
          <>
            <div style={styles.logo}>
              <span style={{ color: '#FFFFFF', fontSize: '20px' }}>⚡</span>
            </div>
            <p style={{ ...styles.logoText, marginTop: '8px' }}>LeadScout AI</p>
          </>
        )}
      </td>
    </tr>
  );
};

// Email Footer Component
interface EmailFooterProps {
  unsubscribeUrl?: string;
}

export const EmailFooter: React.FC<EmailFooterProps> = ({ unsubscribeUrl }) => {
  return (
    <tr>
      <td style={styles.footer}>
        <p style={styles.footerText}>
          LeadScout AI - AI-Powered Lead Generation for Facebook
        </p>
        <p style={{ ...styles.footerText, marginTop: '8px' }}>
          © {new Date().getFullYear()} LeadScout AI. All rights reserved.
        </p>
        {unsubscribeUrl && (
          <p style={{ ...styles.footerText, marginTop: '16px' }}>
            <a href={unsubscribeUrl} style={styles.link}>Unsubscribe</a>
            {' | '}
            <a href="#" style={styles.link}>Privacy Policy</a>
          </p>
        )}
      </td>
    </tr>
  );
};

// Button Component
interface ButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({ href, children, variant = 'primary' }) => {
  const buttonStyle = variant === 'primary' ? styles.button : styles.buttonSecondary;
  return (
    <table width="100%" cellPadding="0" cellSpacing="0">
      <tr>
        <td align="center" style={{ padding: '8px 0' }}>
          <a href={href} style={buttonStyle}>{children}</a>
        </td>
      </tr>
    </table>
  );
};

// Card Component
interface CardProps {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children }) => {
  return (
    <div style={styles.card}>
      {children}
    </div>
  );
};

// Divider Component
export const Divider: React.FC = () => {
  return <div style={styles.divider} />;
};

// Feature List Item
interface FeatureItemProps {
  icon?: string;
  children: React.ReactNode;
}

export const FeatureItem: React.FC<FeatureItemProps> = ({ icon = '✓', children }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '12px' }}>
      <span style={{ color: colors.success, marginRight: '12px', fontSize: '16px' }}>{icon}</span>
      <span style={{ color: colors.textSecondary, fontSize: '14px', lineHeight: '1.5' }}>{children}</span>
    </div>
  );
};

export default {
  colors,
  styles,
  EmailLayout,
  EmailHeader,
  EmailFooter,
  Button,
  Card,
  Divider,
  FeatureItem,
};
