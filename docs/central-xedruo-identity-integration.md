# Central Xedruo Identity integration

Company slug: `hireuo`.

`src/lib/xedruo-identity.ts` provides the typed central identity bridge. Hireuo currently has its own Supabase client configuration and a shared-account landing page; do not assume its Supabase project accepts central identity RPCs. Configure a dedicated central Xedruo auth client and app-origin OAuth callback, then wire the in-app country/phone onboarding step. Preserve Hireuo's applicant, recruiter and staff records; do not merge by email.

SMS OTP remains deferred and phone numbers remain unverified until that later stage.
