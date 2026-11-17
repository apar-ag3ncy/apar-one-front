<?php
declare(strict_types=1);

// Private-upload adapter for Apache/PHP hosting. The Next.js route remains the
// default for Node deployments. No credentials are packaged with this file.
namespace AparVoice;

const PROJECT = 'https://msqfxdqeilrzmsddlxwl.supabase.co';
const MAX_BYTES = 4194304;
const MAX_REQUEST = MAX_BYTES + 64000;
const SAVE_ERROR = 'The recording could not be saved. Please try again.';
const UNCERTAIN = 'Delivery could not be confirmed. Your note may have reached us; please check with our team before resending.';

function result(int $status, string $message): array {
    return [$status, ['error' => $message]];
}

function originAllowed(?string $origin, array $extra = []): bool {
    if ($origin === null || $origin === '') return true;
    $allowed = ['https://apar.agency', 'https://www.apar.agency', ...$extra];
    $parts = parse_url($origin);
    if (!is_array($parts) || ($parts['scheme'] ?? '') !== 'https' ||
        !isset($parts['host']) || isset($parts['user'], $parts['pass']) ||
        isset($parts['user']) || isset($parts['pass']) || isset($parts['query']) ||
        isset($parts['fragment']) || !in_array($parts['path'] ?? '', ['', '/'], true)) return false;
    return in_array(rtrim($origin, '/'), $allowed, true);
}

// Parse the bounded raw body ourselves: PHP's normal form parser silently
// collapses duplicate keys. enable_post_data_reading=Off is required in .user.ini.
function multipart(string $body, string $contentType): array {
    if (strlen($body) > MAX_REQUEST) throw new \LengthException();
    if (!preg_match('/^multipart\/form-data\s*;\s*boundary=(?:"([A-Za-z0-9\x27()+_,.\/:=? -]{1,70})"|([A-Za-z0-9\x27()+_,.\/:=?-]{1,70}))\s*$/iD', $contentType, $m)) {
        throw new \InvalidArgumentException('Malformed multipart content type');
    }
    $boundary = $m[1] !== '' ? $m[1] : $m[2];
    $marker = '--' . $boundary;
    if (!str_starts_with($body, $marker . "\r\n")) throw new \InvalidArgumentException();
    $offset = strlen($marker) + 2;
    $fields = [];
    while (true) {
        $endHeaders = strpos($body, "\r\n\r\n", $offset);
        if ($endHeaders === false || $endHeaders - $offset > 4096) throw new \InvalidArgumentException();
        $headers = [];
        foreach (explode("\r\n", substr($body, $offset, $endHeaders - $offset)) as $line) {
            if (!preg_match('/^(Content-Disposition|Content-Type):\s*([^\r\n]+)$/iD', $line, $h)) throw new \InvalidArgumentException();
            $key = strtolower($h[1]);
            if (isset($headers[$key])) throw new \InvalidArgumentException();
            $headers[$key] = $h[2];
        }
        if (!preg_match('/^form-data;\s*name="([a-z]+)"(?:;\s*filename="([^"\r\n]*)")?$/D', $headers['content-disposition'] ?? '', $d)) throw new \InvalidArgumentException();
        $name = $d[1];
        if (!in_array($name, ['name', 'brand', 'duration', 'consent', 'website', 'recording'], true) || array_key_exists($name, $fields)) {
            throw new \DomainException();
        }
        $isFile = array_key_exists(2, $d);
        if (($name === 'recording') !== $isFile) throw new \DomainException();
        $valueStart = $endHeaders + 4;
        $next = strpos($body, "\r\n" . $marker, $valueStart);
        if ($next === false) throw new \InvalidArgumentException();
        $value = substr($body, $valueStart, $next - $valueStart);
        if (!$isFile && (strlen($value) > 1024 || preg_match('//u', $value) !== 1)) throw new \InvalidArgumentException();
        $fields[$name] = $isFile ? ['bytes' => $value, 'mime' => strtolower(trim(explode(';', $headers['content-type'] ?? '')[0]))] : $value;
        $offset = $next + 2 + strlen($marker);
        if (substr($body, $offset, 2) === '--') {
            $tail = substr($body, $offset + 2);
            if ($tail !== '' && $tail !== "\r\n") throw new \InvalidArgumentException();
            return $fields;
        }
        if (substr($body, $offset, 2) !== "\r\n") throw new \InvalidArgumentException();
        $offset += 2;
        if (count($fields) >= 6) throw new \DomainException();
    }
}

function utf16Length(string $text): int {
    return intdiv(strlen(iconv('UTF-8', 'UTF-16LE', $text)), 2);
}

