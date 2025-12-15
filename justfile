set dotenv-load := true
set positional-arguments := true

# Default: show available commands
default:
    @just --list

# ──────────────────────────────
# Development
# ──────────────────────────────

dev:
    pnpm dev

build:
    pnpm build

start:
    pnpm start

clean:
    rm -rf .next

# ──────────────────────────────
# Quality
# ──────────────────────────────

lint:
    biome check .

format:
    biome format .

check:
    pnpm lint

# ──────────────────────────────
# Dependencies
# ──────────────────────────────

install:
    pnpm install

update:
    pnpm update
