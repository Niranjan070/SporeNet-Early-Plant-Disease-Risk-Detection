# SporeNet Frontend

This frontend is the React interface for SporeNet. It connects to the FastAPI backend, lets users upload microscope images, shows YOLO-based spore analysis results, and includes two Gemini-powered assistant experiences inside the UI.

## UI Layout

- Main workspace: upload, analysis results, annotated image, grouped detections, and image diagnosis assistant
- Right rail: docked general farming assistant that stays available across the app on desktop

On smaller screens, the right-side assistant moves below the main content for a cleaner mobile layout.

## Scripts

Install dependencies:

```bash
npm install
```

Start development server:

```bash
npm run dev
```

Create production build:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## Backend Requirement

The frontend expects the backend API to be running, typically at:

```text
http://localhost:8000
```

If needed, update the frontend API base configuration in:

```text
src/services/api.js
```

## Main Frontend Areas

- `src/App.jsx`: overall page structure and analysis workflow
- `src/components/AIAssistants.jsx`: docked farming assistant and image diagnosis assistant
- `src/services/api.js`: frontend API calls
- `src/App.css`: application styling and responsive layout

## Notes

- This app is designed around real backend output, not mock analysis results
- Gemini features depend on the backend being configured with a valid `GEMINI_API_KEY`
