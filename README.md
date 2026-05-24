# HomeOps RPG — Frontend

Cliente **React + Vite** que consume la API del backend.

Repositorio: [homeops-frontend](https://github.com/Ismaelmc8/homeops-frontend)

---

## Requisitos

- Node.js LTS (v20+)
- Backend en marcha (ver `../back-end/README.md`)

---

## Configuración

1. Instalar dependencias:

```powershell
npm install
```

2. Variables de entorno:

```powershell
copy .env.example .env
```

Por defecto:

```env
VITE_API_URL=http://localhost:4000
```

Debe coincidir con el puerto del API y con `CORS_ORIGIN` del backend.

---

## Arrancar

**Solo front-end:**

```powershell
npm run dev
```

App en `http://localhost:5173` (puerto habitual de Vite).

La pantalla inicial comprueba `GET /api/health` y muestra el estado del API.

---

## Desde la carpeta raíz del monorepo local

En `Tareas del hogar/`:

```powershell
npm install
npm run dev
```

Levanta backend y front-end a la vez (`concurrently`).

---

## Scripts

| Comando | Uso |
|---------|-----|
| `npm run dev` | Desarrollo con HMR |
| `npm run build` | Build producción |
| `npm run preview` | Previsualizar build |
| `npm run lint` | ESLint |

---

## Estructura relevante

```text
src/
  api/client.js    cliente HTTP (apiFetch, getHealth)
  config/env.js    VITE_API_URL
  App.jsx          shell temporal (health check en E0)
```

Documentación: `../docs/HOMEOPS-RPG-PLAN-TECNICO.md`, fase [E0](../docs/evolutivos/E0-fundamentos.md).
