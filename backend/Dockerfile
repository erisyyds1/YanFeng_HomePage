FROM golang:1.25-bookworm AS builder

WORKDIR /src

COPY backend/go.mod backend/go.sum ./
RUN go mod download

COPY backend/ ./
RUN CGO_ENABLED=1 GOOS=linux go build -o /out/yanfeng-api ./cmd/server

FROM debian:bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /out/yanfeng-api /app/yanfeng-api
COPY db.json /app/seed/db.json

RUN mkdir -p /app/public/uploads

EXPOSE 3001

CMD ["/app/yanfeng-api"]
