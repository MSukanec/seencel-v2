# Development Standards & Architecture Decisions

This document serves as the **Single Source of Truth** for all developers and AI agents working on the SEENCEL v2 project. Follow these guidelines strictly to maintain consistency and "Enterprise" quality.

## 1. user Interface (UI/UX)

### Notifications
- **System**: We use **Sonner** (`sonner`) for all application notifications.
- **Rule**: **NEVER** display inline success/error messages (e.g., text below a button).
- **Usage**:
  ```tsx
  import { toast } from "sonner";
  // Success
  toast.success(t('success'));
  // Error
  toast.error(t('error'));
  ```

### Form Components
- **Phone Numbers**: ALWAYS use the custom `PhoneInput` component.
  - Path: `@/components/ui/phone-input`
  - Features: Automatic E.164 formatting, country flags, spanish search.
- **Avatars**: For lists of users/members, usage the `AvatarStack` component.

### Design System
- **Library**: Shadcn/ui is the core library.
- **Theme**: Ensure all components support **Dark Mode**. Text on primary buttons must be readable (white text on accent color).

## 2. Internationalization (i18n)
- **Library**: `next-intl`.
- **Rule**: **NO HARDCODED STRINGS** in the UI. All user-facing text must be extracted to `messages/es.json`.
- **Locale**: The default and primary locale is Spanish (`es`).

## 3. Data & Backend (Supabase)

### Row Level Security (RLS)
- **Profile Updates**: The `user_data` table often has strict RLS preventing direct `INSERT` from the client context if the row implies system creation.
- **Pattern**: Use `.update()` instead of `.upsert()` when modifying existing user profiles to avoid 403 errors.

### Assets & Storage
- **Logos/Images**: Always use the `getStorageUrl` utility to generate public URLs.
- **Uploads**: ALL user uploads (avatars, attachments) MUST be processed via `src/lib/image-optimizer.ts` before creating the Supabase record.
  - Standard: WebP, 80% quality, max 1024px.
- **Storage Strategy**: Prefer `logo_path` column over legacy bucket configurations.

## 4. Workflows
- **Changes**: When adding new "Enterprise" features, update this document to reflect the new standard.
