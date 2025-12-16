<?php

namespace App\Http\Controllers;

use Inertia\Inertia;

class GameController extends Controller
{
    public function index()
    {
        return Inertia::render('Welcome');
    }

    public function host()
    {
        return Inertia::render('Host');
    }

    public function display()
    {
        return Inertia::render('Display');
    }

    public function admin()
    {
        return Inertia::render('Admin');
    }

    public function vote()
    {
        return Inertia::render('Vote');
    }
}
