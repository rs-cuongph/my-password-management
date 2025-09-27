# My Password Management - Frontend

Modern and secure password management application built with React, TypeScript, and Vite.

## Features

- **Secure Password Storage**: End-to-end encryption with Argon2 key derivation
- **Modern UI**: Beautiful interface built with React and Tailwind CSS
- **Accessibility**: Full keyboard navigation and screen reader support
- **Theme Support**: Light and dark mode with high contrast options
- **Export/Import**: Backup and restore your password vault
- **Two-Factor Authentication**: TOTP support for enhanced security

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS 3.4
- **Routing**: TanStack Router
- **State Management**: Zustand
- **Encryption**: Argon2, XChaCha20-Poly1305
- **Forms**: Valibot for validation

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## Environment Configuration

The Vite development server can be configured using environment variables:

### Available Environment Variables

- `VITE_PORT`: Port for the development server (default: 5173)
- `VITE_HOST`: Host for the development server (default: localhost)
- `VITE_API_URL`: API base URL for backend communication (default: http://localhost:3000)

### Usage Examples

1. **Using environment files:**
   ```bash
   # Copy the example file and modify as needed
   cp .env.example .env.local
   
   # Edit .env.local with your preferred settings
   VITE_PORT=3001
   VITE_HOST=0.0.0.0
   ```

2. **Using inline environment variables:**
   ```bash
   # Run on port 3001
   VITE_PORT=3001 npm run dev
   
   # Run on all interfaces (accessible from other devices)
   VITE_HOST=0.0.0.0 npm run dev
   
   # Run on custom port and host
   VITE_PORT=8080 VITE_HOST=0.0.0.0 npm run dev
   ```

3. **Using npm scripts:**
   ```bash
   # Use the dev:port script for quick port changes
   npm run dev:port 3001
   ```

### Environment File Priority

Vite loads environment variables in this order (higher priority overrides lower):
1. `.env.local` (always ignored by git)
2. `.env.development` (only loaded in development)
3. `.env` (always loaded)

