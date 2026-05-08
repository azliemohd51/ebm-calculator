# Kalkulator Susu Bayi / EBM

A simple React app to calculate a baby's daily breast-milk needs, validate weight against WHO standards, and generate a feeding schedule. Bahasa Malaysia UI.

**Version:** v1.1

## Stack
- React 18 + Vite
- Tailwind CSS
- lucide-react icons

## Run locally

```bash
npm install
npm run dev
```

App runs at http://localhost:3010.

## Build

```bash
npm run build
```

Output goes to `dist/`.

## Notes
- Formula: daily volume = `weight (kg) × 150 ml`.
- WHO weight-for-age table is an approximation (combined boys/girls average). For clinical assessment, refer to a pediatrician.
