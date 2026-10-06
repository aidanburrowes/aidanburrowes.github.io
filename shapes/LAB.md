# Seeing your shape (render loop)

You CAN look at your model. Do this after every meaningful change, and iterate until it is accurate.
Do NOT use the shared Browser pane tools; use headless Chrome from the shell as below.

Run everything from the project root. Pick YOUR port (given in your brief) so agents don't collide.

```bash
# 1) once: start a static server on your port (kill it when you finish: kill $(cat /tmp/lab-PORT.pid))
python3 -m http.server PORT >/dev/null 2>&1 & echo $! > /tmp/lab-PORT.pid; sleep 1

# 2) every render: 4 views (2x2 grid, yaw 40/130/220/310) into a PNG, then Read the PNG
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader \
  --user-data-dir=/tmp/chrome-lab-PORT --hide-scrollbars --window-size=1200,1200 --virtual-time-budget=4000 \
  --screenshot=lab-out/NAME-v1.png "http://localhost:PORT/lab.html?shape=NAME" 2>/dev/null
```

Then use the Read tool on `lab-out/NAME-v1.png` to look at it (you can view images).

lab.html query options (append with &):
- `views=0,90,180,270`  yaw angles in degrees for the 4 cells (use fewer/other angles to check a side or the top)
- `single=1`  render only the FIRST view, full frame (big, good for detail checks)
- `zoom=1.8`  zoom in (default 1)
- `pitch=0.6` tilt the model toward the camera (radians) to inspect the top surface
- `t=2.5`  animation time in seconds passed to update()

The render uses the exact camera and lights of the real site (orthographic, from (8,7.2,8)), on a beige background.

# Reference images (so it is ACCURATE, not just plausible)

Use WebSearch / WebFetch to find the real subject, then download 1-3 good reference images with curl into
`lab-out/ref-NAME/` and Read them (viewing for reference only; never copy them into the shipped site, never trace
logos). Compare your render against the reference at the same viewing angle, list the differences (proportions,
silhouette, panel layout, colors), fix them, re-render. Do at least 4 render-and-compare rounds.
Reference downloads and renders stay in `lab-out/`; that folder is scratch.
Still follow shapes/CONTRACT.md (same export shape, size rules, `parts` the host relies on). Only edit YOUR shape file.
