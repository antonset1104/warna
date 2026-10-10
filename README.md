# Warna Terukur

An original Indonesian and English color literacy site for Vijeron, with a WCAG 2.2 solid-pair contrast calculator and a mathematical five-color variation tool. The variation tool is not an accessibility verdict or a claim of perceptual harmony.

## Build and check

Requires Python 3.10+; no package installation.

```sh
python build.py
python check.py
node --check assets/tools.js
```

Cloudflare Pages serves the committed `dist/` directory from the `main` branch with no build command. Custom domain: `warna.vijeron.com`.

Source explanations cite W3C WCAG 2.2 and CSS Color 4. The explanatory text and tool implementation are original to Vijeron. GA4 uses `G-79X7K7H4MJ`, and the AdSense publisher is `ca-pub-6180580801533680`; consent defaults to denied pending Google Funding Choices.