function validate(array $fields): array {
    if (($fields['website'] ?? '') !== '') return [202, ['ok' => true]];
    $name = preg_replace('/^\s+|\s+$/u', '', $fields['name'] ?? '');
    $brand = preg_replace('/^\s+|\s+$/u', '', $fields['brand'] ?? '');
    if (utf16Length($name) < 2 || utf16Length($name) > 80 || utf16Length($brand) > 80 || ($fields['consent'] ?? '') !== 'yes') {
        return result(400, 'Add your name and agree to send the private recording.');
    }
    $duration = $fields['duration'] ?? '';
    if (!is_numeric($duration) || !is_finite((float)$duration) || (float)$duration < 1 || (float)$duration > 60) return result(400, 'Record up to one minute of audio.');
    $file = $fields['recording'] ?? null;
    if (!is_array($file) || strlen($file['bytes']) < 200 || strlen($file['bytes']) > MAX_BYTES) return result(400, 'Record a voice note under 4 MB.');
    $mime = $file['mime'];
    $extensions = ['audio/webm' => 'webm', 'audio/mp4' => 'm4a', 'audio/ogg' => 'ogg'];
    if (!isset($extensions[$mime])) return result(400, 'This audio format is not supported.');
    $valid = match ($mime) {
        'audio/webm' => substr($file['bytes'], 0, 4) === "\x1a\x45\xdf\xa3",
        'audio/mp4' => substr($file['bytes'], 4, 4) === 'ftyp',
        'audio/ogg' => substr($file['bytes'], 0, 4) === 'OggS',
    };
    if (!$valid) return result(400, 'The recording could not be verified.');
    return [0, ['name' => $name, 'brand' => $brand, 'duration' => (float)$duration, 'mime' => $mime, 'extension' => $extensions[$mime], 'bytes' => $file['bytes']]];
}

function uuid(): string {
    $b = random_bytes(16);
    $b[6] = chr((ord($b[6]) & 15) | 64);
    $b[8] = chr((ord($b[8]) & 63) | 128);
    $hex = bin2hex($b);
    return substr($hex, 0, 8) . '-' . substr($hex, 8, 4) . '-' . substr($hex, 12, 4) . '-' . substr($hex, 16, 4) . '-' . substr($hex, 20);
}

function save(array $note, string $secret, string $ip, callable $request): array {
    $headers = ['apikey' => $secret, 'Content-Type' => 'application/json'];
    try {
        $limit = $request(PROJECT . '/rest/v1/rpc/reserve_voice_feedback_submission', 'POST', $headers,
            json_encode(['p_ip_hash' => hash_hmac('sha256', $ip, $secret)], JSON_THROW_ON_ERROR), 3000);
        if (!$limit['ok'] || !is_bool($limit['data'])) return result(503, 'Voice feedback is temporarily unavailable.');
        if (!$limit['data']) return result(429, 'Please wait before sending another recording.');
    } catch (\Throwable) { return result(503, 'Voice feedback is temporarily unavailable.'); }

    $id = uuid();
    $path = gmdate('Y-m-d') . '/' . $id . '.' . $note['extension'];
    $object = PROJECT . '/storage/v1/object/client-voice-feedback/' . $path;
    $metadata = PROJECT . '/rest/v1/client_voice_feedback';
    $body = json_encode(['id' => $id, 'name' => $note['name'], 'brand' => $note['brand'] === '' ? null : $note['brand'],
        'duration_seconds' => $note['duration'], 'mime_type' => $note['mime'], 'storage_path' => $path], JSON_THROW_ON_ERROR);
    $success = [201, ['ok' => true, 'id' => $id]];
    $review = static function (string $stage) use ($id): void { error_log('voice_feedback_reconciliation_needed id=' . $id . ' stage=' . $stage); };
    try {
        $upload = $request($object, 'POST', ['apikey' => $secret, 'Content-Type' => $note['mime'], 'x-upsert' => 'false'], $note['bytes'], 6000);
        if (!$upload['ok']) {
            if ($upload['status'] >= 500 || $upload['status'] === 408) $review('upload');
            return result(502, SAVE_ERROR);
        }
    } catch (\Throwable) { $review('upload'); return result(502, UNCERTAIN); }

    $lookup = static function () use ($request, $metadata, $headers, $id, $path): string {
        try {
            $r = $request($metadata . '?id=eq.' . $id . '&select=id,storage_path&limit=1', 'GET', $headers, null, 2000);
            if (!$r['ok'] || !is_array($r['data']) || !array_is_list($r['data'])) return 'unknown';
            if ($r['data'] === []) return 'absent';
            return ($r['data'][0]['id'] ?? null) === $id && ($r['data'][0]['storage_path'] ?? null) === $path ? 'present' : 'unknown';
        } catch (\Throwable) { return 'unknown'; }
    };
    $insert = null;
    try {
        $insert = $request($metadata, 'POST', [...$headers, 'Prefer' => 'return=minimal'], $body, 4000);
        if ($insert['ok']) return $success;
    } catch (\Throwable) { /* A lost response may still have committed. */ }
    $state = $lookup();
    if ($state === 'present') return $success;
    $rejected = $insert !== null && !$insert['ok'] && $insert['status'] >= 400 && $insert['status'] < 500 &&
        in_array($insert['data']['code'] ?? null, ['23502', '23503', '23514', '22P02', '22001', '42501'], true);
    if ($rejected) {
        if ($state === 'absent') {
            for ($attempt = 0; $attempt < 2; $attempt++) {
                try {
                    $removed = $request($object, 'DELETE', ['apikey' => $secret], null, 2000);
                    if ($removed['ok'] || $removed['status'] === 404) return result(502, SAVE_ERROR);
                } catch (\Throwable) { /* Bounded retry, then keep private object. */ }
            }
            $review('cleanup');
        } else $review('metadata_lookup');
        return result(502, SAVE_ERROR);
    }
    try {
        $request($metadata . '?on_conflict=id', 'POST', [...$headers, 'Prefer' => 'resolution=ignore-duplicates,return=minimal'], $body, 4000);
    } catch (\Throwable) { /* Verify before claiming success. */ }
    if ($lookup() === 'present') return $success;
    $review('metadata');
    return result(502, UNCERTAIN);
}

