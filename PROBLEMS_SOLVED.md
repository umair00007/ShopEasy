# Problems Solved

Interview stories: **Problem → Cause → Fix → What I learned.**

## 1. `vite build` fails: "Cannot find native binding" (Rolldown)
- **Problem:** `npm run build` crashed with `Cannot find module '@rolldown/binding-darwin-arm64'`.
- **Cause:** Vite's bundler (Rolldown) ships a separate native binary per OS/CPU as an *optional dependency*. npm has a bug (npm/cli#4828) where a `package-lock.json` created on another machine can skip the binary for your platform.
- **Fix:** `rm -rf node_modules package-lock.json && npm install` so npm re-resolves the right binary for this Mac.
- **Learned:** Optional/native dependencies are platform-specific; when a lockfile and the machine disagree, regenerating it fixes it.


## 2. `localhost:5000` shows "Access denied, HTTP 403" on a Mac
- **Problem:** The frontend badge said "Request failed with status code 403" and opening the API in the browser gave 403.
- **Cause:** On macOS Monterey and later, **AirPlay Receiver** (Control Center) listens on port 5000 and answers with 403. Our Express app never received the request.
- **Fix:** Moved the API to port 5001 (`PORT` in `server/.env`, Vite proxy target). Alternative: turn off AirPlay Receiver in System Settings.
- **Learned:** A 403 with no `morgan` log line in the server terminal means another program owns the port. Check with `lsof -i :5000`.

## 3. Test script hung forever (stray `cat`)
- **Problem:** A shell script that set up Phase 2 never finished.
- **Cause:** A leftover line `cat > file` with no input: `cat` waited for keyboard input (stdin) and blocked everything after it.
- **Fix:** Removed the line. When a script hangs, find the last command that runs with no output; commands that read stdin wait silently.
- **Learned:** Hanging usually means "waiting for input", not "slow".

## 4. (Template for Phase 3) S3 `AccessDenied` / `CredentialsProviderError`
- Fill this in if it happens. Typical causes: wrong region, bucket name typo, IAM policy ARN missing `/*`, or keys not loaded because the server wasn't restarted after editing `.env`.

## 5. Razorpay errors showed only "Something went wrong"
- **Problem:** With wrong/fake Razorpay keys, `POST /api/orders/checkout` returned a useless generic 500.
- **Cause:** The Razorpay SDK rejects its promises with a plain object (`{ statusCode, error: { description } }`), **not** an `Error`. Our central error handler reads `err.message`, which didn't exist.
- **Fix:** Wrapped the SDK call in `try/catch` and re-threw `new ApiError(502, "Payment provider error: " + err.error.description)`.
- **Learned:** Third-party libraries don't always throw real `Error`s. Always test the failure path of an integration, not just the happy path.

## 6. Checkout input lost focus after every keystroke
- **Problem:** Typing in the address form dropped the cursor after each letter.
- **Cause:** I declared the `Field` component *inside* `Checkout`. A new function identity on each render makes React unmount and remount the input.
- **Fix:** Moved `Field` outside the parent component and passed values as props.
- **Learned:** Never define components inside other components.

## 7. My test script used `read P1 P2` and got a wrong value
- **Problem:** Cart tests showed 1 item instead of 2.
- **Cause:** `read A B <<< "x y z"` puts the *remainder* ("y z") into the last variable, so the second product id was invalid and silently dropped.
- **Fix:** Split with `cut`. (The server correctly ignored the junk id, which is the behaviour we wanted anyway.)

## 8. Chart showed orders on the wrong day
- **Problem (prevented):** Grouping orders by day in MongoDB used UTC, so an order placed at 11 pm Indian time counted as the *next* day.
- **Cause:** `$dateToString` defaults to UTC; India is UTC+5:30.
- **Fix:** Pass `timezone: 'Asia/Kolkata'` in the aggregation and build the 7 day labels in the same timezone. Days with zero orders are missing from aggregation output, so the server fills them with 0.
- **Learned:** Dates are stored in UTC; always decide the *display* timezone explicitly when bucketing by day.

## 9. Admin product table silently showed only 12 products
- **Problem:** The admin table said "12 products" although the store had 25.
- **Cause:** In Phase 4 `GET /api/products` got a default page size of 12. The admin table was written earlier, called the same endpoint once, and never asked for page 2+, so it dropped the rest without any error.
- **Fix:** The admin page now uses server-side pagination, category filter, search and a stock filter, like the shop page.
- **Learned:** When you add pagination to an API, find every existing caller of it. A silent default limit is a data-loss bug in the UI.
