# Planning Guide

A security-focused payment card metadata manager with automatic cloud backup and spending insights that helps users organize and track their cards and transactions without ever storing sensitive data like full card numbers or CVVs.

**Experience Qualities**:
1. **Secure** - Every interaction reinforces that sensitive data is protected, with visual cues and clear messaging about what is and isn't stored
2. **Reassuring** - The PIN lock, automatic cloud backup, panic wipe, and security warnings create confidence that the tool prioritizes user safety and data persistence
3. **Efficient** - Powerful search, filtering, and sorting capabilities make finding the right card instantaneous, while analytics provide actionable spending insights

**Complexity Level**: Light Application (multiple features with basic state)
This is a focused tool with several interconnected features (card CRUD, authentication, security measures, cloud sync, usage tracking, analytics dashboard) but maintains a tabbed single-view paradigm with modals for interactions.

## Essential Features

**Automatic Cloud Backup**
- Functionality: All card metadata and transactions automatically sync to secure cloud storage in real-time
- Purpose: Ensure data is never lost and is accessible across all user devices without manual backup steps
- Trigger: Any data modification (add/edit/delete card, add transaction, import data)
- Progression: User makes change → Data saves to cloud → Sync status updates → "Synced" indicator appears
- Success criteria: All changes persist immediately to cloud; sync status badge shows last sync time; data accessible from any device

**PIN Lock Screen**
- Functionality: SHA-256 hashed PIN authentication that guards access to card metadata
- Purpose: Prevents unauthorized access if someone gains physical access to the user's device
- Trigger: App load, or after 5 minutes of inactivity
- Progression: App loads → Lock screen displays → User enters PIN → Hash validation → Main app unlocks
- Success criteria: Correct PIN grants access; incorrect attempts increment failure counter; 5 failures trigger panic wipe

**Card Metadata Manager**
- Functionality: CRUD operations for card metadata (nickname, bank, network, last 4 digits, expiry, tags, notes, source link)
- Purpose: Organize and track payment cards without storing sensitive information
- Trigger: User clicks "Add Card" button or clicks edit icon on existing card
- Progression: Click action → Modal opens with form → User fills metadata → Save → Card appears in list → Data syncs to cloud
- Success criteria: Cards persist across sessions and devices, display all metadata clearly, and can be edited or deleted

**Usage Tracking & Transaction Logging**
- Functionality: Record transaction details (amount, merchant, category, date) associated with specific cards
- Purpose: Enable spending insights and usage analytics without storing sensitive payment information
- Trigger: User clicks "Add Transaction" button in Insights tab
- Progression: Click action → Modal opens → User selects card and enters transaction details → Save → Transaction syncs to cloud and appears in analytics
- Success criteria: Transactions persist across sessions and devices, link correctly to cards, and update analytics in real-time

**Spending Insights Dashboard**
- Functionality: Visual analytics showing spending by card, category, and time period with trend analysis
- Purpose: Help users understand spending patterns and make informed decisions about card usage
- Trigger: User switches to "Insights" tab
- Progression: Tab selection → Dashboard loads → Statistics calculate from usage data → Charts and metrics display
- Success criteria: Analytics update instantly when transactions added; show accurate totals, percentages, and trends; compare current vs previous periods

**Search & Filter System**
- Functionality: Real-time text search and multiple filter dropdowns (status, tags, sort order)
- Purpose: Quickly locate specific cards among many
- Trigger: User types in search box or selects filter options
- Progression: User inputs criteria → List updates in real-time → Matching cards display → Empty state shows if no matches
- Success criteria: All search/filter combinations work instantly; multiple filters combine correctly

**Panic Wipe System**
- Functionality: Complete erasure of all local data via manual trigger or automatic activation after failed login attempts
- Purpose: Emergency security measure to protect card metadata in compromised situations
- Trigger: Manual button click in danger zone OR 5 failed PIN attempts
- Progression: Trigger activated → Confirmation dialog (if manual) → All localStorage keys deleted → App resets to first-run state → Success message displays
- Success criteria: All data completely removed; app returns to fresh install state; user must set new PIN

**Inactivity Auto-Lock**
- Functionality: Automatic re-locking after 5 minutes of no user interaction
- Purpose: Protect data if user walks away from unlocked device
- Trigger: No mouse/keyboard events detected for 5 minutes
- Progression: User inactive → Timer counts down → 5 minutes elapsed → Lock screen appears → Data remains intact
- Success criteria: Timer resets on any interaction; lock engages precisely at timeout; data preserved

