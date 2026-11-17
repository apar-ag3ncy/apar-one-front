<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
ini_set('display_errors', '0');
require __DIR__ . '/voice.php';
try { [$status, $body] = \AparVoice\endpoint(); }
catch (Throwable) {
    error_log('voice_feedback_handler_failed');
    $status = 503;
    $body = ['error' => 'Voice feedback is temporarily unavailable.'];
}
http_response_code($status);
echo json_encode($body, JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
