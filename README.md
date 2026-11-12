<p align="center">
  <img src="icons/icon-192.png" width="96" height="96" alt="GotSpotKe app icon">
</p>

<h1 align="center">GotSpotKe</h1>

<p align="center">
  <b>GotSpotKe? Got lah!</b><br>
  Know if there's parking at your MRT station <i>before</i> you leave the house.
</p>

<p align="center">
  <a href="https://gotspotke.vercel.app/"><b>Open GotSpotKe →</b></a>
</p>

---

## Introducing GotSpotKe

It's 7:45 AM. You drive to the MRT station, circle the Park & Ride, and the barrier says **FULL**. Now you're late, and still looking for a spot.

**GotSpotKe fixes that.** It shows how many Park & Ride spots are left at every Klang Valley MRT station, so you can check from home and pick a station that still has space.

No download from an app store, no sign-up. Open the link, save your station, and go.

## What you can do

### 🅿️ See spots left at a glance
Every station shows a big, clear number of **spots left**, with a colour status:
**Available**, **Few left** or **Full**. Prefer percentages? Switch in Settings.

### ⭐ Save your stations
Tap the bookmark next to the station you park at. It moves to the top of Home, with a one-line summary like *"All 2 of your stations have space right now."*

### 🔔 Get an alert before it fills up
Set an alert, such as *"tell me when fewer than 20 spots are left"*, and GotSpotKe warns you as your car park runs low. Turn on **Morning check** to get an update at 7:00 AM on weekdays.

### 🕗 Know when it usually fills
Each station has a chart of a normal weekday showing **when it usually becomes full**, plus a tip like *"Get there before 7:50 AM to be safe."*

### 🚇 Browse by line
See all **32 stations with Park & Ride** on the **Kajang Line** and **Putrajaya Line**, in order along each line.

### 💳 Fees and payment, upfront
Each station page tells you what you'll pay (for example *RM4.30 per entry if you ride the MRT with the same card*) and how to pay, with a **Navigate** button to get you there.

### 🌙 Made for real life
- **English and Bahasa Melayu**
- **Dark mode** for early mornings and late nights
- **Add to Home Screen** and it opens full screen like a normal app
- Works **offline** after your first visit

## Get it on your phone

1. Open **https://qianyi-11.github.io/GotSpotKe/** on your phone.
2. **Android (Chrome):** tap the menu (⋮), then **Add to Home Screen**.<br>
   **iPhone (Safari):** tap **Share**, then **Add to Home Screen**.
3. Open GotSpotKe from your home screen and save your station.

## How we count the spots

Every car scans a card at the barrier.
**Scan in:** one spot gone. **Scan out:** one spot back.

> **Spots left = total bays − cars inside**

The count resets each night when the car park is empty, so small errors don't build up.

| Status | When |
|---|---|
| **Available** | More than 30 spots left |
| **Few left** | 30 or fewer left (10 or fewer for car parks under 100 bays) |
| **Full** | No spots left |

## Where we are now

GotSpotKe is a **prototype**. Station names and bay totals are real, taken from MRT Corp's Park 'N' Ride pages and public station info (checked November 2026). **The numbers of cars inside, and the "usually full by" times, are sample data for now.** The app says so on every screen. Connecting live barrier data is the next step.

Have feedback or want to help bring live data in? [Open an issue](https://github.com/qianyi-11/GotSpotKe/issues).

---

## For developers and demos

Built with plain HTML, CSS and JavaScript: no build step, no dependencies.

### Run it

- **On this computer:** double-click `index.html`.
- **Local server:** run `python -m http.server 8000` in this folder, then open `http://localhost:8000` (or `http://<your-computer-IP>:8000` from a phone on the same Wi-Fi).
- **Publish:** push to GitHub and turn on Pages (Settings → Pages → deploy from `main`), or drag the folder onto https://app.netlify.com/drop.

### Demo mode

- Add `?demo` to the address to show **Demo tools** in **Me**:
  - **Open barrier simulator** (`simulator.html`): press *Car enters* or *Morning rush* to change a car park's count (same browser, same device only).
  - **Reset demo data**: puts every number back to the start.
- **Alert demo:** Kwasa Damansara has an alert at 20 spots. Open the simulator in another tab, pick Kwasa Damansara, press *Morning rush*, then go back to the app: the count drops and an alert pops up.
- **Demo clock:** `mockTime` in `js/data.js` sets the time of day (for example `'08:15'` for the morning rush, or `null` for the real clock).
- Before a real launch, delete `simulator.html`, `js/simulator.js` and the Demo tools section.

### What's inside

| File | What it does |
|---|---|
| `index.html` | The app (Home, Lines, Alerts, Me, station page) |
| `simulator.html` | Demo-only barrier simulator |
| `css/styles.css` | All styling, light and dark mode |
| `js/data.js` | The 32 stations, bay counts, fees and "usually full by" times |
| `js/i18n.js` | All text in English and Bahasa Melayu |
| `js/engine.js` | Counting logic, status rules, saved settings |
| `js/app.js` | Screens and buttons |
| `js/simulator.js` | Simulator logic |
| `manifest.webmanifest`, `sw.js`, `icons/` | Add to Home Screen and offline support |

### Data notes

- 14 Kajang Line and 18 Putrajaya Line stations (Kwasa Damansara serves both lines).
- **Kampung Batu:** bay count not confirmed; 200 is an estimate.
- `fullBy` in `js/data.js` is in minutes after midnight (470 = 7:50 AM).

### Updating the live site

After changing any file, bump `VERSION` in `sw.js` (for example `gsk-v2`) so phones load the new version.