function provider(): \Closure {
    $deadline = hrtime(true) + 20_000_000_000;
    return static function (string $url, string $method, array $headers, ?string $body, int $budget) use ($deadline): array {
        if (!str_starts_with($url, PROJECT . '/')) throw new \RuntimeException('Invalid provider');
        $budget = min($budget, (int)(($deadline - hrtime(true)) / 1_000_000));
        if ($budget <= 0) throw new \RuntimeException('Provider deadline');
        $curl = curl_init($url);
        $response = '';
        $headerLines = [];
        foreach ($headers as $name => $value) $headerLines[] = $name . ': ' . $value;
        curl_setopt_array($curl, [CURLOPT_CUSTOMREQUEST => $method, CURLOPT_HTTPHEADER => $headerLines,
            CURLOPT_FOLLOWLOCATION => false, CURLOPT_PROTOCOLS => CURLPROTO_HTTPS, CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2, CURLOPT_CONNECTTIMEOUT_MS => min(2000, $budget), CURLOPT_TIMEOUT_MS => $budget,
            CURLOPT_WRITEFUNCTION => static function ($handle, string $chunk) use (&$response): int {
                if (strlen($response) + strlen($chunk) > 1_048_576) return 0;
                $response .= $chunk;
                return strlen($chunk);
            }]);
        if ($body !== null) curl_setopt($curl, CURLOPT_POSTFIELDS, $body);
        $ok = curl_exec($curl);
        $status = (int)curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
        if ($ok === false) throw new \RuntimeException('Provider request failed');
        return ['ok' => $status >= 200 && $status < 300, 'status' => $status, 'data' => json_decode($response, true)];
    };
}

function endpoint(): array {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        header('Allow: POST');
        return result(405, 'Method not allowed.');
    }
    // Absolute account-private location; never search in the public document root.
    $configPath = getenv('APAR_VOICE_CONFIG') ?: '/home/fm44mg4nvhpo/apar-private/voice-config.php';
    $config = is_file($configPath) ? require $configPath : [];
    if (!is_array($config)) return result(503, 'Voice feedback is temporarily unavailable.');
    if (!originAllowed($_SERVER['HTTP_ORIGIN'] ?? null, $config['allowed_origins'] ?? [])) return result(403, 'Invalid request origin.');
    $secret = $config['secret_key'] ?? '';
    if (($config['supabase_url'] ?? '') !== PROJECT || !is_string($secret) || !str_starts_with($secret, 'sb_secret_') ||
        !extension_loaded('curl') || !extension_loaded('iconv') || filter_var(ini_get('enable_post_data_reading'), FILTER_VALIDATE_BOOLEAN)) {
        return result(503, 'Voice feedback is temporarily unavailable.');
    }
    $length = $_SERVER['CONTENT_LENGTH'] ?? null;
    if ($length !== null && !ctype_digit((string)$length)) return result(400, 'Could not read the recording.');
    if ($length !== null && (float)$length > MAX_REQUEST) return result(413, 'Recording is too large (4 MB maximum).');
    $input = fopen('php://input', 'rb');
    stream_set_timeout($input, 8);
    $start = microtime(true);
    $body = '';
    while (!feof($input)) {
        $chunk = fread($input, min(65536, MAX_REQUEST + 1 - strlen($body)));
        if ($chunk === false) return result(400, 'Could not read the recording.');
        $body .= $chunk;
        if (strlen($body) > MAX_REQUEST) return result(413, 'Recording is too large (4 MB maximum).');
        if (microtime(true) - $start > 8 || (stream_get_meta_data($input)['timed_out'] ?? false)) return result(408, 'The recording upload took too long. Please try again.');
        if ($chunk === '' && !feof($input)) return result(400, 'Could not read the recording.');
    }
    fclose($input);
    try { $fields = multipart($body, $_SERVER['CONTENT_TYPE'] ?? ''); }
    catch (\DomainException) { return result(400, 'The recording contains unexpected or duplicate fields.'); }
    catch (\Throwable) { return result(400, 'Could not read the recording.'); }
    [$status, $note] = validate($fields);
    if ($status !== 0) return [$status, $note];
    ignore_user_abort(true);
    // Apache's connection address is authoritative; arbitrary forwarded headers are not.
    return save($note, $secret, $_SERVER['REMOTE_ADDR'] ?? 'unknown', provider());
}
