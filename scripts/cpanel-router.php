<?php
// Local HTTP-only test server. Production routing is Apache .htaccess.
$root = realpath($_SERVER['DOCUMENT_ROOT']);
$url = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = rawurldecode($url ?: '/');
if ($path === '/api/voice-feedback' || $path === '/api/voice-feedback/') {
    require $root . '/api/voice-feedback/index.php';
    return true;
}
if (str_ends_with($path, '.php') || str_contains($path, '/../') || str_contains($path, '\\')) {
    http_response_code(404); readfile($root . '/404.html'); return true;
}
$file = $root . ($path === '/' ? '/index.html' : rtrim($path, '/') . '.html');
if (is_file($file)) {
    header('Content-Type: text/html; charset=utf-8'); readfile($file); return true;
}
if (is_file($root . $path)) return false;
http_response_code(404);
header('Content-Type: text/html; charset=utf-8');
readfile($root . '/404.html');
