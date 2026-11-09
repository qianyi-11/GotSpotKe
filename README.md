# GotSpotKe

**GotSpotKe? Got lah!** A mobile web app that shows how many Park & Ride spots are free at Klang Valley MRT stations, so you know before you drive.

Prototype for competition. Built with plain HTML, CSS and JavaScript: no install, no build step.

## Open it

**On this computer:** double-click `index.html`. It opens in your browser.

**On a phone (recommended for the demo):** the app needs to be on a web address. Pick one:

1. **Netlify Drop (easiest, free):** go to https://app.netlify.com/drop and drag the whole `GotSpotKe` folder onto the page. You get a link like `https://something.netlify.app` to open on any phone.
2. **GitHub Pages:** push this folder to a GitHub repo, then Settings → Pages → deploy from the main branch.
3. **Same Wi-Fi, quick test:** in this folder run `python -m http.server 8000`, then on the phone open `http://<your-computer-IP>:8000`.

On the phone, use the browser menu → **Add to Home Screen**. GotSpotKe then opens full screen like a normal app.

## Demo for the judges

All numbers are **fixed sample data** (mock), not live. The app says so itself ("Sample data" on Home, "Sample data · not live yet" on each station). Connecting real barrier data is the next phase.

- **"Usually full by" chart:** the blue bar marks the hour each station usually becomes full (set per station in `js/data.js`, the `fullBy` column, in minutes after midnight: 470 = 7:50 AM).

- **Demo clock:** the app uses 9:00 PM as the time of day for the greeting and alert times. Change `mockTime` in `js/data.js` (for example to `'08:15'` for a morning-rush story, or `null` for the real clock).
- **Demo tools are hidden from normal users.** Add `?demo` to the address to show them in **Me**, for example `https://yourname.github.io/GotSpotKe/?demo`. They contain:
  - **Open barrier simulator** (`simulator.html`): press *Car enters* / *Morning rush* to change a car park's count. It only affects the same browser on the same device.
  - **Reset demo data**: puts every number back to the start.
- **Alert demo:** Kwasa Damansara has an alert at 20 spots. Open the simulator in another tab, pick Kwasa Damansara, press *Morning rush*, then go back to the app tab: the count drops and an alert pops up.
- Before the real launch, delete `simulator.html`, `js/simulator.js` and the Demo tools section.

## What's inside

| File | What it does |
|---|---|
| `index.html` | The app (Home, Lines, Alerts, Me, station page) |
| `simulator.html` | Demo-only barrier simulator (link shown only with `?demo`) |
| `css/styles.css` | All styling, light and dark mode |
| `js/data.js` | The 32 MRT stations with Park & Ride and their bay counts |
| `js/i18n.js` | All text in English and Bahasa Melayu (Malaysia) |
| `js/engine.js` | Counting logic, status rules, saved settings |
| `js/app.js` | Screens and buttons |
| `js/simulator.js` | Simulator logic |
| `manifest.webmanifest`, `sw.js`, `icons/` | Add-to-Home-Screen and offline support |

## How the count works

`Spots left = total bays − cars inside`. A card scan in at the barrier adds a car; a scan out removes one.

Status rule:
- **Full**: 0 free
- **Few left**: 30 or fewer free (10 or fewer for car parks under 100 bays)
- **Available**: everything else

## Data

- 14 Kajang Line and 18 Putrajaya Line stations with Park & Ride (Kwasa Damansara serves both lines).
- Bay totals come from MRT Corp's Park 'N' Ride pages (https://sites.google.com/view/mrtparknride/home) and public station info, checked November 2026.
- **Sample data:** how full each car park is, and "usually full by" times, are made up for the demo.
- **Kampung Batu:** bay count not confirmed; 200 is an estimate.
- To change a station, edit `js/data.js`.

## Changing things later

- Edit text in `js/i18n.js` (both languages).
- After changing any file on a live site, bump `VERSION` in `sw.js` (e.g. `gsk-v2`) so phones load the new version.
