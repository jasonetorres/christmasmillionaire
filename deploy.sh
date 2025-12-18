#!/bin/bash

cd /var/www/html || exit

# Ensure necessary directories exist
mkdir -p storage/framework/cache storage/framework/views bootstrap/cache

# Fix permissions - 775 is usually enough, but you can set 777 if needed
chmod -R 775 storage/framework/cache storage/framework/views bootstrap/cache

# Clear caches
php artisan view:clear
php artisan cache:clear
php artisan config:clear

# Rebuild caches (optional, but recommended)
php artisan config:cache
php artisan route:cache
php artisan view:cache
