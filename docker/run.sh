#!/bin/bash

# Docker setup script for Password Management
# Usage: ./run.sh [command]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose is not installed or not in PATH"
    exit 1
fi

# Change to the docker directory
cd "$(dirname "$0")"

case "${1:-up}" in
    "up"|"start")
        print_status "Starting Password Management services..."
        docker-compose up -d
        print_success "Services started successfully!"
        print_status "Backend: http://localhost:3001"
        print_status "Frontend: http://localhost:3000"
        print_status "PostgreSQL: localhost:5432"
        print_status "Redis: localhost:6379"
        ;;
    "down"|"stop")
        print_status "Stopping Password Management services..."
        docker-compose down
        print_success "Services stopped successfully!"
        ;;
    "build")
        print_status "Building Password Management services..."
        docker-compose build --no-cache
        print_success "Services built successfully!"
        ;;
    "logs")
        print_status "Showing logs for all services..."
        docker-compose logs -f
        ;;
    "backend-logs")
        print_status "Showing backend logs..."
        docker-compose logs -f backend
        ;;
    "frontend-logs")
        print_status "Showing frontend logs..."
        docker-compose logs -f frontend
        ;;
    "restart")
        print_status "Restarting Password Management services..."
        docker-compose restart
        print_success "Services restarted successfully!"
        ;;
    "clean")
        print_warning "This will remove all containers, volumes, and networks!"
        read -p "Are you sure? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_status "Cleaning up Docker resources..."
            docker-compose down -v --remove-orphans
            docker system prune -f
            print_success "Cleanup completed!"
        else
            print_status "Cleanup cancelled."
        fi
        ;;
    "status")
        print_status "Checking service status..."
        docker-compose ps
        ;;
    "shell")
        service="${2:-backend}"
        print_status "Opening shell in $service container..."
        docker-compose exec $service sh
        ;;
    "help"|"-h"|"--help")
        echo "Password Management Docker Setup"
        echo ""
        echo "Usage: ./run.sh [command]"
        echo ""
        echo "Commands:"
        echo "  up, start     Start all services (default)"
        echo "  down, stop    Stop all services"
        echo "  build         Build all services"
        echo "  logs          Show logs for all services"
        echo "  backend-logs  Show backend logs only"
        echo "  frontend-logs Show frontend logs only"
        echo "  restart       Restart all services"
        echo "  clean         Remove all containers and volumes"
        echo "  status        Show service status"
        echo "  shell [service] Open shell in service container (default: backend)"
        echo "  help          Show this help message"
        ;;
    *)
        print_error "Unknown command: $1"
        echo "Use './run.sh help' to see available commands"
        exit 1
        ;;
esac
