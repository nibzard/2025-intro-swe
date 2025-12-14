# VERSION HISTORY - Skripta (Student Forum)

This document tracks the chronological changes throughout the **Skripta** (Student Forum) project using semantic versioning (MAJOR.MINOR.PATCH).

**Project Name:** Skripta (formerly Studentski Forum)
**Team:** trikostura-jpavic-mlistes-djsartori
**Tech Stack:** Next.js, TypeScript, Supabase, Tailwind CSS

---

## V0.1.0 - Project Specification (November 5, 2025)

**Release Date:** November 5, 2025

### Added
- Initial project specification and requirements documentation
- Project proposal meeting required criteria

---

## V1.0.0 - Core Forum Implementation (December 3-4, 2025)

**Release Date:** December 4, 2025

### Added
- Complete Student Forum implementation with modern tech stack
  - Next.js frontend framework
  - Supabase backend and authentication
  - TypeScript for type safety
  - Tailwind CSS for styling
- Core forum features:
  - Topic creation and browsing
  - Reply system
  - User authentication and profiles
  - Category organization
- Markdown support for post creation
- Admin panel for moderation
- Profile editing capabilities
- Notification system
- Administrative tools for content moderation
- Mass update capabilities

### Changed
- Updated README with comprehensive project information

---

## V1.1.0 - File Attachments & UI Improvements (December 4-5, 2025)

**Release Date:** December 5, 2025

### Added
- File attachment feature for topics and replies
- Advanced file upload system with enhanced media support
- Comprehensive reply and topic improvements
- Profile customization features

### Fixed
- TypeScript errors and type annotations throughout codebase
- Supabase client initialization issues in multiple pages
- Storage policy setup for attachments
- Prerender errors on forum pages

---

## V1.2.0 - Mobile Optimization & Branding (December 5-6, 2025)

**Release Date:** December 6, 2025

### Added
- Comprehensive mobile responsive design
- Profile avatars across the entire site
- Skripta branding (renamed from Studentski Forum)
- Custom Croatian-inspired logo
- Favicon and site metadata
- Dark mode toggle with next-themes integration
- Dropdown theme switcher
- Security middleware and input sanitization

### Changed
- Redesigned homepage with modern Skripta branding
- Translated admin interface to Croatian
- Optimized admin and profile pages for mobile devices
- Simplified homepage CTA to single prominent button
- Updated copyright year to 2025
- Made avatar and banner uploads automatic on file selection

### Fixed
- Mobile layout issues on profile page
- Profile page avatar rendering issues
- ThemeProvider type imports
- Avatar upload functionality
- Profile picture removal functionality

---

## V1.3.0 - Advanced Features (December 6-7, 2025)

**Release Date:** December 7, 2025

### Added
- Advanced search functionality
- Profile image upload improvements
- Comprehensive reputation system
- Topic and reply editing capabilities
- Advanced forum features including:
  - Trending topics
  - Content filters
  - Pagination
  - User warnings and timeout system
- Private messaging system
- User follow/follower system
- Bookmarking functionality
- Topic/reply reporting system
- User ban system for admin moderation
- Solution marking for topics
- Mentions system (@username)

### Changed
- Improved notification system with real-time updates
- Enhanced mobile optimization
- Removed redundant UI buttons
- Improved UX for profile editing and image uploads

### Fixed
- Dark mode text visibility issues
- Avatar display in mobile menu
- Text overflow on profile pages
- Ambiguous column references in reputation system
- Profile editing redirect issues
- Reports query foreign key references
- Bookmarks page error handling
- Forum topic display with manual joins
- Registration orphaned profile cleanup

---

## V2.0.0 - Password Reset & Email System (December 7, 2025)

**Release Date:** December 7, 2025

### Added
- Complete custom password reset system
- Secure email-based password reset
- Email verification system
- Auth callback handlers for password recovery
- PKCE support for authentication flow
- Email templates matching website branding
- Base64 embedded logo for email compatibility
- Accessibility improvements:
  - Notification bell accessibility
  - Complete application-wide accessibility audit

### Changed
- Switched email system from Resend to Nodemailer with Gmail SMTP
- Renamed email sender from "Studentski Forum" to "Skripta"
- Enhanced email template design
- Improved password reset error handling and logging

### Fixed
- Password reset flow with PKCE compatibility
- RLS policy for server-side token operations
- Auth callback token handling
- Email transporter initialization for serverless environment
- Trailing slash issues in redirect URLs
- Croatian grammar in email templates
- Email logo loading and rendering

---

## V2.1.0 - Performance & Analytics (December 7-8, 2025)

**Release Date:** December 8, 2025

### Added
- Vercel Analytics and Speed Insights integration
- Unique view tracking per user/session
- Breadcrumb navigation across all forum pages
- Visual feedback and tooltips for navigation
- Comprehensive button animations
- Navbar bookmark notifications with animations
- Confirmation dialogs for critical actions (pin, lock topics)
- Profile pictures in admin dashboard user leaderboard
- Advanced search page with enhanced UX

### Changed
- Massive UI improvements and complete auth system overhaul
- Optimized website performance:
  - Database query optimization (3-5x faster)
  - Parallel query processing
  - Component-level improvements
- Improved topic and reply forms with enhanced features
- Enhanced visual design of topic pages
- Modern design improvements across entire website

### Fixed
- 404 errors across the site
- Not-found page (converted to client component)
- TypeScript errors in view tracking
- Cookie setting errors in Server Components
- Profile page redesign with modern UI
- TypeScript errors in forum page filters
- Slow page loads with parallel queries
- Topic metadata generation errors

