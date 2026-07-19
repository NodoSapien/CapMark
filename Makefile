.PHONY: help install dev build test check bootstrap up down logs

help:            ## Muestra esta ayuda
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

install:         ## Instala dependencias
	npm install

dev:             ## App en desarrollo (http://localhost:5173)
	npm run dev

build:           ## Typecheck + build de producción
	npm run build

test:            ## Tests unitarios
	npm test

check:           ## Typecheck + tests + build (lo que corre CI)
	npm run typecheck && npm test && npm run build

bootstrap:       ## Auto-instancia el backend (secretos + compose + migraciones)
	./scripts/bootstrap.sh

up:              ## Levanta el backend
	npm run backend:up

down:            ## Detiene el backend
	npm run backend:down

logs:            ## Sigue los logs del backend
	npm run backend:logs
