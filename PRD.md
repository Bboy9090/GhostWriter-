# Universal Cart - Product Requirements Document

> **Shop Anywhere. Save Everything. Share with Anyone.**

A revolutionary universal shopping companion that lets you save items from ANY store on the web (and in real life), organize them into collections, share with friends and family, track prices, and never lose a great find again.

## 🎯 Vision

Universal Cart is the **ultimate wishlist aggregator** - combining the power of a universal shopping cart with social features that make finding, saving, and sharing products a delightful experience. Whether you're browsing Amazon, scrolling Instagram, walking through Target, or discovering a local boutique, Universal Cart captures it all in one beautiful, organized place.

## ✨ Experience Qualities

1. **Universal** - Works with any store, any product, anywhere in the world. One cart to rule them all.
2. **Social** - Share wishlists with friends, chat about finds, discover what others love.
3. **Organized** - Collections, tags, priorities, and smart filters keep your cart manageable.
4. **Secure** - PIN-protected access, encrypted sync, and panic wipe for ultimate privacy.
5. **Delightful** - Beautiful animations, satisfying sounds, and a UI that sparks joy.

## 🚀 Core Features

### 1. Right-Click to Add (Browser Extension)
- **Functionality**: Right-click on any product on any website to instantly add it to Universal Cart
- **Auto-Detection**: Automatically captures product name, price, image, and store information
- **Supported Stores**: Amazon, Walmart, Target, Best Buy, Nike, Etsy, eBay, Shopify stores, and 1000+ more
- **Fallback**: Manual entry for any product that can't be auto-detected

### 2. Universal Cart Dashboard
- **Grid/List Views**: Toggle between card grid and compact list views
- **Smart Filters**: Filter by store, priority, collection, price range, or tags
- **Search**: Full-text search across all items, notes, and tags
- **Sort Options**: Newest, price (low/high), name, priority
- **Price Tracking**: Visual indicators for price drops and sale items
- **Quick Actions**: One-click purchase links, share, edit, or remove

### 3. Collections System
- **Custom Collections**: Create themed collections (Wishlist, Gift Ideas, Tech Gadgets, etc.)
- **Visual Customization**: Choose emoji icons and colors for each collection
- **Privacy Controls**: Public or private collections, share with specific friends
- **Smart Counts**: Real-time item counts per collection

### 4. Priority Levels
- 💭 **Want**: Nice to have, not urgent
- ✅ **Need**: Essential items to purchase soon
- ✨ **Dream**: Aspirational items, someday purchases
- 🎁 **Gift**: Gift ideas for others

### 5. Social Features

#### Friends & Sharing
- Add friends by username
- View friends' public wishlists
- Share specific items or entire collections
- Friend request system with pending/accepted states

#### In-App Chat
- Real-time messaging with friends
- Share cart items directly in chat
- Item preview cards in messages
- Conversation history

#### Activity Feed
- See when friends add items
- Price drop alerts from friend's wishlists
- Like and comment on posts
- Collection creation announcements

### 6. Quick Capture (Real-Life Mode)
- **Photo Capture**: Take photos of products in physical stores
- **Barcode Scanner**: Scan barcodes for instant product lookup
- **Manual Entry**: Quick form for in-store finds
- **Location Tagging**: Remember which aisle/store for later
- **Convert to Cart Item**: Easily upgrade captures to full cart items

### 7. Price Tracking
- **Price History**: Track price changes over time
- **Sale Detection**: Visual badges for items on sale
- **Savings Calculator**: See how much you've saved
- **Alerts**: Set target prices for notifications (coming soon)

### 8. Security Features
- **PIN Lock**: 4-digit PIN protection
- **Auto-Lock**: Lock after 10 minutes of inactivity
- **Panic Wipe**: Emergency data deletion
- **Cloud Sync**: Encrypted backup across devices
- **Offline Mode**: Full functionality without internet

## 🎨 Design Direction

### Visual Language
- **Vibrant & Modern**: Purple-to-pink gradient primary colors with teal accents
- **Dark Mode First**: Rich, deep backgrounds with glowing accents
- **Playful Yet Professional**: Rounded corners, smooth animations, emoji icons
- **Store Branding**: Visual cues (colors, logos) for recognized stores

### Color Palette
- **Primary**: Vibrant Purple `oklch(0.65 0.22 300)`
- **Accent**: Teal/Cyan `oklch(0.70 0.15 190)`
- **Success**: Green `oklch(0.65 0.18 145)`
- **Warning**: Amber `oklch(0.75 0.18 75)`
- **Destructive**: Red `oklch(0.60 0.22 25)`

### Typography
- **Primary**: Inter - Modern, clean, highly readable
- **Monospace**: JetBrains Mono - For prices and codes

### Animations
- **Micro-interactions**: Satisfying hover states, button presses
- **Page Transitions**: Smooth tab switching, modal slides
- **Loading States**: Skeleton screens, subtle spinners
- **Celebration**: Confetti for milestones, sparkles for price drops

## 📱 Mobile Considerations

- **Responsive Grid**: 1 column on mobile, 2 on tablet, 3 on desktop
- **Bottom Navigation**: Easy thumb access on mobile
- **Swipe Actions**: Swipe to delete, share, or mark as purchased
- **Full-Screen Dialogs**: Forms become sheets on mobile
- **Touch Targets**: Minimum 44px for all interactive elements

## 🔮 Future Features (Roadmap)

### Phase 2: Smart Features
- AI-powered product recommendations
- Automatic duplicate detection
- Price prediction (best time to buy)
- Browser extension for all major browsers

### Phase 3: Enhanced Social
- Public profiles and follow system
- Group wishlists for events/weddings
- Gift registry mode
- Social shopping challenges

### Phase 4: Commerce Integration
- One-click checkout across stores
- Price comparison engine
- Cashback and coupon integration
- Affiliate earnings for sharing

### Phase 5: Real-Life Bridge
- AR product visualization
- Store inventory checking
- In-store navigation
- Receipt scanning

## 🛡️ Edge Cases

- **First Run**: Guided onboarding with sample data
- **Empty States**: Friendly illustrations with clear CTAs
- **Offline Mode**: Queue all changes, sync when online
- **Store Not Detected**: Easy manual store selection
- **Image Load Failures**: Beautiful fallback with store emoji
- **Price Not Found**: Manual price entry option
- **Duplicate Items**: Warning with option to increment quantity
- **Deleted Items**: Soft delete with 30-day recovery

## 📊 Success Metrics

- **Engagement**: Items added per user per week
- **Retention**: Weekly active users
- **Social**: Friend connections, shares per user
- **Conversion**: Click-throughs to purchase
- **Satisfaction**: App store rating, NPS score

## 🏗️ Technical Architecture

### Frontend
- React 19 with TypeScript
- Vite for blazing-fast builds
- Tailwind CSS v4 with custom theme
- Framer Motion for animations
- Radix UI primitives (via shadcn/ui)
- Phosphor Icons

### State & Data
- React hooks for local state
- Spark KV for cloud persistence
- LocalStorage for offline backup
- Optimistic updates with sync queue

### Security
- SHA-256 PIN hashing
- No sensitive data stored
- Encrypted cloud sync
- Panic wipe capability

---

**Universal Cart** - *Your shopping companion across the entire internet and beyond.* 🛒✨
