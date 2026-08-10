// Receives PayPal IPN notifications for "Get Featured" payments, verifies them with PayPal,
// and marks the paid tool as featured in index.html by committing directly to GitHub.
// Render auto-deploys the static site on that commit, so no other step is required.
//
// Required environment variables (set in the Render Web Service, never committed):
//   GITHUB_TOKEN        Fine-grained PAT scoped to this repo, Contents: Read and write
//   GITHUB_REPO         e.g. "Yohannaaaaa/Create-repository"
//   GITHUB_BRANCH       e.g. "main" (optional, defaults to "main")
//   GITHUB_FILE_PATH    e.g. "index.html" (optional, defaults to "index.html")

const express = require('express');
const app = express();

app.use(express.urlencoded({ extended: false }));

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO || 'Yohannaaaaa/Create-repository';
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';
const GITHUB_FILE_PATH = process.env.GITHUB_FILE_PATH || 'index.html';

app.get('/', (req, res) => {
  res.send('AI Finder Featured webhook is running.');
});

app.post('/paypal-ipn', async (req, res) => {
  // PayPal only needs a fast 200 OK; do the real work after responding.
  res.sendStatus(200);

  try {
    if (!GITHUB_TOKEN) {
      console.error('GITHUB_TOKEN is not set — cannot update the catalog.');
      return;
    }

    const verified = await verifyWithPaypal(req.body);
    if (!verified) {
      console.log('IPN verification failed, ignoring.');
      return;
    }

    const paymentStatus = req.body.payment_status;
    const toolName = (req.body.custom || '').trim();
    const payerEmail = req.body.payer_email;
    const itemName = req.body.item_name;
    const amount = req.body.mc_gross;

    console.log('Verified IPN:', { paymentStatus, toolName, payerEmail, itemName, amount });

    if (paymentStatus !== 'Completed') {
      console.log(`Payment status "${paymentStatus}" is not Completed, skipping.`);
      return;
    }
    if (!toolName) {
      console.log('No tool name in the "custom" field, skipping.');
      return;
    }

    await markToolFeatured(toolName);
  } catch (err) {
    console.error('Error handling IPN:', err);
  }
});

async function verifyWithPaypal(body) {
  const verifyBody = 'cmd=_notify-validate&' + new URLSearchParams(body).toString();
  const res = await fetch('https://ipnpb.paypal.com/cgi-bin/webscr', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: verifyBody,
  });
  const text = await res.text();
  return text.trim() === 'VERIFIED';
}

async function markToolFeatured(toolName) {
  const getUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}?ref=${GITHUB_BRANCH}`;
  const getRes = await fetch(getUrl, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
    },
  });
  if (!getRes.ok) {
    throw new Error(`GitHub GET failed: ${getRes.status} ${await getRes.text()}`);
  }
  const file = await getRes.json();
  const content = Buffer.from(file.content, 'base64').toString('utf-8');

  // Matches a TOOLS entry by its exact "name" field and flips its "featured" field to true.
  // Depends on the current field order in index.html (name, ..., featured) — update this
  // regex if that entry shape ever changes.
  const escapedName = toolName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`(\\{id:"[^"]+", name:"${escapedName}"[^}]*?featured:)false`);

  if (!pattern.test(content)) {
    console.log(`Tool "${toolName}" not found (or already featured) — skipping automatic update.`);
    return;
  }

  const updated = content.replace(pattern, '$1true');

  const putRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `Mark "${toolName}" as Featured (automated via PayPal IPN)`,
      content: Buffer.from(updated, 'utf-8').toString('base64'),
      sha: file.sha,
      branch: GITHUB_BRANCH,
    }),
  });

  if (!putRes.ok) {
    throw new Error(`GitHub PUT failed: ${putRes.status} ${await putRes.text()}`);
  }

  console.log(`"${toolName}" is now featured — commit pushed, Render will auto-deploy.`);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Featured webhook listening on port ${PORT}`));
