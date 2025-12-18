<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'supabase' => [
                'url' => env('VITE_SUPABASE_URL'),
                'anonKey' => env('VITE_SUPABASE_ANON_KEY'),
            ],
        ];
    }
}
