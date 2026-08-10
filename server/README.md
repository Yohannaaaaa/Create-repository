# AI Finder — Featured webhook

Automates "Get Featured" payments: when someone pays via PayPal, this service verifies
the payment and marks their tool as `featured:true` in `index.html` by committing directly
to GitHub. Render's existing auto-deploy on `main` then republishes the site — no manual step.

## How it works

1. The "Get Featured" form (in the main site) opens a PayPal checkout with the paid tool's
   name in the `custom` field.
2. When the payment completes, PayPal sends an IPN (Instant Payment Notification) POST to
   this service's `/paypal-ipn` endpoint.
3. This service re-verifies that POST with PayPal (to make sure it's real, not spoofed),
   then finds the matching tool by name in `index.html`'s `TOOLS` array and flips its
   `featured` field to `true`, committing the change via the GitHub API.
4. Render sees the new commit on `main` and redeploys the static site automatically.

**Known limitation:** this only works for tools *already in the catalog* — it matches by
exact name. It cannot safely auto-create a brand-new catalog entry from a payment alone.
It also doesn't automatically un-feature a tool after the 3-month plan expires; that's
still a manual follow-up for now.

## One-time setup (do this in order)

### 1. Create a GitHub token
GitHub → Settings → Developer settings → **Fine-grained personal access tokens** → Generate new token.
- Repository access: only `Yohannaaaaa/Create-repository`
- Permissions: **Contents → Read and write**
- Copy the token — you'll paste it into Render in step 3, not here.

### 2. Deploy this folder as a new Render Web Service
Render dashboard → **New → Web Service** → same GitHub repo (`Yohannaaaaa/Create-repository`).
- **Root Directory:** `server`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- Instance type: Free is fine (it only needs to wake up for occasional payments)

### 3. Set environment variables on that Web Service
Render → your new service → **Environment**:
- `GITHUB_TOKEN` = the token from step 1
- `GITHUB_REPO` = `Yohannaaaaa/Create-repository`
- `GITHUB_BRANCH` = `main`

Deploy. Once live, note the service's URL, e.g. `https://ai-finder-webhook.onrender.com`.

### 4. Point PayPal's IPN at it
Log into the PayPal account tied to the payout email (`k.svetlanaheves@gmail.com`) →
Account Settings → **Notifications** → Instant Payment Notifications → **Update**.
- Notification URL: `https://ai-finder-webhook.onrender.com/paypal-ipn`
- IPN messages: **On**

That's it — future "Get Featured" payments will automatically feature the paid tool.
