# GASMAX Pit Stop - deploy folder for gasmax.fun

Everything in this folder is the live site. No build step. Upload it as-is.

## Files
- index.html          the site (loads assets/gasmax-lite.glb, falls back to the SVG scene)
- assets/gasmax-lite.glb   the 300k-triangle car + pump model (3.7 MB)
- og-image.png        social preview (1200x630) used by X, Telegram, Discord
- favicon.svg         tab icon
- _headers            cache + security headers (Cloudflare Pages and Netlify both read this)
- robots.txt          allow all crawlers

## Option A: Cloudflare Pages via GitHub (auto-deploys on every push)
1. Create an empty GitHub repo (for example gasmax-site) and push this folder: see the commands below.
2. Cloudflare dashboard -> Workers & Pages -> Create -> Pages -> Connect to Git -> pick the repo.
   Framework preset: None. Build command: (leave empty). Build output directory: / (root).
3. After the first deploy, open the project -> Custom domains -> Add gasmax.fun (and www.gasmax.fun).
4. DNS: if the domain uses Cloudflare nameservers, Cloudflare adds the records itself.
   If it stays at the registrar, add a CNAME for www to <project>.pages.dev, then move nameservers to
   Cloudflare so the apex gasmax.fun can be a flattened CNAME too.

## Option B: Netlify drag and drop (no GitHub)
1. app.netlify.com -> Add new site -> Deploy manually -> drop this folder.
2. Site settings -> Domain management -> Add custom domain -> gasmax.fun.
3. At the registrar: A record @ -> 75.2.60.5, CNAME www -> <site-name>.netlify.app. HTTPS is automatic.
   Re-drop the folder to publish changes.

## Push commands (Option A)
    git remote add origin https://github.com/<you>/gasmax-site.git
    git push -u origin main

## Before launch
- Replace the placeholder contract address (CA constant near the end of index.html).
- Fill the Buy, Docs, Telegram, Dexscreener and Contract links (search for data-todo).
- Remove the "Simulated preview" tags once real onchain data feeds the pit wall.
