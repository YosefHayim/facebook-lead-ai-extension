# LeadScout AI - Facebook Lead Generation

AI-powered lead scouting for Facebook groups and feeds. Find high-intent leads and generate personalized replies.

---

## Chrome Web Store Submission Details

### Short Description (132 characters max)
```
AI-powered lead scouting for Facebook groups. Find high-intent leads and generate personalized replies with Gemini or OpenAI.
```

### Detailed Description (For Chrome Web Store Listing)
```
LeadScout AI helps freelancers, agencies, and sales professionals find potential clients in Facebook groups without the manual effort.

KEY FEATURES:

Manual Scan Mode - You control when to scan. Click "Scan This Page" on any Facebook page to analyze posts for buying intent. No automated background activity.

AI-Powered Lead Detection - Uses Google Gemini or OpenAI to analyze posts and identify high-intent signals like "looking for", "need help with", "recommendations for", etc.

Smart Lead Scoring - Each lead gets a score (1-100) based on intent strength, urgency, and relevance to your business.

Personalized Reply Generation - Get AI-drafted responses tailored to your persona and the specific post context.

Group Manager - Save and organize Facebook groups you want to monitor. Quick-search within groups using Facebook's native search.

Multiple Personas - Create different business personas with unique keywords, tone, and value propositions.

Response Tracking - Track which leads you've contacted and their outcomes.

Privacy-Focused - Your data stays local. API keys are stored in your browser only. Optional cloud sync requires explicit login.

HOW IT WORKS:
1. Navigate to any Facebook group or feed
2. Click the extension icon and select "Scan This Page"
3. Review detected leads with AI analysis
4. Copy AI-generated replies or customize your own
5. Track your outreach progress

Perfect for: Freelancers, Marketing Agencies, Sales Teams, Consultants, B2B Service Providers

Bring Your Own API Key - Works with Google Gemini (free tier available) or OpenAI.
```

### Category
```
Productivity
```

### Language
```
English
```

---

## Permissions Justification

**IMPORTANT**: Each permission below is required and justified. Include these explanations in your Chrome Web Store submission under "Permissions Justification".

| Permission | Why It's Needed |
|------------|-----------------|
| `storage` | Store user preferences, saved leads, personas, and group configurations locally in the browser. No data is sent to external servers without explicit user consent. |
| `sidePanel` | Display the main LeadScout AI interface in Chrome's side panel for easy access while browsing Facebook without leaving the page. |
| `activeTab` | Access the current Facebook tab content only when the user clicks "Scan This Page". This is user-initiated and required to read post content for AI analysis. |
| `tabs` | Open new tabs for Facebook group searches and navigate to specific groups from the Group Manager feature. |
| `identity` | (Optional feature) Enable Google OAuth login for optional cloud sync of leads and settings via Supabase. Users can use the extension fully without logging in. |
| `host_permissions: *://*.facebook.com/*` | Access Facebook pages to read post content for lead analysis. The extension ONLY activates on Facebook domains and ONLY when the user initiates a scan. |

### Single Purpose Description
```
LeadScout AI has a single purpose: help users find potential business leads in Facebook posts and generate appropriate responses. All features (scanning, analysis, reply generation, group management) directly support this core functionality.
```

---

## Privacy Policy (Required for Chrome Web Store)

Create a privacy policy page with this content:

```
PRIVACY POLICY FOR LEADSCOUT AI

Last Updated: [DATE]

1. DATA COLLECTION
LeadScout AI collects and processes the following data:
- Facebook post content (text only) from pages you manually scan
- Post author names and profile URLs for lead identification
- Your configured personas and preferences

2. DATA STORAGE
- All data is stored locally in your browser using Chrome's storage API
- API keys (Gemini/OpenAI) are stored locally and never transmitted to our servers
- Optional cloud sync (requires login) stores leads and settings in Supabase with encryption

3. DATA SHARING
- Post content is sent to Google Gemini or OpenAI (your choice) for AI analysis
- No data is sold or shared with third parties
- No analytics or tracking scripts are included

4. USER CONTROL
- Delete all local data anytime via extension settings
- Disable cloud sync at any time
- No account required for core functionality

5. THIRD-PARTY SERVICES
- Google Gemini API (if selected): Subject to Google's Privacy Policy
- OpenAI API (if selected): Subject to OpenAI's Privacy Policy
- Supabase (optional cloud sync): Subject to Supabase Privacy Policy

6. CONTACT
[Your contact email]
```

