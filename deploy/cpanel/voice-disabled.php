<?php
// Voice recording is intentionally unavailable in the GoDaddy launch.
// Do not load private configuration, read uploads or contact a storage provider.
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
http_response_code(410);
echo '{"error":"Voice feedback is disabled for this launch."}';
