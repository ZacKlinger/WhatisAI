# Public launch and free Google sign-in

The app remains a static Astro site on GitHub Pages. Visitors can browse, use
interactives, and share public lesson links without signing in. Google sign-in
creates an account on first use; Firebase handles credentials and sessions.
No separate password database, paid server, Google Drive scope, or Gmail scope is needed.

## 1. Create the free project

1. Open [Firebase Console](https://console.firebase.google.com/) → **Create a project**.
   Choose a project name, keep the **Spark** plan, and leave Google Analytics off.
   Do not link a billing account or upgrade to Blaze.
2. **Project settings → General → Your apps → Web (</>)**: register WhatisAI.
   Firebase Hosting is not needed; the site stays on GitHub Pages.
3. Copy the web app's `apiKey`, `authDomain`, `projectId`, and `appId` into the
   matching variables in `.env` (start from `.env.example`). These are public
   browser configuration values. Never use service-account keys, private keys,
   OAuth client secrets, or Admin SDK credentials in a `PUBLIC_` variable.

## 2. Enable Google login

1. **Build → Authentication → Get started → Sign-in method → Google**: enable it,
   choose the user-facing app name and support email, and save.
2. **Authentication → Settings → Authorized domains**: add `zacklinger.github.io`
   (a hostname, without `/WhatisAI`). Add `localhost` for development and any
   custom hostname you actually use. New projects may not authorize localhost by default.
3. Check **Google Cloud Console → Google Auth Platform → Audience**. For a public
   launch, the OAuth audience must allow external users and the app must be in
   production, rather than restricted to test users or an organization. Complete
   Google's consent-screen requirements with the real app and privacy URLs.
4. Login uses a user-triggered popup. Users must allow that popup. Errors appear
   on the account page with a guest option; blocked popups never fake a session.

## 3. Enable private cloud saves

1. **Build → Firestore Database → Create database**: choose the standard database,
   a suitable location, and **Production mode**. Do not enable test-mode access.
2. In **Rules**, publish the exact contents of the root `firestore.rules` file.
   Only the authenticated UID can read, write, or delete `/progress/{uid}`.
   Collection listing and every other path are denied. Each save is size limited.
3. Exempt the `json` field in the `progress` collection group from indexing using
   **Indexes → Single field**. Alternatively, after selecting the correct project,
   deploy both supplied rules and index configuration with the Firebase CLI:

   ```sh
   firebase deploy --only firestore:rules,firestore:indexes --project YOUR_PROJECT_ID
   ```

The app saves progress on the device automatically. Cloud saves are explicit:
**Your account → Save to account**, then **Restore from account** on another
device. The most recent cloud save replaces the previous one. Restore replaces
local account progress after confirmation; it does not merge concurrent device edits.
Guest progress is separate and is copied only when the learner chooses to do so.
Signing out clears the account's local cache; save to the cloud or export first.
Deleting the account reauthenticates with Google, deletes the cloud save, then
deletes the Firebase Auth user. A partial failure is reported so the user can retry.

## 4. Configure the public build

In GitHub **Settings → Secrets and variables → Actions → Variables**, add the
four `PUBLIC_FIREBASE_*` values from `.env.example`. The Pages deployment workflow
passes them to the build. Local `.env` values do not configure GitHub Actions.
No configuration means the site builds with guest access and a visible
“sign-in is coming soon” state. Changing variables requires a new build.

The default public URL is `https://zacklinger.github.io/WhatisAI/`. For a custom
domain, set `SITE_URL` and `SITE_BASE=/` in the build environment, configure Pages
DNS/HTTPS, and add the hostname to Firebase authorized domains. Canonical URLs,
social previews, links, and the sitemap all follow these build values.

## 5. Verify before launch

```sh
npm ci
npm test
npm run check
npm run validate
npm run build
npm run test:ui
```

For database access-control tests (requires Java 21+ and the Firebase CLI):

```sh
firebase emulators:exec --only firestore --project demo-whatisai 'npm run test:rules'
```

Then verify against the actual configured project with two test Google accounts:

- Sign in, refresh, sign out, and sign in as another user. The second user must
  not see the first user's progress. Check a second open tab too.
- Save as user A and restore on another browser as A. User B must receive no A data.
- Verify canceled/blocked popups, expired sessions, offline saves, and quota errors.
- Export before signing out. Restore/copy/reset/delete all explain what they replace.
- Delete the test account and verify both its Auth entry and progress document disappear.
- Share a lesson on mobile and desktop. Confirm the URL opens without a login.
- Check the public social preview, keyboard navigation, and small-screen navigation.

## Costs and scope

Stay on Spark without a billing account. Spark provides limited no-cost usage;
when quotas are exhausted, cloud operations may fail rather than automatically
purchase capacity. Local learning and exports remain available. No Cloud
Functions, paid SMS login, analytics, storage bucket, or paid API is used.
Firebase setup, rules publication, live OAuth, and deployment require the owner's
project configuration and are not completed merely by building this repository.

Official references: [Google sign-in](https://firebase.google.com/docs/auth/web/google-signin),
[Spark and Blaze](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans),
[Firestore quotas](https://firebase.google.com/docs/firestore/quotas), and
[security rules](https://firebase.google.com/docs/firestore/security/get-started).
