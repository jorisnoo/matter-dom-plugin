# List available recipes
default:
    @just --list

# Install dependencies
install:
    npm install

# Update dependencies
update:
    npm update

# Fix code style
lint:
    npm run lint

# Check code style without fixing
lint-check:
    npm run lint:check

# Run all checks
check: lint-check
