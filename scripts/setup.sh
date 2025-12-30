#!/bin/bash

# Trading Post - Setup Script
# This script installs all dependencies, sets up the database, and starts the application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Header
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║           Trading Post - MTG Card Marketplace              ║"
echo "║                    Setup Script                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check for Node.js
print_status "Checking for Node.js..."
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    echo "  Visit: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi
print_success "Node.js $(node -v) found"

# Check for pnpm
print_status "Checking for pnpm..."
if ! command -v pnpm &> /dev/null; then
    print_warning "pnpm is not installed. Installing pnpm..."
    npm install -g pnpm@9
    if [ $? -ne 0 ]; then
        print_error "Failed to install pnpm. Please install it manually: npm install -g pnpm"
        exit 1
    fi
fi
print_success "pnpm $(pnpm -v) found"

# Install dependencies
print_status "Installing dependencies..."
pnpm install
if [ $? -ne 0 ]; then
    print_error "Failed to install dependencies"
    exit 1
fi
print_success "Dependencies installed"

# Setup backend environment file
print_status "Setting up environment configuration..."
if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    print_success "Created backend/.env from .env.example"
else
    print_warning "backend/.env already exists, skipping..."
fi

# Generate Prisma client
print_status "Generating Prisma client..."
pnpm db:generate
if [ $? -ne 0 ]; then
    print_error "Failed to generate Prisma client"
    exit 1
fi
print_success "Prisma client generated"

# Run database migrations
print_status "Running database migrations..."
cd backend
npx prisma migrate dev --name init --skip-generate 2>/dev/null || npx prisma migrate dev --skip-generate
cd ..
if [ $? -ne 0 ]; then
    print_error "Failed to run database migrations"
    exit 1
fi
print_success "Database migrations completed"

# Final success message
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    Setup Complete! 🎉                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
print_success "Trading Post is ready to run!"
echo ""
echo "To start the application, run:"
echo -e "  ${GREEN}pnpm dev${NC}"
echo ""
echo "This will start:"
echo "  • Frontend: http://localhost:5173"
echo "  • Backend:  http://localhost:3001"
echo ""

# Ask if user wants to start the app
read -p "Would you like to start the application now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Starting Trading Post..."
    pnpm dev
fi
