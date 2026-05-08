## Project Reflection

A React + TypeScript web app built with Vite. Includes Join and Phone Join flows, a Feedback page, and a Visualisation page.

## Features
- Join / Phone Join pages
- Feedback page
- Visualisation page
- Firebase integration

## Tech stack
- React
- TypeScript
- Vite
- React Router
- Firebase

## Getting started
### Requirements
- Node.js (recommended: latest LTS)

### Install
```bash
npm install
```

### Run (development)
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Preview production build
```bash
npm run preview
```

### Lint
```bash
npm run lint
```

## Environment variables
This project uses a `.env` file for local configuration.

- Do not commit your real `.env` if it contains secrets.
- If you need to share required keys/variable names, create a `.env.example` with placeholder values.

## Project structure (high level)
- `src/App.tsx`: app entry and routing
- `src/pages/Join.tsx`: join flow
- `src/pages/PhoneJoin.tsx`: phone join flow
- `src/pages/feedback.tsx`: feedback page
- `src/pages/Visualisation.tsx`: visualisation page
