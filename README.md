# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Customer Join Routes

`https://getpocketstamp.com/join/:merchantSlug` is proxied to the backend join page, except `/join/pocket-stamp-demo`, which is the frontend demo flow. Wallet pass downloads and backend-hosted legal pages are also exposed through branded routes on `getpocketstamp.com`.

The backend origin should not appear in customer-facing join, pass, or legal links.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
