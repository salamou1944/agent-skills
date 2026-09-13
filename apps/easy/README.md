# EASY Core

Runnable foundation for the EASY Creative Engine.

## Run

```bash
cd apps/easy
npm start
```

Open `http://localhost:8787`.

## Current capabilities

- Seller-facing Product DNA capture.
- Fail-closed identity gate for immutable product attributes.
- Provider-neutral creative planning contract.
- Creative integrity validation endpoint.
- Mobile-first single-page interface.
- No external image/video generation provider is enabled.

## Immutable identity

`color`, `logo`, `printedText`, `brandName`, `shape`, `components`, and `designDetails` are protected. Creative planning may change only contextual/flexible properties such as background, environment, lighting, camera, composition, objects, effects, and context.

## API

- `GET /api/health`
- `GET /api/capabilities`
- `POST /api/product-dna`
- `POST /api/creative/plan`
- `POST /api/creative/validate`

This is the first runnable EASY foundation, not a claim that the full production marketplace or image/video generation system is complete. A real generation provider remains intentionally behind the provider boundary.
