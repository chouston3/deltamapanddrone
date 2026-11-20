# Sunflower Aerial website

Static HTML, CSS, and JavaScript for sunfloweraerial.com. No build step. Cloudflare Pages deploys `main` on every push, and every other branch gets its own preview address.

## Files

- `index.html`, `consultants.html`, `farmers.html`, `turf.html`: the customer pages. Cloudflare serves them at `/`, `/consultants`, `/farmers`, and `/turf`.
- `planner.html`, `planner.js`: the mission planner, a pilot's tool kept out of search.
- `404.html`: shown for any address that doesn't exist.
- `robots.txt`, `sitemap.xml`: for search engines. Add any new customer page to the sitemap.
- `style.css`, `main.js`: shared styles and the contact form script.

## Hosting notes

### Content Security Policy

A strict CSP is applied at the Cloudflare edge via a zone-level Transform Rule (Rules, then Overview, then Response Header Transform Rules, "Security Headers (CSP, X-Frame-Options)"). The policy lives in the Cloudflare dashboard, **not** in this repo, so it is not under version control.

The current CSP allowlists `https://api.web3forms.com` in two directives so the contact form can submit:

- `connect-src 'self' https://api.web3forms.com`: lets main.js `fetch()` the Web3Forms endpoint.
- `form-action 'self' https://api.web3forms.com`: lets the form post there as a fallback if JS is disabled.

If this site is ever migrated to a new Cloudflare zone, rebuilt from scratch, or scored against Mozilla Observatory and you wonder why the form is broken, the Transform Rule is the first place to check.

### pages.dev redirect

The project's `*.pages.dev` address is sent to sunfloweraerial.com by a Bulk Redirect in the Cloudflare dashboard, not by a file in this repo.

### Contact form

The contact form is wired to [Web3Forms](https://web3forms.com). The access key is a hidden input in `consultants.html` and `farmers.html`; rotating the key means editing both inputs and redeploying. Submissions are emailed to the address configured in the Web3Forms dashboard.
