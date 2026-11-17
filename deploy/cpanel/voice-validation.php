<?php
declare(strict_types=1);
namespace AparVoice;

const MAX_BYTES = 4194304;
const MAX_REQUEST = MAX_BYTES + 64000;

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

// Fallback for hosts configured to leave multipart bodies unparsed.
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
