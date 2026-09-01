# syntax=docker/dockerfile:1.7

# ---------- Build stage ----------
FROM node:20-alpine AS build
WORKDIR /workspace
COPY package.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm install --no-audit --no-fund --loglevel=error
COPY . .
RUN npm run build

# ---------- Runtime stage ----------
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/dist/compliance-ui/browser /usr/share/nginx/html
EXPOSE 4200
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=10 \
    CMD wget -q -O- http://localhost:4200/ >/dev/null || exit 1
