#!/bin/bash

# Laravel Cloud deployment script
echo "Running migrations..."
php artisan migrate --force

echo "Seeding database..."
php artisan db:seed --force

echo "Deployment complete!"
