# 🔒 Card Command Center

A **local-only, security-focused** web application for managing payment card metadata and tracking spending patterns without ever storing sensitive information like full card numbers or CVV codes.

## ⚠️ Security Philosophy

**What This App Does:**
- ✅ Stores safe metadata: nickname, bank, network, last 4 digits, expiry, tags, notes, and optional links
- ✅ Tracks transaction history: amount, merchant, category, and date for spending insights
- ✅ Uses SHA-256 hashed PIN authentication to protect access
- ✅ Implements automatic session locking after 5 minutes of inactivity
- ✅ Provides panic wipe functionality to instantly destroy all local data
- ✅ Tracks failed login attempts and auto-wipes after 5 failures

**What This App Does NOT Do:**
- ❌ Never stores or handles full card numbers
- ❌ Never stores or handles CVV/CVC codes
- ❌ Never communicates with any backend or external APIs
- ❌ Never syncs data to the cloud
- ❌ Never exports data (security by design)

**Important:** This tool is designed for organizing card metadata and personal spending tracking only. Keep your actual full card numbers and CVVs in a proper password manager or secure vault.

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
5. All data is immediately erased

**What Gets Wiped:**
- All card metadata
- All transaction history
- PIN hash
- Failed attempt counter
- All localStorage entries under the `cardCommandCenter.*` namespace

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

## 💳 Features

### Card Management

**Add Cards:**
- Click "Add Card" button
- Fill in metadata fields (all fields except full card number/CVV)
- Required: label, bank, network, last 4 digits, expiration
- Optional: tags, notes, source URL

**Edit Cards:**
- Click the pencil icon on any card
- Modify any field
- Changes save immediately to localStorage

**Delete Cards:**
- Click the trash icon on any card
- Confirm deletion in the browser prompt
- Deletion is permanent (cannot be undone)

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
- `src/lib/storage.ts` - All localStorage operations, PIN hashing, panic wipe logic
- `src/lib/types.ts` - TypeScript interfaces for Card and AppSettings

**Components:**
- `src/components/LockScreen.tsx` - PIN entry, hash validation, failed attempt tracking
- `src/components/CardItem.tsx` - Individual card display component
- `src/components/CardForm.tsx` - Add/edit card modal form
- `src/components/PanicWipeDialog.tsx` - Confirmation dialog for manual wipe
- `src/components/StatsDashboard.tsx` - Spending analytics and insights dashboard
- `src/components/UsageForm.tsx` - Add/edit transaction modal form
- `src/App.tsx` - Main app container with tabs, search, filters, and card list

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
- All data is stored in your browser's `localStorage`
- Keys are namespaced under `cardCommandCenter.*`
- Nothing is ever sent over the network
- Data persists only in this browser on this device

**Clearing Data:**
- Manual: Use the Panic Wipe feature in the Danger Zone
- Automatic: Triggered after 5 failed PIN attempts
- Browser: Clear browser data for this site in browser settings

**Switching Browsers/Devices:**
- Data does NOT sync across browsers or devices
- You must manually re-enter cards on each browser/device
- This is intentional for security

---

## 🚨 Limitations & Important Notes

1. **No Cloud Sync:** Data only exists in this browser. If you clear browser data or switch devices, your cards are gone.

2. **No Export:** There is no export feature. This prevents accidental data leaks but means you must manually transfer cards if needed.

3. **PIN Recovery:** If you forget your PIN, the only option is a panic wipe. Write down your PIN and store it securely offline.

4. **Browser Compatibility:** Requires a modern browser with Web Crypto API support (all current browsers).

5. **Not a Password Manager:** This tool is for organizing card metadata only. Store actual sensitive data in a proper password manager like 1Password, Bitwarden, or similar.

6. **Local Only:** No backend means no remote wipe capability if your device is stolen (but the PIN lock provides protection).

---

## 📄 License

This project is open source and available under the MIT License.

---

## 🤝 Contributing

This is a security-focused tool. If you find vulnerabilities or have security improvements, please report them responsibly.

**Security Principles to Maintain:**
- Never add features that store full card numbers or CVVs
- Never add network communication features
- Never add export features without strong encryption
- Keep the panic wipe and auto-lock mechanisms intact
- Maintain the failed attempt counter and auto-wipe logic

---

## ⚡ Quick Reference

| Action | How |
|--------|-----|
| **Unlock app** | Enter PIN on lock screen |
| **Lock app manually** | Click "Lock" button in header |
| **Switch views** | Click "Cards" or "Insights" tabs |
| **Add card** | Cards tab → Click "Add Card" button, fill form |
| **Edit card** | Click pencil icon on card |
| **Delete card** | Click trash icon on card |
| **Search cards** | Type in search box at top of Cards tab |
| **Filter cards** | Use dropdown filters (status, tags, sort) |
| **Add transaction** | Insights tab → Click "Add Transaction" button |
| **View analytics** | Navigate to Insights tab |
| **Panic wipe** | Expand Danger Zone → Click "Panic Wipe" → Type DELETE → Confirm |
| **Reset after lost PIN** | Manual panic wipe or clear browser data for this site |

---

**Remember:** This tool helps you organize card metadata, but never replaces proper security practices. Keep your full card details in a secure password manager and enable fraud alerts with your banks.