**Backup Export/Import**
- Functionality: Export all card metadata and transactions to a JSON file, and import from previously exported backups
- Purpose: Allow users to create portable offline backups in addition to automatic cloud sync, or transfer data between different systems
- Trigger: User clicks "Export Backup" or "Import Backup" button in Data Management section
- Progression: Export: Click button → Confirmation dialog → JSON file downloads → Success toast; Import: Click button → Select file → Preview data → Choose merge or replace → Confirm → Data restored → Success toast
- Success criteria: Export creates valid JSON with all cards and transactions; import validates file format; merge adds only new items; replace overwrites all data; corrupted files show error message; all imports sync to cloud after completion

## Edge Case Handling

- **First Run Setup**: If no PIN exists, redirect to PIN creation flow with confirmation field to prevent typos
- **No Cards State**: Show welcoming empty state with "Add Your First Card" CTA and explanation of what metadata is safe to store
- **No Usage Data**: Show empty state in analytics dashboard encouraging users to add transactions for insights
- **Browser Without Crypto API**: Show error message that app requires modern browser with Web Crypto API support
- **Lost PIN**: Inform user that only option is panic wipe (by design - no backdoor); provide clear warning during PIN setup
- **Expired Cards**: Visual indicator on cards past expiry date; filter to show only expired cards for cleanup
- **Duplicate Prevention**: Warn if adding card with same last 4 and bank as existing card
- **Cloud Sync Status**: Always display current sync status in header; show "Synced" with timestamp after successful operations
- **Cloud Sync Failure**: If cloud save fails, show error toast but keep data in local memory; retry sync on next operation
- **Offline Mode**: Detect when offline and show appropriate messaging; queue changes for sync when connection restored
- **Backup Security**: Exported JSON files contain plain metadata; warn users to store securely and not share publicly
- **Invalid Backup Files**: Show clear error messages for corrupted or invalid JSON files during import
- **Backup File Conflicts**: During merge import, skip items with duplicate IDs; during replace, clear all existing data first
- **Deleted Cards with Usage History**: Usage data for deleted cards remains for analytics continuity but shows as "Unknown Card"
- **Future Dated Transactions**: Prevent adding transactions with dates in the future

## Design Direction

The design should evoke feelings of **security**, **reliability**, and **clarity**. Visual language should communicate both protection and seamless synchronization - like a digital security vault with cloud intelligence. The interface should feel authoritative yet approachable, with clear hierarchies that make security features obvious, operational features efficient, cloud sync status transparent, and insights actionable.

## Color Selection

A security-focused palette with strong contrast and clear semantic meaning.

- **Primary Color (Deep Navy)**: `oklch(0.25 0.05 250)` - Authoritative and secure; conveys trust and stability for the main UI framework
- **Secondary Colors**: 
  - **Card Background (Cool Gray)**: `oklch(0.96 0.01 250)` - Subtle, professional background for card containers
  - **Muted Blue**: `oklch(0.65 0.08 250)` - Supporting color for secondary actions and borders
- **Accent Color (Vibrant Cyan)**: `oklch(0.72 0.15 200)` - High-tech feel for active states, focus rings, and interactive elements; signals "active" and "accessible"
- **Destructive (Alert Red)**: `oklch(0.55 0.22 25)` - Clear danger signal for panic wipe and delete actions
- **Success (Secure Green)**: `oklch(0.65 0.15 145)` - Positive reinforcement for successful PIN entry and save actions
- **Foreground/Background Pairings**:
  - Primary Navy (`oklch(0.25 0.05 250)`): White text (`oklch(0.99 0 0)`) - Ratio 10.2:1 ✓
  - Card Background (`oklch(0.96 0.01 250)`): Dark Gray text (`oklch(0.25 0 0)`) - Ratio 12.5:1 ✓
  - Accent Cyan (`oklch(0.72 0.15 200)`): Dark Navy text (`oklch(0.20 0.05 250)`) - Ratio 7.8:1 ✓
  - Destructive Red (`oklch(0.55 0.22 25)`): White text (`oklch(0.99 0 0)`) - Ratio 5.2:1 ✓

## Font Selection

Typography should convey precision, security, and modern technical confidence - like a professional security system interface.

- **Primary Font**: **JetBrains Mono** - Monospace font for technical credibility; excellent for displaying card numbers (last 4 digits) and structured data
- **Secondary Font**: **Space Grotesk** - Modern geometric sans-serif for headings and labels; feels contemporary and authoritative

**Typographic Hierarchy**:
- H1 (App Title "Card Command Center"): Space Grotesk Bold / 32px / tight letter-spacing (-0.02em)
- H2 (Section Headers): Space Grotesk Semibold / 20px / normal letter-spacing
- H3 (Card Labels): Space Grotesk Medium / 16px / normal letter-spacing
- Body (Card metadata, descriptions): Space Grotesk Regular / 14px / normal letter-spacing / line-height 1.6
- Monospace Data (Card numbers, dates): JetBrains Mono Medium / 14px / tracking-wide / used for last 4 digits and expiry dates
- Small Text (Helper text, warnings): Space Grotesk Regular / 12px / line-height 1.5
- Button Text: Space Grotesk Semibold / 14px / uppercase tracking

