# 🔒 Card Command Center

A **security-focused** web application with **automatic cloud backup** for managing payment card metadata and tracking spending patterns without ever storing sensitive information like full card numbers or CVV codes.

## ⚠️ Security Philosophy

**What This App Does:**

- ✅ Stores safe metadata: nickname, bank, network, last 4 digits, expiry, tags, notes, and optional links
- ✅ Tracks transaction history: amount, merchant, category, and date for spending insights
- ✅ Uses SHA-256 hashed PIN authentication to protect access
- ✅ Implements automatic session locking after 5 minutes of inactivity
- ✅ Provides panic wipe functionality to instantly destroy all cloud data
- ✅ Tracks failed login attempts and auto-wipes after 5 failures
- ✅ **Automatically syncs all data to secure cloud storage in real-time**
- ✅ **Works offline with automatic sync queue when reconnected**
- ✅ **Accessible from any device with your PIN**

**What This App Does NOT Do:**

- ❌ Never stores or handles full card numbers
- ❌ Never stores or handles CVV/CVC codes
- ❌ Never shares your data with third parties
- ❌ Never makes your data publicly accessible

**Important:** This tool is designed for organizing card metadata and personal spending tracking only. Keep your actual full card numbers and CVVs in a proper password manager or secure vault.

---

## 🚀 Deployment

### ⚡ One-Click Deploy (Vercel)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FBboy9090%2FGhostWriter-)

Click → Sign in → Deploy. See [ONE_CLICK_DEPLOY.md](./ONE_CLICK_DEPLOY.md) for details.

### Deploy to Fly.io

