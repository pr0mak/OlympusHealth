# Space Apps Challenge — Frontend

React με JavaScript/JSX και Vite.

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

Χρησιμοποίησε σύγχρονη έκδοση Node.js LTS συμβατή με το Vite. Το setup ελέγχθηκε με Node.js 24.
