<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class GameController extends Controller
{
    public function welcome(): Response
    {
        return Inertia::render('Welcome');
    }

    public function host(): Response
    {
        return Inertia::render('Host');
    }

    public function display(): Response
    {
        return Inertia::render('Display');
    }

    public function vote(): Response
    {
        return Inertia::render('Vote');
    }
}
