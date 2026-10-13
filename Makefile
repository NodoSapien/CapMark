.PHONY: help install dev build test check bootstrap up down logs smoke-db

help:            ## Muestra esta ayuda
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

install:         ## Instala dependencias
	pnpm install

dev:             ## App en desarrollo (http://localhost:5173)
	pnpm run dev

build:           ## Typecheck + build de producción
	pnpm run build

test:            ## Tests unitarios
	pnpm test

smoke-db:        ## Smoke test de base de datos (Postgres + migraciones)
	./scripts/smoke-test-db.sh

check:           ## Typecheck + tests + build (lo que corre CI)
	pnpm run typecheck && pnpm test && pnpm run build

bootstrap:       ## Auto-instancia el backend (secretos + compose + migraciones)
	./scripts/bootstrap.sh

up:              ## Levanta el backend
	pnpm run backend:up

down:            ## Detiene el backend
	pnpm run backend:down

logs:            ## Sigue los logs del backend
	pnpm run backend:logs
