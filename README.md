# Aidan Burrowes · personal site

A scroll-driven 3D portfolio. Plain HTML, CSS, and JS, with Three.js vendored locally. **No build step.**

## Run it

Modules need a server (they won't load from `file://`):

```bash
python3 dev-server.py 4175 .      # a no-cache static server
# open http://localhost:4175
```

Handy URL switches: `?mode=dark` / `?mode=light`, `?q=low` (start at low render quality), `?static=1` (no loader or reveal animations, for screenshots).

## Adding things (no code needed)

| To add…                | Edit                      |
| ---------------------- | ------------------------- |
| a news item            | `data/news.json` (or run the helper below) |
| a publication          | `data/publications.json`  |
| a job, project, award… | `index.html` (find the section; copy a `<li>`) |
| a new skill            | `index.html` → `skills`, plus an SVG in `assets/icons/` |

### News (the separate `news.html` page)

```bash
node scripts/add-news.mjs "Started as a Software Engineer at Bloomberg." --letters B --date 2026-08
node scripts/add-news.mjs "New paper out." --date 2026-11 --link https://doi.org/... --thumb assets/thumbs/my-paper.jpg
node scripts/add-news.mjs "Joined Roblox." --icon roblox
```

Or edit `data/news.json` by hand. Each item:

```json
{ "date": "2026-08", "text": "What happened.", "link": "https://…", "thumb": "assets/thumbs/x.jpg", "icon": "roblox", "letters": "B" }
```

`date` is `YYYY`, `YYYY-MM`, or `YYYY-MM-DD`. `link` is optional. Give each item **one** tile: `thumb` (an image), `icon` (an SVG name from `assets/icons/`, or `microsoft`), or `letters`. Items sort newest first automatically.

### Publications (the `publications` section, with thumbnails)

Add an object to `data/publications.json`:

```json
{ "year": "2026", "title": "Paper title", "role": "Coauthor", "venue": "Journal name", "link": "https://doi.org/…", "thumb": "assets/thumbs/paper.jpg" }
```

`thumb` and `link` are optional. Put thumbnails in `assets/thumbs/` (about 640px wide is plenty).

## How the 3D works

Each section has its own shape, and the background changes color as you scroll (light mode: one pastel per section; dark mode: near-black with a colored glow). The nth `<section>` in `index.html` uses the nth shape in `entries` and the nth color in `PAL`/`GLOW` (`main.js`).

| Section        | Shape                                    | File                 |
| -------------- | ---------------------------------------- | -------------------- |
| hello, contact | Umbreon-style ring (+ crescent moon)     | `main.js`            |
| about          | soccer ball                              | `shapes/soccer.js`   |
| experience     | Rocket League Octane                     | `shapes/car.js`      |
| skills         | Poké ball                                | `shapes/pokeball.js` |
| research       | Fullmetal Alchemist transmutation circle | `shapes/alchemy.js`  |
| publications   | Gator                                    | `shapes/gator.js`    |
| projects       | açaí bowl (toppings = projects)          | `shapes/acai.js`     |
| achievements   | Survivor immunity idol (jade + beads)    | `shapes/idol.js`     |
| news page      | Eevee evolution stones                   | `shapes/stones.js`   |

Shapes follow `shapes/CONTRACT.md`. To preview one in isolation, open `lab.html?shape=car` (4 angles; see `shapes/LAB.md`).

Skills are ranked by how many repos, roles, and research items each appears in; the most-used ones are highlighted and listed first.

## Hosting

This repo **is** the live site: https://aidanburrowes.github.io (GitHub Pages, serving the `main` branch from the repo root; `.nojekyll` tells Pages to serve files as-is). Push to `main` and the site updates in about a minute.

To change something: edit locally, preview with `python3 dev-server.py 4175 .`, then `git add -A && git commit -m "..." && git push`.

The previous al-folio (Jekyll) version of the site is archived, untouched, in [`aidanburrowes/old-website`](https://github.com/aidanburrowes/old-website).

## Credits

Fan-made. Pokémon, Rocket League, Fullmetal Alchemist, and Survivor belong to their owners; every shape is an original low-poly drawing and no official art is used. Brand icons: [Simple Icons](https://simpleicons.org) (CC0), [Devicon](https://devicon.dev) (MIT), [Lucide](https://lucide.dev) (ISC). Company logos are trademarks of their owners.
