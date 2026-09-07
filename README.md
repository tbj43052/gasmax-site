# GASMAX Pit Stop

Website for $GASMAX at https://gasmax.fun

## Layout
- `site/`            the live site. Cloudflare Pages serves this folder as-is (no build step).
- `index.html`       the artifact/preview version of the page with the 3D model embedded inline.
- `assets/`          the slim car + pump model used by both versions (the 24 MB original is not committed).
- `tools/`           browser tools that decode, simplify and re-export the model.
- `3d-source/`       the procedural Three.js scene the project started from.

## Cloudflare Pages settings
- Framework preset: None
- Build command: (leave empty)
- Build output directory: site
- Root directory: (leave empty)

## Updating the live site
Edit `site/index.html` (or rebuild it from `index.html` with `tools`), commit, push to `main`.
Cloudflare Pages redeploys automatically on every push.
