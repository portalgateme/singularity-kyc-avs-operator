FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock* ./
RUN yarn install --frozen-lockfile --production=false

COPY . .
RUN yarn build

FROM node:20-alpine

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY package.json yarn.lock* ./
RUN yarn install --frozen-lockfile --production=true

COPY --from=builder /app/dist ./dist

RUN mkdir logs && chown appuser:appgroup logs

USER appuser

CMD ["node", "dist/index.js"]