## Animations

Animations should reinforce security and precision - deliberate, not decorative. Use motion to guide attention during critical security moments and provide satisfying feedback for organizational tasks.

- **Lock/Unlock Transitions**: Smooth fade + scale animation when transitioning between lock screen and main app (300ms ease-out) - feels like a vault opening
- **PIN Entry Feedback**: Subtle shake animation on failed PIN (400ms) - universally understood "no" signal; success shows quick green flash on input field
- **Card Interactions**: Gentle lift + shadow on hover (150ms); smooth height expansion when opening edit modal
- **Panic Wipe Warning**: Pulsing red border on confirmation dialog (slow 2s pulse) - creates appropriate sense of caution
- **Filter/Search Updates**: Staggered fade-in for card list items (50ms delay between each) - creates smooth, organized feel
- **Inactivity Warning**: 30-second countdown with growing intensity (scale + color shift) before auto-lock engages

## Component Selection

**Components**:
- **Dialog (Lock Screen & Modals)**: Shadcn Dialog for PIN entry, card add/edit forms, transaction forms, and panic wipe confirmation - full-screen dialog for lock screen with backdrop blur
- **Card**: Shadcn Card component for each card metadata display and analytics stat cards - customized with status badges and hover states
- **Tabs**: Shadcn Tabs for switching between Cards and Insights views - prominent tab bar with icons
- **Input**: Shadcn Input for search box and form fields - with leading icons from Phosphor
- **Select**: Shadcn Select for status filter, tag filter, sort dropdown, and transaction category selection
- **Button**: Shadcn Button with variants - default for primary, destructive for panic wipe, outline for secondary actions
- **Badge**: Shadcn Badge for status indicators (active=green, frozen=blue, closed=gray), usage tags, and category labels
- **Alert**: Shadcn Alert for security warnings and helper text
- **Separator**: Shadcn Separator to divide sections (danger zone, settings)

**Customizations**:
- **Card Status Indicators**: Color-coded left border (4px) on card containers matching status
- **Security Badge**: Custom component in header showing lock icon + "Secured" text when unlocked
- **PIN Input Dots**: Custom masked input showing dots for each digit entered
- **Countdown Timer**: Custom circular progress indicator for inactivity timeout warning
- **Spending Charts**: Custom bar chart visualization using CSS for daily spending trends
- **Progress Bars**: Custom horizontal progress bars showing spending distribution by card and category

**States**:
- **Buttons**: Clear hover (lift + brightness), active (pressed scale), disabled (reduced opacity + no pointer)
- **Inputs**: Focus ring in accent color with glow effect, error state with red border + shake
- **Cards**: Hover elevation, selected state with accent border, expired cards with muted appearance
- **Lock Screen**: Loading state during hash validation (subtle spinner)
- **Analytics**: Loading state while calculating statistics, empty state with call-to-action

**Icon Selection**:
- Lock/Unlock: `Lock`, `LockOpen` (Phosphor) - for security states
- Cards: `CreditCard` - for add card button and empty states
- Search: `MagnifyingGlass` - for search input
- Filter: `Funnel` - for filter controls
- Panic: `Warning` - for danger zone and wipe confirmation
- Edit: `PencilSimple` - for card edit action
- Delete: `Trash` - for card delete action
- Link: `Link` - for source URL links
- Status: `CheckCircle` (active), `Snowflake` (frozen), `XCircle` (closed)
- Tags: `Tag` - for usage tags
- Timer: `Timer` - for inactivity countdown
- Analytics: `ChartLineUp`, `ChartBarHorizontal`, `TrendUp`, `Calendar`, `Receipt` - for insights dashboard
- Trends: `ArrowUp` (increase), `ArrowDown` (decrease), `Minus` (neutral)
- Backup: `DownloadSimple` (export), `UploadSimple` (import), `Database` - for data management

**Spacing**:
- Container padding: `p-6` (24px)
- Card grid gap: `gap-4` (16px)
- Form field spacing: `space-y-4` (16px)
- Section margins: `mb-8` (32px)
- Tight inline spacing (badges): `gap-2` (8px)
- Dashboard card spacing: `space-y-6` (24px)

**Mobile**:
- Single column card grid on mobile (<768px)
- Sticky tab bar at top for quick navigation
- Full-width analytics cards stacking vertically
- Bottom sheet for add/edit forms (using Shadcn Sheet component)
- Larger touch targets for PIN input (48px minimum)
- Collapsible filter section to save vertical space
- Cards take full width with comfortable padding
- Horizontal scroll for timeline chart on small screens
