FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci \
  && lightningcss_version="$(node -p "require('./node_modules/lightningcss/package.json').version")" \
  && case "$(node -p "process.arch")" in \
    arm64) npm install --no-save --package-lock=false "lightningcss-linux-arm64-musl@${lightningcss_version}" ;; \
    x64) npm install --no-save --package-lock=false "lightningcss-linux-x64-musl@${lightningcss_version}" ;; \
  esac \
  && if [ -f package-lock.json ]; then \
    cksum package.json package-lock.json > node_modules/.package-checksum; \
  else \
    cksum package.json > node_modules/.package-checksum; \
  fi

FROM node:22-alpine AS dev
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 3000

ENTRYPOINT ["sh", "/app/entrypoint.sh"]
CMD ["npm", "run", "dev"]