---

## Features

### Core Features
- **Manual Scan Mode** - User-initiated scanning only, no automated background activity
- **AI Lead Detection** - Identifies buying intent using Gemini or OpenAI
- **Lead Scoring** - 1-100 score based on intent strength and urgency
- **Reply Generation** - AI-drafted personalized responses
- **Multiple Personas** - Different business profiles with unique keywords and tone

### Organization
- **Group Manager** - Save and organize Facebook groups to monitor
- **In-Group Search** - Quick search within groups using Facebook's native search
- **Lead Tracking** - Mark leads as contacted, converted, or ignored
- **Response Tracking** - Track outreach outcomes

### Privacy & Compliance
- **Transparency Badge** - Optional disclosure text for AI-assisted replies
- **Rate Limiting** - Configurable session limits to respect platform guidelines
- **Local Storage** - Data stays in your browser by default
- **Optional Cloud Sync** - Explicit opt-in with Supabase authentication

---

## Installation

### From Chrome Web Store
1. Visit the Chrome Web Store listing
2. Click "Add to Chrome"
3. Pin the extension for easy access

### Development Build
```bash
# Clone the repository
git clone https://github.com/yourusername/leadscout-ai.git
cd leadscout-ai

# Install dependencies
npm install

# Development mode with hot reload
npm run dev

# Production build
npm run build

# Create ZIP for Chrome Web Store
npm run zip
```

---

## Setup

### 1. Get an API Key

**Google Gemini (Recommended - Free Tier Available)**
1. Visit [Google AI Studio](https://aistudio.google.com/apikey)
2. Create a new API key
3. Copy the key

**OpenAI**
1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy the key

### 2. Configure the Extension
1. Click the LeadScout AI icon
2. Go to Settings/Options
3. Paste your API key
4. Select your AI provider (Gemini or OpenAI)

### 3. Create a Persona
1. Open the Options page
2. Go to the Personas tab
3. Create a persona with:
   - Your business role
   - Keywords to match (e.g., "need website", "looking for developer")
   - Negative keywords to exclude
   - Your value proposition
   - Preferred AI tone

---

## Usage

### Scanning for Leads
1. Navigate to any Facebook group or feed
2. Click the LeadScout AI icon
3. Click "Scan This Page"
4. Review detected leads in the side panel

### Managing Leads
- **View Analysis** - See AI reasoning and lead score
- **Generate Reply** - Get AI-drafted response
- **Track Status** - Mark as contacted/converted/ignored
- **Give Feedback** - Rate lead quality to improve detection

### Group Management
1. Open the Groups tab
2. Add Facebook groups by URL
3. Use quick search to find posts in groups
4. Track leads found per group

---

## Tech Stack

- **Framework**: WXT (Web Extension Tools)
- **UI**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **State**: Zustand
- **AI**: Google Gemini / OpenAI
- **Auth**: Supabase (optional)

---

## Screenshots for Chrome Web Store

Prepare the following screenshots (1280x800 or 640x400):

1. **Main Interface** - Side panel showing lead list with scores
2. **Lead Analysis** - Expanded lead card showing AI reasoning
3. **Scan in Action** - Facebook page with scan button visible
4. **Group Manager** - Groups tab with saved groups
5. **Settings** - Options page with API configuration
6. **Reply Generation** - AI-generated reply for a lead

### Promotional Images
- **Small Tile** (440x280): Logo with tagline
- **Marquee** (1400x560): Feature showcase

---

## Store Listing Checklist

- [ ] Short description (132 chars max)
- [ ] Detailed description
- [ ] Privacy policy URL
- [ ] At least 1 screenshot (1280x800 or 640x400)
- [ ] Extension icon (128x128)
- [ ] Category selected (Productivity)
- [ ] Permission justifications written
- [ ] Single purpose description

---

## Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/leadscout-ai/issues)
- **Email**: [your-email@example.com]

---

## License

MIT License - See LICENSE file for details
