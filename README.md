# The North Pole Express

A calm, full-screen Christmas countdown built with Vite, TypeScript, GSAP, and CSS. It is designed for an unattended Raspberry Pi display and adapts to desktop, iPad, and iPhone screens.

## Develop

```sh
vp install
vp dev
```

The Vite base path is `/christmas/`, so the local URL is normally shown as `http://localhost:5173/christmas/`.

## Validate and build

```sh
vp check
vp test
vp build
```

The static production files are written to `dist/`. Deploy that directory so it is served from `https://snally.com/christmas/`.

The tests cover Christmas Eve, Christmas Day, December 26–31, New Year's Day, and calendar-day changes across daylight-saving boundaries. The browser also recalculates at local midnight, every 30 minutes as a safety check, and whenever the page becomes visible again.

## Raspberry Pi kiosk mode

Install Chromium, then launch it after the desktop session starts:

```sh
chromium --kiosk --noerrdialogs --disable-infobars --disable-session-crashed-bubble https://snally.com/christmas/
```

On Raspberry Pi OS versions where the executable is named `chromium-browser`, use that name instead. Add the command to the desktop session's autostart configuration for unattended startup. Disable screen blanking in Raspberry Pi Configuration (Display → Screen Blanking) so the display remains on.

The page needs no API connection after its static files load. If Chromium or the Pi resumes after sleep, the visibility handler immediately refreshes the date.

## iPad and iPhone

Open the deployed URL in Safari and choose **Share → Add to Home Screen** for a full-screen display. Safe-area padding is included for notches and rounded screen corners.
