#!/bin/bash

# Laravel Cloud deployment script
echo "Clearing configuration cache..."
php artisan config:clear
php artisan cache:clear

echo "Deployment complete!"