This app is configured for deployment on [Fly.io](https://fly.io) with Docker.

**Prerequisites:**

- [Install Fly CLI](https://fly.io/docs/hands-on/install-flyctl/)
- Create a Fly.io account

**Deploy Steps:**

1. **Login to Fly.io:**

   ```bash
   flyctl auth login
   ```

2. **Launch your app (first time only):**

   ```bash
   flyctl launch
   ```

   - Accept the detected settings
   - Choose your region
   - Don't deploy yet if you want to customize `fly.toml` first

3. **Deploy:**

   ```bash
   flyctl deploy
   ```

4. **Open your app:**
   ```bash
   flyctl open
   ```

**Your app will be available at:** `https://ghostwriter.fly.dev`

### Docker Build Locally

To test the Docker build locally before deploying:

```bash
# Build the image
docker build -t ghostwriter .

# Run the container
docker run -p 3000:3000 ghostwriter

# Open in browser
# http://localhost:3000
```

### Architecture

- **Vite** builds the static frontend to `/dist`
- **Express** server serves:
  - Static files from `/dist`
  - API routes at `/api/*`
- **Single container** with Node.js 20 Alpine
- **Production optimized** with multi-stage build

---

## 🚀 Running Locally

This is a React + TypeScript + Vite application that runs entirely in your browser.

### Prerequisites

- Node.js (v18 or higher)
- npm (comes with Node.js)

### Installation & Running

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Start the development server:**

   ```bash
   npm run dev
   ```

3. **Open in browser:**
   The app will be available at `http://localhost:5173` (or the port shown in your terminal)

### Building for Production

```bash
npm run build
```

The optimized production files will be in the `dist/` directory. You can serve these files with any static file server.

---

## 🔐 How Security Features Work

### PIN Lock System

**First Run:**

- On first launch, you'll be prompted to create a 4-8 digit PIN
- Your PIN is immediately hashed using SHA-256 before storage
- The raw PIN is never stored anywhere
- You must confirm your PIN to prevent typos

**Subsequent Access:**

- Enter your PIN to unlock the app
- The app hashes your input and compares it to the stored hash
- Incorrect PINs are counted and tracked

**Failed Attempts:**

- Each incorrect PIN increments a failure counter
- After 5 failed attempts, the app automatically triggers a panic wipe
- All local data is permanently erased
- The app resets to first-run state

**Lost PIN:**

- There is no password recovery mechanism (by design)
- If you forget your PIN, you must perform a panic wipe
- This security measure prevents unauthorized access

### Inactivity Auto-Lock

- The app monitors mouse, keyboard, scroll, and click events
- If no activity is detected for **5 minutes**, the app automatically locks
- Your data remains intact when locked due to inactivity
- Simply enter your PIN again to continue

**Adjusting the timeout:**
Edit `src/lib/storage.ts` and change the `INACTIVITY_TIMEOUT` constant:

```typescript
export const INACTIVITY_TIMEOUT = 5 * 60 * 1000 // 5 minutes in milliseconds
```

### Panic Wipe / Self-Destruct

**Automatic Trigger:**

- Activates after 5 consecutive failed PIN attempts
- Shows a 2-second warning before wiping
- Cannot be cancelled once triggered

**Manual Trigger:**

1. Unlock the app normally
2. Scroll to the bottom and expand the "Danger Zone" section
3. Click "Panic Wipe"
4. Type `DELETE` to confirm
5. All data is immediately erased from cloud storage

**What Gets Wiped:**

- All card metadata
- All transaction history
- PIN hash
- Failed attempt counter
- All cloud storage entries under the `cardCommandCenter.*` namespace

**After Wipe:**

- The app reloads in first-run state
- You must set a new PIN
- Sample data is automatically loaded as a starting point
- Previous data cannot be recovered

**Adjusting max attempts:**
Edit `src/lib/storage.ts` and change the `MAX_FAILED_ATTEMPTS` constant:

```typescript
export const MAX_FAILED_ATTEMPTS = 5
```

---

## ☁️ Cloud Backup & Sync

### Automatic Cloud Backup

**Real-Time Sync:**

- Every card you add, edit, or delete is automatically saved to secure cloud storage
- Every transaction is instantly synced to the cloud
- No manual backup steps required
- **Works offline** - changes are queued and automatically synced when you reconnect

**Offline Mode:**

- App automatically detects when you're offline
- All changes are saved locally and queued for sync
- Orange "Offline" badge shows in header with queued changes count
- When you reconnect, all queued changes sync automatically
- Toast notifications inform you of offline/online status changes

**Reconnection Process:**

1. Connection is restored (you'll see a "Connection restored" toast)
2. App automatically syncs all queued changes
3. Status badge shows "Syncing..." with animated cloud icon
4. After completion, "All changes synced!" confirmation appears
5. Badge returns to normal "Synced" state

**Cross-Device Access:**

- Access your cards and transactions from any device
- Simply log in with your PIN
- All your data syncs automatically
- Offline changes on one device sync when that device reconnects

**Sync Status:**

- A badge in the header shows your current sync status:
  - **Online**: Normal operation, changes sync immediately
  - **Offline**: Changes queued for later sync (shows queue count)
  - **Syncing**: Processing queued changes
  - **Synced**: All data up to date (shows time since last sync)
- Hover over the badge for more details

**Data Security:**

- Your data is encrypted and securely stored
- Only you can access your data with your PIN
- No one else, including administrators, can see your card metadata

### Manual Export (Optional)

**Export Local Copy:**

- Navigate to the Data Management section
- Click "Export Backup" to download a JSON file
- Use for offline storage or importing to other systems
- Exported files contain plain JSON (store securely)

**Import from File:**

- Click "Import Backup" and select a JSON file
- Preview the data before importing
- Choose to merge with existing data or replace all data
- Imported data automatically syncs to cloud after import

---

## 💳 Features

### Card Management

**Add Cards:**

- Click "Add Card" button
- Fill in metadata fields (all fields except full card number/CVV)
- Required: label, bank, network, last 4 digits, expiration
- Optional: tags, notes, source URL
- Card automatically syncs to cloud

**Edit Cards:**

- Click the pencil icon on any card
- Modify any field
- Changes save immediately and sync to cloud

**Delete Cards:**

- Click the trash icon on any card
- Confirm deletion in the browser prompt
- Deletion is permanent and syncs to cloud (cannot be undone)

### Usage Tracking & Spending Insights

**Add Transactions:**

- Switch to the "Insights" tab
- Click "Add Transaction" button
- Select a card from your active cards
- Enter amount, date, merchant, and category
- Optional: Add notes about the transaction

**View Analytics:**

- **Overview Stats:** Total spending, transaction count, average transaction size, most used card
- **By Card:** See spending breakdown per card with percentages and transaction counts
- **By Category:** Analyze spending across categories (Dining, Groceries, Shopping, Travel, etc.)
- **Timeline:** Visual daily spending chart for the last 30 days
- **Insights:** AI-powered insights about your spending patterns and trends
- **Trend Comparison:** Compare current 30-day period vs previous 30 days

**Categories Supported:**

- Dining
- Groceries
- Shopping
- Travel
- Entertainment
- Bills
- Gas
- Healthcare
- Other

### Search & Filtering

**Search:**

- Real-time text search across label, bank, network, last 4 digits, and notes
- Type in the search box at the top of the Cards tab

**Filters:**

- **Status Filter:** All | Active | Frozen | Closed
- **Tag Filter:** Filter by any usage tag (shopping, bills, travel, etc.)
- **Sort Options:**
  - Sort by Label (A-Z)
  - Sort by Bank
  - Sort by Expiration (soonest first)

**Clear Filters:**

- Click "Clear Filters" to reset all search and filter criteria

### Card Metadata Model

Each card stores the following information:

```typescript
{
  id: "unique-identifier",           // Auto-generated
  label: "Main Visa – Online Shopping", // Nickname/description
  bank: "Chase",                       // Bank or issuer name
  network: "Visa",                     // Visa | Mastercard | Amex | Discover | Other
  last4: "1234",                       // Last 4 digits only
  expMonth: "12",                      // Expiration month (MM)
  expYear: "2028",                     // Expiration year (YYYY)
  status: "active",                    // active | frozen | closed
  usageTags: ["shopping", "primary"],  // Array of custom tags
  notes: "Use this for Amazon...",     // Free-form notes
  sourceUrl: "https://...",            // Optional link to bank page
  createdAt: 1234567890                // Timestamp when card was added
}
```

### Transaction Data Model

Each transaction stores the following information:

```typescript
{
  id: "unique-identifier",      // Auto-generated
  cardId: "card-id",             // References a card in your collection
  amount: 42.50,                 // Transaction amount in dollars
  merchant: "Amazon",            // Merchant name
  category: "Shopping",          // Spending category
  date: 1234567890,              // Transaction timestamp
  notes: "Optional notes..."     // Additional details
}
```

### Sample Data

On first run (or after a panic wipe), the app loads:

- **8 sample cards** demonstrating different:
  - Card networks (Visa, Mastercard, Amex, Discover)
  - Statuses (active, frozen, closed)
  - Usage tags (shopping, bills, travel, rewards, etc.)
  - Card types (personal, business, backup)
- **~300 sample transactions** spanning the last 90 days across various categories

You can delete sample data and add your own, or modify it as needed.

---

## 🏗️ Code Architecture

The codebase is modular and easy to customize:

### Key Files

**Storage & Security:**

- `src/lib/storage.ts` - All cloud storage operations, PIN hashing, panic wipe logic
- `src/lib/offline-sync.ts` - Offline detection and queued sync management
- `src/lib/types.ts` - TypeScript interfaces for Card and AppSettings

**Components:**

- `src/components/LockScreen.tsx` - PIN entry, hash validation, failed attempt tracking
- `src/components/CloudSyncStatus.tsx` - Real-time cloud sync status indicator
- `src/components/OfflineIndicator.tsx` - Offline mode detection and queue status display
- `src/components/CardItem.tsx` - Individual card display component
- `src/components/CardForm.tsx` - Add/edit card modal form
- `src/components/PanicWipeDialog.tsx` - Confirmation dialog for manual wipe
- `src/components/StatsDashboard.tsx` - Spending analytics and insights dashboard
- `src/components/UsageForm.tsx` - Add/edit transaction modal form
- `src/components/BackupManager.tsx` - Export/import functionality for manual backups
- `src/App.tsx` - Main app container with tabs, search, filters, and card list

**Hooks:**

- `src/hooks/use-offline-sync.ts` - React hook for offline sync status and operations
- `src/hooks/use-mobile.ts` - Mobile device detection

**Styling:**

- `src/index.css` - Custom color theme, fonts, and animations
- `src/components/ui/*` - Shadcn UI component library (pre-installed)

### Customization Points

**Change Inactivity Timeout:**
`src/lib/storage.ts` → `INACTIVITY_TIMEOUT`

**Change Max Failed Attempts:**
`src/lib/storage.ts` → `MAX_FAILED_ATTEMPTS`

**Modify Sample Data:**
`src/lib/storage.ts` → `resetToSampleData()` and `initializeSampleUsageData()` functions

**Add New Card Networks:**
`src/lib/types.ts` → `CardNetwork` type

**Add New Card Statuses:**
`src/lib/types.ts` → `CardStatus` type

**Customize Theme Colors:**
`src/index.css` → `:root` CSS variables

---

## 🎨 Design & UX

**Typography:**

- **Space Grotesk** - Primary font for UI elements
- **JetBrains Mono** - Monospace font for card numbers and dates

**Color Palette:**

- Deep navy primary color for authority and trust
- Vibrant cyan accent for interactive elements
- Alert red for destructive actions
- Secure green for success states

**Animations:**

- Smooth transitions between locked/unlocked states
- Shake animation on incorrect PIN entry
- Pulsing border on panic wipe confirmation
- Hover effects on cards and buttons

---

## 🛡️ Privacy & Data Storage

**Where Data Lives:**

- All data is stored in secure cloud storage provided by the Spark platform
- Data is encrypted and only accessible with your PIN
- Syncs automatically across all your devices
- No third-party access to your data

**Clearing Data:**

- Manual: Use the Panic Wipe feature in the Danger Zone
- Automatic: Triggered after 5 failed PIN attempts
- Both methods permanently delete all cloud data

**Switching Browsers/Devices:**

- Data automatically syncs across all browsers and devices
- Simply enter your PIN on any device to access your cards
- Changes on one device instantly appear on all others

**Export for Offline Backup:**

- Use the Export Backup feature in Data Management
- Download a JSON file of all your cards and transactions
- Store this file securely offline as an additional backup
- Import back anytime if needed

---

## 🚨 Limitations & Important Notes

1. **Cloud Storage:** Data is backed up to secure cloud storage and syncs across devices. Your PIN is required to access data.

2. **Manual Export Available:** You can export your data to JSON files for offline backup or to import into other systems.

3. **PIN Recovery:** If you forget your PIN, the only option is a panic wipe. Write down your PIN and store it securely offline.

4. **Browser Compatibility:** Requires a modern browser with Web Crypto API support (all current browsers).

5. **Not a Password Manager:** This tool is for organizing card metadata only. Store actual sensitive data in a proper password manager like 1Password, Bitwarden, or similar.

6. **Cloud-Based:** Data syncs to the cloud for convenience. If you need fully offline operation, this may not be the right tool for you.

---

## 📄 License

This project is open source and available under the MIT License.

---

## 🤝 Contributing

This is a security-focused tool. If you find vulnerabilities or have security improvements, please report them responsibly.

**Security Principles to Maintain:**

- Never add features that store full card numbers or CVVs
- Never share user data with third parties
- Keep cloud storage encrypted and secure
- Keep the panic wipe and auto-lock mechanisms intact
- Maintain the failed attempt counter and auto-wipe logic

---

## 🔧 Repository Maintenance

### Branch Cleanup Documentation

This repository includes comprehensive branch management documentation and automation:

- **[BRANCH_CLEANUP_SUMMARY.md](./BRANCH_CLEANUP_SUMMARY.md)** - Quick overview and next steps
- **[BRANCH_CLEANUP_GUIDE.md](./BRANCH_CLEANUP_GUIDE.md)** - Step-by-step cleanup instructions
- **[BRANCH_CLEANUP_ANALYSIS.md](./BRANCH_CLEANUP_ANALYSIS.md)** - Detailed branch analysis
- **[scripts/branch-cleanup.sh](./scripts/branch-cleanup.sh)** - Automated cleanup tool

These resources help maintain a clean repository by merging important updates and removing obsolete branches.

---

## ⚡ Quick Reference

| Action                   | How                                                             |
| ------------------------ | --------------------------------------------------------------- |
| **Unlock app**           | Enter PIN on lock screen                                        |
| **Lock app manually**    | Click "Lock" button in header                                   |
| **View sync status**     | Check badge in header (shows connection and sync status)        |
| **Check offline status** | Look for orange "Offline" badge or alert banner                 |
| **Switch views**         | Click "Cards" or "Insights" tabs                                |
| **Add card**             | Cards tab → Click "Add Card" button, fill form                  |
| **Edit card**            | Click pencil icon on card                                       |
| **Delete card**          | Click trash icon on card                                        |
| **Search cards**         | Type in search box at top of Cards tab                          |
| **Filter cards**         | Use dropdown filters (status, tags, sort)                       |
| **Add transaction**      | Insights tab → Click "Add Transaction" button                   |
| **View analytics**       | Navigate to Insights tab                                        |
| **Export backup**        | Data Management → Click "Export Backup"                         |
| **Import backup**        | Data Management → Click "Import Backup" → Select file           |
| **Panic wipe**           | Expand Danger Zone → Click "Panic Wipe" → Type DELETE → Confirm |
| **Reset after lost PIN** | Manual panic wipe (all cloud data will be erased)               |

---

**Remember:** This tool helps you organize card metadata with automatic cloud backup, but never replaces proper security practices. Keep your full card details in a secure password manager and enable fraud alerts with your banks.
