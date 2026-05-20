# deltamapanddrone

Marketing site for Delta Map and Drone LLC. Static HTML/CSS/JS, hosted on Cloudflare Pages, auto-deploys from `main`.

## Hosting notes

### Content Security Policy

A strict CSP is applied at the Cloudflare edge via a zone-level Transform Rule (Rules → Overview → Response Header Transform Rules → "Security Headers (CSP, X-Frame-Options)"). The policy lives in the Cloudflare dashboard, **not** in this repo, so it is not under version control.

The current CSP allowlists `https://api.web3forms.com` in two directives so the contact form can submit:

- `connect-src 'self' https://api.web3forms.com` — lets main.js `fetch()` the Web3Forms endpoint.
- `form-action 'self' https://api.web3forms.com` — lets the form post there as a fallback if JS is disabled.

If this site is ever migrated to a new Cloudflare zone, rebuilt from scratch, or scored against Mozilla Observatory and you wonder why the form is broken, the Transform Rule is the first place to check.

### Contact form

The contact form is wired to [Web3Forms](https://web3forms.com). The access key is embedded in `index.html` as a hidden input; rotating the key means editing that input and redeploying. Submissions are emailed to the address configured in the Web3Forms dashboard.
