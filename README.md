# Payday AJ — Personal Brand & Booking Site

Concept build of a personal-brand + booking site for Dallas artist **Payday AJ** ([@ajpaydaynosleep](https://www.instagram.com/ajpaydaynosleep/)).

**Live:** https://xbased420.github.io/Payday-Aj-Personal-Brand-Booking-Site/

---

## Turn on the live link (2 minutes)

1. Go to the repo → **Settings** → **Pages** (left sidebar).
2. Under **Source**, pick **Deploy from a branch**.
3. Branch: `main`, folder: `/ (root)`. Hit **Save**.
4. Wait ~1 minute, refresh. The URL appears at the top of that page.

> **If the repo is private**, GitHub Pages won't publish on a free account — either flip the repo to **Public** (Settings → General → bottom → Change visibility), or drag `standalone.html` onto [netlify.com/drop](https://app.netlify.com/drop) for a free instant link.

---

## What's in here

| File | What it is |
|---|---|
| `index.html` | The site. Everything in one file — HTML, CSS, and the bit of JS for the form. Images load from `assets/`. |
| `assets/` | All photos, video stills, and artwork. |
| `standalone.html` | The same site with every image baked into the file. No folder needed — email it, open it offline, or drop it on Netlify by itself. |
| `.nojekyll` | Tells GitHub Pages to serve the files as-is. Leave it. |

Only two fonts load from the network (Google Fonts). Everything else is local.

---

## Before this goes to a real client

Search `index.html` for `[ADD` — every unknown is a bracketed placeholder:

- `[ADD BOOKING EMAIL]`
- `[ADD FEATURE RATE / EMAIL]`
- `[ADD PRESS CONTACT]`
- `[ADD MANAGER, IF ANY]`
- `[ADD YOUR EMAIL / PHONE]` — this one's yours, in the pitch section at the bottom.

Nothing on the page is invented. Every song title, credit, collaborator, and number came from the artist's public Instagram or his [HyperFollow page](https://distrokid.com/hyperfollow/paydayaj/biggest-payday-ever).

The booking form is a demo — it shows a confirmation and does nothing else. To make it real, point it at [Formspree](https://formspree.io) or [Netlify Forms](https://docs.netlify.com/forms/setup/) (both have free tiers) — it's one attribute on the `<form>` tag.

---

## Design notes

The palette comes from the album cover — the Texas Powerball ticket on *BIGGEST PAYDAY EVER*:

| Token | Hex | Role |
|---|---|---|
| `--ink` | `#0A0C09` | Ground (green-biased black) |
| `--green` | `#27A24E` | Money green — primary accent |
| `--gold` | `#E0A22B` | Foil gold — headlines, CTAs |
| `--red` | `#C8342B` | Ticket-print red — used sparingly |
| `--paper` | `#EDE7D8` | Newsprint, for the light section |

Type: **Archivo Black** (display) / **Archivo** (body) / **Space Mono** (data, labels, ticket numbers).

Structure follows the ticket: perforated stub dividers between sections, bet-slip grid texture behind the hero, monospace numerals wherever there's data. All the tokens live in `:root` at the top of the stylesheet — change five hex values and the whole site re-skins.

---

## Status

This is an **unofficial concept mockup**. It is not affiliated with or endorsed by Payday AJ. The photos, artwork, song titles, and credits belong to the artist and are used here only to show a proposed design. The page says so in the ribbon at the top and in the footer.