---

## V2.2.0 - Gamification System (December 11, 2025)

**Release Date:** December 11, 2025

### Added
- Complete gamification system:
  - Achievement system with multiple achievements
  - User leaderboards (all-time and weekly)
  - Activity tracking and statistics
  - Automatic achievement checking on profile visits
  - Stats dashboard with comprehensive metrics
- Leaderboard navigation links in navbar and mobile menu
- Early adopter achievement (December 2025 launch date)
- IDE support with TypeScript type definitions

### Changed
- Separated client/server achievement logic for better performance
- Updated achievement imports and definitions
- Improved RLS policies for server-side achievement insertion

### Fixed
- TypeScript errors in achievements system
- Variable name conflicts in profile page
- Type inference issues in leaderboard
- Duplicate statistics in Stats Dashboard
- Achievement checking logic and error handling
- Database query optimizations for faster page loads (60-85% improvement)

---

## V2.3.0 - Content Moderation & Polish (December 12, 2025)

**Release Date:** December 12, 2025

### Added
- Comprehensive content moderation system (Croatian language):
  - Spam detection
  - Rate limiting
  - Content filtering
- Poll creation and voting system
- Reaction system for posts
- Admin notification system for warnings, bans, and timeouts
- Error boundaries for better error handling
- Client-side tab filtering
- Production optimizations for Vercel deployment

### Changed
- Translated content moderation to Croatian
- Optimized auth actions and reduced unnecessary queries
- Improved TypeScript type safety across application
- Enhanced private chat UI
- Improved follow/message notifications
- Profile save with instant scroll to top
- Loading overlay to prevent UI flash

### Fixed
- Linter and TypeScript improvements for polls and reactions
- Server-side imports in content moderation utilities
- TypeScript type errors in forum actions
- RLS-blocked operations with server actions
- AdminClient references in moderation functions
- Topic deletion UI updates
- Email verification action
- Notification profile queries
- Bookmarks page - hide deleted topics
- Profile edit navigation with router.back()
- Forum topic display issues
- Validation error messages to show specific fields

---

## V2.4.0 - AI Assistant (December 12, 2025)

**Release Date:** December 12, 2025

### Added
- AI Study Assistant powered by Google Gemini API (free tier)
  - Auto-title conversations
  - Conversation management
  - Delete conversation functionality
  - Floating assistant button
  - Back button to exit assistant
- Typing indicators with profile pictures in messaging
- Real-time typing indicator reliability improvements

### Changed
- Switched AI from Claude 3.5 Sonnet to Google Gemini for cost efficiency
- Improved typing indicator implementation
- Enhanced migration robustness

### Fixed
- Gemini API version and model compatibility
- Floating assistant button appearance and clickability
- Delete conversation overlay
- Console logging cleanup

### Removed
- AI Assistant feature (completely removed after testing)

---

## V2.5.0 - Registration & Authentication Polish (December 12-13, 2025)

**Release Date:** December 13, 2025

### Added
- Real-time email availability check during registration
- Username character counter
- Consistent placeholders across forms
- Terms of service and privacy policy pages
- Testimonial slider component for homepage
- Email verification enforcement before login
- Enhanced registration help text

### Changed
- Improved login consistency and session handling
- Persist registration form data across navigation
- Simplified registration flow and UI
- Enhanced back button behavior on terms/privacy pages
- Disable submit button on email conflict
- Tighter spacing and improved layout
- Fixed terms/privacy page navigation
- Tracked homepage and topic list changes
- Set baseUrl for path alias resolution

### Fixed
- Username field persistence in registration form
- Email verification check typing in login flow
- Turnstile site key handling
- Browser back navigation on terms/privacy pages

### Removed
- Turnstile captcha system (stripped UI, server verification, and validation)

---

## V2.5.1 - Package Dependencies Update (December 13, 2025)

**Release Date:** December 13, 2025

### Changed
- Updated package-lock.json with necessary dependencies for first-time installation

### Fixed
- First-time npm install dependency issues
- Package-lock.json conflicts

---

## Summary Statistics

- **Total Commits:** 241
- **Development Period:** November 5, 2025 - December 13, 2025 (38 days)
- **Major Versions:** 3 (V0, V1, V2)
- **Minor Versions:** 10
- **Patch Versions:** 1
- **Primary Tech Stack:** Next.js, TypeScript, Supabase, Tailwind CSS
- **Key Features:** Forum system, gamification, AI assistant (removed), content moderation, mobile-first design

---

## Key Milestones

| Date | Version | Milestone |
|------|---------|-----------|
| Nov 5, 2025 | V0.1.0 | Project specification |
| Dec 3, 2025 | V1.0.0 | Core forum implementation |
| Dec 6, 2025 | V1.2.0 | Rebranded to "Skripta" |
| Dec 7, 2025 | V2.0.0 | Complete authentication system |
| Dec 11, 2025 | V2.2.0 | Gamification system launched |
| Dec 12, 2025 | V2.4.0 | AI assistant (later removed) |
| Dec 13, 2025 | V2.5.1 | Current version |

---

## Versioning Guidelines

This project follows [Semantic Versioning](https://semver.org/):

- **MAJOR version** (X.0.0): Incompatible API changes or fundamental architecture changes
- **MINOR version** (0.X.0): New features added in a backward-compatible manner
- **PATCH version** (0.0.X): Backward-compatible bug fixes and minor improvements

---

*Last Updated: December 13, 2025*
