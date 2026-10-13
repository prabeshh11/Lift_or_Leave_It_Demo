# Lift or Leave It

**Manual Handling Training Simulator** -- a fully front-end, browser-based training game that teaches safe lifting techniques in a 3D warehouse environment.

Players walk through a warehouse, inspect packages, and choose the correct handling method (Solo Lift, Team Lift, or Use Trolley). Choices are scored for safety and efficiency, with a final debrief that explains what went right or wrong.

---

## Requirements

- A modern desktop browser with WebGL support (Chrome, Firefox, Edge, or Safari recommended)
- Internet connection (for Google Fonts and the A-Frame CDN on first load)
- No build tools, Node.js, or backend required. Pure HTML, CSS, and JavaScript

---

## How to Run

Because the game is entirely static, you can run it in two ways.

### Option 1 — Local HTTP server (recommended)

Serving over `http://` avoids occasional browser restrictions that can appear when opening files directly via `file://` (especially with WebGL / A-Frame and `sessionStorage`).

**Using Python 3** (usually pre-installed):

```bash
cd lift-or-leave-it
python -m http.server 8000
```

Then open:

```
http://localhost:8000
```


### Option 2 — Open the HTML file directly

1. Unzip the project (if you haven’t already).
2. Double-click `index.html`  
   **or** right-click → Open with → your preferred browser.

This often works, but if the 3D scene fails to load or session data does not persist between pages, switch to Option 1.

---

## Game Flow

| Page              | Purpose                                      |
|-------------------|----------------------------------------------|
| `index.html`      | Title / main menu                            |
| `how-to-play.html`| Controls, rules, and scoring explanation     |
| `game.html`       | Main 3D warehouse simulation (A-Frame)       |
| `debrief.html`    | Score summary and feedback after the session |

Start at the main menu → How to Play → Start Game.  
After completing (or timing out) the session you are taken to the debrief screen.

---

## Controls (in-game)

| Input              | Action                                      |
|--------------------|---------------------------------------------|
| **W A S D**        | Walk                                        |
| **Mouse**          | Look around (click canvas to lock pointer)  |
| **Space**          | Jump                                        |
| **E**              | Inspect a nearby glowing package            |
| **Help button (i)**| Open in-game help panel                     |

When you press **E** near a package the inspect panel opens, the mouse is released, and you choose one of three techniques:

- **Solo Lift**
- **Team Lift**
- **Use Trolley**

An animation plays, feedback is given, and you continue to the remaining packages.

---

## Scoring Overview

- **Optimal technique** → +10  
- **Sub-optimal technique** → +5  
- **Dangerous technique** → 0  

Time remaining at the end of the session also awards a bonus, and a perfect “no injury risk” run grants an extra +20.  
A total of **60+** is considered a pass. Full details are shown on the How to Play and Debrief screens.

---

## Project Structure

```
lift-or-leave-it/
├── index.html              # Main menu / title screen
├── how-to-play.html        # Instructions & scoring table
├── game.html               # 3D warehouse (A-Frame scene)
├── debrief.html            # Post-session results
├── assets/
│   └── warehouse-bg.jpg    # Background image
├── css/
│   ├── main.css
│   ├── hud.css
│   ├── inspect.css
│   ├── animation.css
│   ├── start.css
│   ├── htp.css
│   └── debrief.css
└── js/
    ├── data.js             # Package pool & session package builder
    ├── session.js          # sessionStorage wrapper
    ├── timer.js
    ├── scoring.js
    ├── warehouse.js        # 3D scene logic
    ├── inspect.js          # Inspect panel & technique choice
    ├── animation.js
    └── debrief.js
```

---

## External Dependencies (CDN)

- **A-Frame 1.4.0** - 3D / WebXR framework used by `game.html`
- **Google Fonts** - Bebas Neue, Rajdhani, Barlow

These are loaded from the public internet. Once cached, the game can run offline for subsequent sessions (as long as the browser still has the cached resources).

---

## Notes & Tips

- The game uses `sessionStorage` to keep score and package choices between pages. Closing the browser tab ends the current session.
- Best experienced in a **desktop browser** with a keyboard and mouse. Mobile / touch support is limited.
- If the 3D view appears black or frozen, ensure WebGL is enabled and try a different browser or the local-server method above.
- All game logic is client-side. No data is sent to any server.

---

Enjoy the training!
