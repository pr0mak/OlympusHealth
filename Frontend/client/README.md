# Space Apps Challenge — Frontend

React με JavaScript/JSX και Vite.

## Visual theme

The shared color tokens live in `src/styles/style.css`: deep blue-gray backgrounds,
off-white typography, and red health, violet assistant, and amber projection accents.
`OrbitalBackground.jsx` provides 16 orbit paths and a fixed star field with no pointer interaction.
`src/styles/assembly.css` coordinates the slower entrance: model from beyond the right edge,
staggered widgets, rotating logo, individual navigation links, footer, stars, and traced orbit lines.
The model entrance lasts 2.6 seconds and starts after
its asset is ready; widgets have a loading fallback. Reduced-motion preferences
show everything immediately. Page and anatomy styles share the theme tokens while
preserving the existing layout and viewer controls.

## Εκκίνηση

Από τον φάκελο `Frontend`:

```powershell
npm install
npm run dev
```

Άνοιξε τη διεύθυνση που εμφανίζει το Vite στο terminal, συνήθως `http://localhost:5173`.
Οι αλλαγές στον κώδικα εμφανίζονται αυτόματα στον browser.

## Εντολές

- `npm run dev`: τοπικός development server.
- `npm run build`: production build στον φάκελο `dist`.
- `npm run preview`: τοπική προεπισκόπηση του production build, αφού τρέξεις `npm run build`.

## Δομή

- `index.html`: HTML entry point του Vite.
- `src/main.jsx`: αρχικοποίηση του React.
- `src/App.jsx`: αρχικό component της εφαρμογής.
- `src/styles/style.css`: γενικά styles.
- `src/components/`: επαναχρησιμοποιήσιμα components.
- `src/pages/`: σελίδες της εφαρμογής.
- `src/context/`: React context providers.

## Pages and routing

React Router provides separate full-page views at `/`, `/register`, `/sign-in`,
`/health-data`, `/mission-assistant`, and `/future-projection`.
Home widgets link to their matching detail pages. Account forms are frontend
previews only; they do not send or store credentials or create a session.
Health measurements and scenario projections are mock data.

For production static hosting, configure an SPA fallback that serves `index.html`
for application routes. This lets refreshes and direct links to nested URLs work.

## 3D anatomy viewer

The overview lazily loads `src/components/anatomy/AnatomyViewer.jsx`.
It uses React Three Fiber, Three.js, and Drei with a locally served Meshopt GLB.
No Blender setup, remote model URL, or decoder CDN is required at runtime.

- Switch between Muscles, Skeleton, and Organs. A faint skeleton provides context
  for the muscle and organ views.
- Drag sideways to rotate around the upright body. Vertical tilt is locked.
- Panning is disabled. Zoom-out stops at the original fitted full-body scale for
  the current viewport and restores the centered orbit target when it settles.
  Cursor-focused closeups remain available while zoomed in.
- Mouse-wheel/trackpad zoom follows the cursor only while it intersects visible
  model geometry, so pointing at the chest or feet zooms toward that area.
  Wheel gestures over blank canvas space scroll the page normally. Hidden layers cannot
  activate zoom. Touch pinch remains available.
- Hover to identify a region, then click directly on the model to select and
  smoothly frame it. The viewer exposes only the three layer buttons below the
  model; it has no heading, border, dropdown, or extra camera controls.
- Click empty canvas space, double-click the viewer, press Escape while the
  viewer is focused, or click a layer button to return to its full-body view.
- Selection stays in the anatomy viewer for highlighting and camera framing.
  It does not add a label to the Health Data widget, whose vital readings remain
  global mock data.

`AnatomyScene.jsx` clones the cached scene, assigns materials per mesh, controls
layer visibility and pointer events, and frames selection using bounding boxes.
`src/data/anatomy.js` maps asset mesh names to the licensed catalog.
The model has some grouped structures, such as upper-arm muscles and lumbar spine.
It is generic reference anatomy and does not represent an individual crew member.

Attribution and CC BY 4.0 license links are available in the page footer. Source revision,
asset checksum, and original notices are in `public/models/anatomy/`.
The GLB is approximately 7.6 MB. Rendering is on demand and pixel ratio is capped
at 1.5. Full-body rendering still needs WebGL and a capable graphics device.

Run `npm run check:anatomy` to verify the source checksum, real Meshopt decoding,
catalog mappings, selectable core structures, model dimensions, and license files.

### Muscle selection regions

The Muscles layer exposes exactly nine selection IDs. Configure their original
mesh members in `src/data/muscleGroups.js`; the GLB stays unchanged.

| Selection ID | Label |
| --- | --- |
| `left_arm` | Left arm |
| `right_arm` | Right arm |
| `chest` | Chest |
| `abdominals` | Abdominals |
| `left_upper_leg` | Left leg above the knee |
| `right_upper_leg` | Right leg above the knee |
| `left_lower_leg` | Left leg below the knee |
| `right_lower_leg` | Right leg below the knee |
| `neck` | Neck |

Left/right refer to the body's anatomical sides. Arms include shoulders and hands;
upper legs include thigh, hip-flexor, and gluteal muscles; lower legs include feet.
Chest includes the pectoral and intercostal muscles. Unlisted back, trapezius,
diaphragm, and pelvic-floor meshes remain visible but are not selectable.

Hovering, clicking, and camera framing operate on the entire region.
The viewer offers an optional `onSelectionChange` callback for future region-specific information;
Home currently leaves it disconnected from the Health Data preview.
Skeleton and Organs keep their existing selections. The asset check also verifies
group membership, anatomical sides, missing meshes, and duplicate assignments.

Χρησιμοποίησε σύγχρονη έκδοση Node.js LTS συμβατή με το Vite. Το setup ελέγχθηκε με Node.js 24.
