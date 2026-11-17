<?php
declare(strict_types=1);
ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
require __DIR__ . '/voice-local.php';
try {
    [$status, $body] = \AparVoice\localEndpoint();
} catch (Throwable) {
    error_log('apar_voice_request_failed');
    $status = 503;
    $body = ['error' => 'Voice feedback is temporarily unavailable.'];
}
http_response_code($status);
if ($status === 429) header('Retry-After: 3600');
echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
