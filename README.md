# InAmigos La Brew: concept café website (Task 3)

A 4-page website for a fictional café, built with AI tools.

- **Pages:** `index.html` (scroll tour), `menu.html`, `about.html`, `contact.html`
- **Stack:** HTML, Tailwind CSS (CDN), JavaScript, GSAP + ScrollTrigger, Lenis
- **AI used:** FLUX.1 schnell (images) and Wan 2.2 image-to-video (camera moves), both run free on Hugging Face ZeroGPU Spaces; site code written with Claude.

## Open it
Double-click `index.html`, or for the smoothest result run a local server in this folder:

```
python -m http.server 5600
```
then open http://localhost:5600

## Folders
- `assets/frames/` scroll frame sequences (lg for desktop, sm for phones)
- `assets/gen/` the raw generated images and video clips
- `assets/js`, `assets/css` site code
- `src/` page sources, built into the root pages by `tools/build.py`
- `tools/` generation, grading, frame export, build and screenshot scripts
- `screenshots/` desktop and mobile screenshots
