Local setup
===========

1. Copy `.env.example` to `.env` and fill values.

2. Generate local TLS certs (recommended `mkcert`) or run the provided script:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\mkcert-generate.ps1
```

3. Add host entry (Windows):

```
127.0.0.1 pcforge.local
```

4. Install dependencies and Husky hooks (run once):

```powershell
cd TechAcademy5back
npm install
npm run prepare
```

5. Start services with Docker Compose:

```powershell
docker compose up --build
```

Notes:
- The `certs/` directory is ignored by Git; do not commit private keys.
- If you use `mkcert`, generate `certs/pcforge.local.crt` and `certs/pcforge.local.key`.
