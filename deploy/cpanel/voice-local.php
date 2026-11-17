<?php
declare(strict_types=1);
namespace AparVoice;

require_once __DIR__ . '/voice-validation.php';

const PRIVATE_STORAGE = '/home/fm44mg4nvhpo/apar-private/voice-notes';
const STORAGE_LIMIT = 536870912; // 512 MiB; stop safely rather than fill hosting storage.

function uploadedFields(array $post, array $files, ?callable $isUpload = null): array {
    $isUpload ??= 'is_uploaded_file';
    foreach ($post as $name => $value) {
        if (!in_array($name, ['name', 'brand', 'duration', 'consent', 'website'], true) ||
            !is_string($value) || strlen($value) > 1024 || preg_match('//u', $value) !== 1) {
            throw new \InvalidArgumentException('Invalid fields');
        }
    }
    if (array_diff(array_keys($files), ['recording'])) throw new \InvalidArgumentException('Unexpected upload');
    if (!isset($files['recording'])) return $post;
    $file = $files['recording'];
    if (!is_array($file) || !is_int($file['error'] ?? null)) throw new \InvalidArgumentException('Invalid upload');
    if (in_array($file['error'], [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true)) throw new \LengthException();
    if ($file['error'] !== UPLOAD_ERR_OK || !is_string($file['tmp_name'] ?? null) ||
        !is_string($file['type'] ?? null) || !$isUpload($file['tmp_name'])) throw new \InvalidArgumentException('Upload failed');
    $bytes = file_get_contents($file['tmp_name'], false, null, 0, MAX_BYTES + 1);
    if ($bytes === false) throw new \RuntimeException('Upload unreadable');
    if (strlen($bytes) > MAX_BYTES) throw new \LengthException();
    $post['recording'] = ['bytes' => $bytes, 'mime' => strtolower(trim(explode(';', $file['type'])[0]))];
    return $post;
}

function privateRoot(string $path, string $documentRoot): string {
    if ($path === '' || $path[0] !== '/' || is_link($path)) throw new \RuntimeException('Invalid private storage');
    if (!is_dir($path) && !mkdir($path, 0700, true) && !is_dir($path)) throw new \RuntimeException('Storage unavailable');
    $root = realpath($path);
    $public = realpath($documentRoot);
    if ($root === false || $public === false || $public === '/' || $root === $public || str_starts_with($root, $public . '/')) {
        throw new \RuntimeException('Storage must be outside the web root');
    }
    if (!chmod($root, 0700)) throw new \RuntimeException('Storage permissions unavailable');
    return $root;
}

function writePrivate(string $path, string $bytes): void {
    $handle = fopen($path, 'xb');
    if ($handle === false) throw new \RuntimeException('Private write failed');
    try {
        if (fwrite($handle, $bytes) !== strlen($bytes) || !fflush($handle) || !chmod($path, 0600)) {
            throw new \RuntimeException('Private write incomplete');
        }
    } finally { fclose($handle); }
}

function saveLocal(array $note, string $path, string $documentRoot, string $ip, ?int $now = null): array {
    $now ??= time();
    $previousMask = umask(0077);
    $lock = null;
    $pending = null;
    try {
        $root = privateRoot($path, $documentRoot);
        // One lock covers reservations, quota checks and the atomic submission.
        $lockPath = $root . '/.limits.json';
        if (is_link($lockPath)) throw new \RuntimeException('Invalid limiter');
        $lock = fopen($lockPath, 'c+b');
        if ($lock === false || !flock($lock, LOCK_EX | LOCK_NB) || !chmod($lockPath, 0600)) {
            throw new \RuntimeException('Storage busy');
        }
        $raw = stream_get_contents($lock, 1048577);
        if ($raw === false || strlen($raw) > 1048576) throw new \RuntimeException('Invalid limiter');
        $state = $raw === '' ? ['salt' => bin2hex(random_bytes(32)), 'attempts' => []] : json_decode($raw, true, 16, JSON_THROW_ON_ERROR);
        if (!is_array($state) || !is_string($state['salt'] ?? null) || !is_array($state['attempts'] ?? null)) throw new \RuntimeException('Invalid limiter');
        $attempts = array_values(array_filter($state['attempts'], static fn($a) => is_array($a) && is_int($a['at'] ?? null) && $a['at'] > $now - 86400));
        $hash = hash_hmac('sha256', $ip, $state['salt']);
        $recent = array_filter($attempts, static fn($a) => ($a['ip'] ?? '') === $hash && $a['at'] > $now - 3600);
        if (count($recent) >= 3) return result(429, 'Please wait before sending another recording.');
        if (count($attempts) >= 200) return result(503, 'Voice feedback is temporarily unavailable.');

        $used = 0;
        $iterator = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($root, \FilesystemIterator::SKIP_DOTS));
        foreach ($iterator as $file) {
            if ($file->isLink()) throw new \RuntimeException('Invalid storage entry');
            if ($file->isFile()) $used += $file->getSize();
            if ($used + strlen($note['bytes']) + 8192 > STORAGE_LIMIT) return result(503, 'Voice feedback is temporarily unavailable.');
        }
        // Reserve first. A failed upload still counts toward the abuse limit.
        $state['attempts'] = [...$attempts, ['at' => $now, 'ip' => $hash]];
        $limits = json_encode($state, JSON_THROW_ON_ERROR);
        rewind($lock);
        if (fwrite($lock, $limits) !== strlen($limits) || !ftruncate($lock, strlen($limits)) || !fflush($lock)) throw new \RuntimeException('Reservation failed');

        $day = $root . '/' . gmdate('Y-m-d', $now);
        if (is_link($day)) throw new \RuntimeException('Invalid storage entry');
        if (!is_dir($day) && !mkdir($day, 0700)) throw new \RuntimeException('Storage unavailable');
        $id = uuid();
        $pending = $day . '/.pending-' . $id;
        if (!mkdir($pending, 0700)) throw new \RuntimeException('Storage unavailable');
        $audio = 'recording.' . $note['extension'];
        writePrivate($pending . '/' . $audio, $note['bytes']);
        writePrivate($pending . '/note.json', json_encode([
            'id' => $id, 'received_at' => gmdate('c', $now), 'name' => $note['name'],
            'brand' => $note['brand'], 'duration_seconds_reported' => $note['duration'],
            'mime_type' => $note['mime'], 'audio_file' => $audio, 'bytes' => strlen($note['bytes']),
            'sha256' => hash('sha256', $note['bytes']), 'consent' => 'Private feedback to APAR; not public publication.',
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR) . "\n");
        if (!rename($pending, $day . '/' . $id)) throw new \RuntimeException('Commit failed');
        $pending = null;
        return [201, ['ok' => true, 'id' => $id]];
    } catch (\Throwable) {
        error_log('apar_voice_private_storage_failed'); // No names, recordings, IPs or keys in logs.
        return result(503, 'Voice feedback is temporarily unavailable.');
    } finally {
        if ($pending !== null && is_dir($pending)) {
            foreach (glob($pending . '/*') ?: [] as $file) if (is_file($file)) unlink($file);
            rmdir($pending); // Only incomplete files created by this request.
        }
        if (is_resource($lock)) { flock($lock, LOCK_UN); fclose($lock); }
        umask($previousMask);
    }
}

function localEndpoint(): array {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') { header('Allow: POST'); return result(405, 'Method not allowed.'); }
    if (!originAllowed($_SERVER['HTTP_ORIGIN'] ?? null, ['https://preview.apar.agency'])) return result(403, 'Invalid request origin.');
    $length = $_SERVER['CONTENT_LENGTH'] ?? null;
    if ($length !== null && !ctype_digit((string)$length)) return result(400, 'Could not read the recording.');
    if ($length !== null && (float)$length > MAX_REQUEST) return result(413, 'Recording is too large (4 MB maximum).');
    $type = $_SERVER['CONTENT_TYPE'] ?? '';
    if (!preg_match('/^multipart\/form-data\s*;/i', $type)) return result(400, 'Could not read the recording.');
    try {
        if (filter_var(ini_get('enable_post_data_reading'), FILTER_VALIDATE_BOOLEAN)) {
            $fields = uploadedFields($_POST, $_FILES);
        } else {
            $body = file_get_contents('php://input', false, null, 0, MAX_REQUEST + 1);
            if ($body === false) throw new \InvalidArgumentException();
            $fields = multipart($body, $type);
        }
        [$status, $note] = validate($fields);
    } catch (\LengthException) { return result(413, 'Recording is too large (4 MB maximum).'); }
    catch (\Throwable) { return result(400, 'Could not read the recording.'); }
    if ($status !== 0) return [$status, $note];
    ignore_user_abort(true);
    return saveLocal($note, getenv('APAR_VOICE_STORAGE_DIR') ?: PRIVATE_STORAGE,
        $_SERVER['DOCUMENT_ROOT'] ?? '', $_SERVER['REMOTE_ADDR'] ?? 'unknown');
}
