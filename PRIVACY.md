# Privacy Policy for LeadScout AI

**Last Updated**: January 2025

**Extension Name**: LeadScout AI - Facebook Lead Generation  
**Developer**: [Your Name/Company]  
**Contact**: [your-email@example.com]

---

## Overview

LeadScout AI is a browser extension that helps users find potential business leads in Facebook posts. We are committed to protecting your privacy and being transparent about our data practices.

**Key Privacy Principles:**
- Your data stays local by default
- No data is sold or shared with third parties
- No tracking or analytics scripts
- You control what data is stored and synced

---

## 1. Data We Collect

### 1.1 Data You Provide
| Data Type | Purpose | Storage |
|-----------|---------|---------|
| API Keys (Gemini/OpenAI) | Enable AI analysis features | Local browser storage only |
| Persona configurations | Customize lead detection | Local browser storage |
| Email/password (optional) | Cloud sync account | Supabase (encrypted) |

### 1.2 Data Collected During Use
| Data Type | Purpose | Storage |
|-----------|---------|---------|
| Facebook post text | AI analysis for lead detection | Local + optionally cloud |
| Post author names | Lead identification | Local + optionally cloud |
| Post URLs | Reference and navigation | Local + optionally cloud |
| Group names | Organization and tracking | Local + optionally cloud |

### 1.3 Data We Do NOT Collect
- Browsing history outside Facebook
- Personal messages or private content
- Facebook login credentials
- Payment information
- Device identifiers or fingerprints
- Location data
- Usage analytics or telemetry

---

## 2. How We Use Your Data

### 2.1 Core Functionality
- **Lead Detection**: Post content is analyzed to identify buying intent signals
- **Reply Generation**: Post context is used to generate personalized responses
- **Organization**: Group and lead data helps you track your outreach

### 2.2 AI Processing
When you scan a page, post content is sent to your chosen AI provider:

**Google Gemini**
- Data sent: Post text only
- Purpose: Intent analysis and reply generation
- Privacy: Subject to [Google's Privacy Policy](https://policies.google.com/privacy)

**OpenAI**
- Data sent: Post text only
- Purpose: Intent analysis and reply generation
- Privacy: Subject to [OpenAI's Privacy Policy](https://openai.com/privacy)

**Important**: We do not store or have access to your AI API keys or the data sent to these services. Communication happens directly between your browser and the AI provider.

### 2.3 Optional Cloud Sync
If you create an account and enable cloud sync:
- Data is stored in Supabase (encrypted at rest)
- Used only to sync your leads and settings across devices
- You can delete your account and all data at any time

---

## 3. Data Storage

### 3.1 Local Storage (Default)
All data is stored locally in your browser using Chrome's Storage API:
- Leads and analysis results
- Persona configurations
- Extension settings
- Watched groups
- API keys (encrypted)

**Benefits:**
- Data never leaves your device
- No account required
- Full control over your data

### 3.2 Cloud Storage (Optional)
If you opt into cloud sync via Supabase:
- Leads, personas, and settings are synced
- Data is encrypted in transit (TLS) and at rest
- Hosted on Supabase infrastructure
- Subject to [Supabase Privacy Policy](https://supabase.com/privacy)

---

## 4. Data Sharing

### We Do NOT:
- Sell your data to third parties
- Share data with advertisers
- Use data for targeted advertising
- Share data with data brokers
- Provide data to any third party for their marketing purposes

### We May Share Data:
- **With AI Providers**: Post content sent for analysis (Gemini/OpenAI)
- **With Supabase**: If you enable cloud sync (your choice)
- **Legal Requirements**: If required by law or valid legal process

---

## 5. Your Rights and Controls

### 5.1 Access Your Data
- View all stored leads in the extension sidebar
- Export functionality available in settings

### 5.2 Delete Your Data
**Local Data:**
1. Open extension Options
2. Go to Settings tab
3. Click "Clear All Data"

**Cloud Data (if synced):**
1. Open extension Options
2. Go to Account tab
3. Click "Delete Account"

### 5.3 Disable Features
- Disable cloud sync at any time
- Remove API keys to disable AI features
- Uninstall extension to remove all local data

### 5.4 Data Portability
- Export leads as JSON from settings
- All data formats are standard and portable

---

## 6. Security Measures

### 6.1 Technical Safeguards
- API keys stored using Chrome's secure storage API
- HTTPS for all external communications
- No external scripts or trackers loaded
- Content Security Policy enforced
- Minimal permissions requested

### 6.2 Access Controls
- Extension only activates on facebook.com domains
- Page scanning requires manual user action
- No background data collection

---

## 7. Children's Privacy

LeadScout AI is not intended for use by children under 13 years of age. We do not knowingly collect personal information from children under 13.

---

## 8. International Users

If you are accessing this extension from outside the United States:
- Your data may be processed in the United States (AI providers)
- Cloud sync data is stored in Supabase's data centers
- By using the extension, you consent to this data transfer

### For EU/EEA Users (GDPR)
You have the right to:
- Access your personal data
- Rectify inaccurate data
- Erase your data ("right to be forgotten")
- Restrict processing
- Data portability
- Object to processing

Contact us at [your-email@example.com] to exercise these rights.

### For California Users (CCPA)
You have the right to:
- Know what personal information is collected
- Know if personal information is sold or disclosed
- Say no to the sale of personal information
- Access your personal information
- Equal service and price

We do not sell personal information.

---

## 9. Changes to This Policy

We may update this Privacy Policy from time to time. Changes will be indicated by updating the "Last Updated" date at the top of this policy.

For significant changes, we will:
- Update the extension version notes
- Display a notification in the extension

Your continued use of the extension after changes constitutes acceptance of the updated policy.

---

## 10. Permissions Explained

| Permission | Why We Need It |
|------------|----------------|
| `storage` | Save your settings, leads, and preferences locally |
| `sidePanel` | Display the main interface in Chrome's sidebar |
| `activeTab` | Read Facebook page content when you click "Scan" |
| `tabs` | Open Facebook search results and group pages |
| `identity` | Enable Google login for optional cloud sync |
| `facebook.com` | Access Facebook pages to scan for leads |

---

## 11. Third-Party Services

### Google Gemini API
- Purpose: AI analysis of post content
- Data sent: Post text only
- Privacy: https://policies.google.com/privacy

### OpenAI API
- Purpose: AI analysis of post content
- Data sent: Post text only
- Privacy: https://openai.com/privacy

### Supabase (Optional)
- Purpose: Cloud sync and authentication
- Data stored: Leads, personas, settings
- Privacy: https://supabase.com/privacy

---

## 12. Contact Us

If you have questions about this Privacy Policy or our data practices:

**Email**: [your-email@example.com]  
**GitHub Issues**: [https://github.com/yourusername/leadscout-ai/issues](https://github.com/yourusername/leadscout-ai/issues)

---

## 13. Summary

| Question | Answer |
|----------|--------|
| Do you sell my data? | **No, never** |
| Do you track my browsing? | **No** |
| Where is my data stored? | **Locally by default, optionally in cloud** |
| Can I delete my data? | **Yes, anytime** |
| Do you use analytics? | **No tracking scripts** |
| Is an account required? | **No, fully functional without login** |
| Who can see my leads? | **Only you** |

---

*This privacy policy is effective as of January 2025.*
