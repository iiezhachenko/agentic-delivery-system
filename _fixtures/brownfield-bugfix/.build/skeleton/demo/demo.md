# Demo — Sign in to your time-tracking app

This is the first working increment of your app, running on our staging environment. It is the foundation: it proves the app is live and you can sign in — everything else gets built on top of this. Watch it run, then tell us if it's what you wanted.

## Watch it run

1. **Open the app in your browser.** You land on the app's home page with a "Sign in with Google" button — it loads in a normal browser, nothing to install. *(This is your app being live on the web.)*

2. **Click "Sign in with Google".** You are sent to Google's sign-in page. You sign in with your Google account, and you land back in your app — already signed in, no password to create or remember. *(This is signing in to your account.)*

3. **If something goes wrong** (say the database is briefly unavailable when the sign-in is completing), the app sends you back to the sign-in page with a notice instead of breaking or leaving you in a broken half-signed-in state. *(This is the app failing safely.)*

## What this proves

- **Your app is live and reachable in a browser** — no app-store install required. *(Promise: AC1)*
- **You can sign in with your Google account and arrive signed in** — no password needed. *(Promise: AC5)*

Both were verified running on staging, including with sign-in details not shown to the build beforehand — so it is the real thing working, not a canned screenshot.

## Is this what you wanted?

Reply with the letter that fits:

- **A.** Yes — this is what I wanted. Go ahead and build the next piece. *(recommended)*
- **B.** Not quite — here's what's off: *tell us in your own words.*

*This is the staging build — what we'll keep building on. It is not yet released to production; that is a separate step outside this delivery.*
