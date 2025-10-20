# 買Buy
Pronounced MaiBuy (zh) or BaiBuy (ja)

### 買 (买)  
**Pinyin:** mǎi  

**Meaning:**  
Catch **网** (altered) with shell money **貝**.  
Simplified form uses **头** (head) simplification. (**動**) buy

### 買

*(Second grade kyōiku kanji)*  
1. to buy

---

### Readings

- **Go-on:** め (*me*)
- **Kan-on:** ばい (*bai*, Jōyō)
- **Kun:** かう (*kau*, 買う, Jōyō), －かふ (*kafu*, 買ふ, historical)

## How

```bash
git init
npm create vite@latest client
mkdir -p server/src && npm init -y
```

- define server/package.json
- define server/tsconfig.json

## Live Reloading

- client's package.json defines `dev: "vite"`, which starts the Vite dev server which already supports HMR through React Refresh.
- root package.json defines `dev:client` which runs the above in the client workspace.
- Dockerfile defines 2 stages: Production and Development.
Production creates static assets and is meant for deployment to AWS.
Development runs `vite dev` inside the container and uses hot reloading

To build/run Production stage:
```
docker build -t app-prod --target production .
docker run -p 8080:8080 app-prod
```

To build/run Development stage:

Client:
```
docker pull node:20-alpine
docker build -t app-client-dev --target client-development .
docker run --rm -it \
  -p 5173:5173 \
  -v $(pwd)/client:/app/client \
  app-client-dev
```

Server:
```
docker build -t app-server-dev --target server-development . 
docker run --rm -it \
  -p 8080:8080 \
  -v $(pwd)/server:/app/server \
  app-server-dev
```
