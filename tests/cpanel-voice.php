<?php
declare(strict_types=1);
require __DIR__ . '/../deploy/cpanel/voice.php';

$passed = 0;
function check(bool $condition, string $label): void {
    global $passed;
    if (!$condition) throw new RuntimeException('FAIL: ' . $label);
    $passed++;
    echo 'PASS: ' . $label . "\n";
}
function form(array $parts): string {
    $body = '';
    foreach ($parts as [$name, $value, $mime]) {
        $body .= "--fixture\r\nContent-Disposition: form-data; name=\"$name\"";
        if ($mime !== null) $body .= "; filename=\"note.webm\"\r\nContent-Type: $mime";
        $body .= "\r\n\r\n$value\r\n";
    }
    return $body . '--fixture--';
}
$audio = "\x1a\x45\xdf\xa3" . str_repeat('a', 240);
$parts = [['name', 'Internal QA', null], ['brand', 'Synthetic', null], ['duration', '2', null],
    ['consent', 'yes', null], ['website', '', null], ['recording', $audio, 'audio/webm;codecs=opus']];
$type = 'multipart/form-data; boundary=fixture';
$fields = AparVoice\multipart(form($parts), $type);
[$status, $note] = AparVoice\validate($fields);
check($status === 0 && $note['bytes'] === $audio && $note['mime'] === 'audio/webm', 'valid raw multipart retains exact audio');
check(AparVoice\originAllowed('https://apar.agency') && AparVoice\originAllowed(null), 'main origin and non-browser requests allowed');
foreach (['https://apar.agency.evil.test', 'https://user@apar.agency', 'http://apar.agency', 'https://apar.agency/path', 'null'] as $origin) {
    check(!AparVoice\originAllowed($origin), 'reject origin ' . $origin);
}
foreach ([
    [...$parts, ['name', 'Duplicate', null]],
    [...$parts, ['unexpected', 'value', null]],
    [['name', 'File masquerading as text', 'text/plain'], ...array_slice($parts, 1)],
    [...array_slice($parts, 0, 5), ['recording', $audio, null]],
] as $invalid) {
    try { AparVoice\multipart(form($invalid), $type); $rejected = false; }
    catch (Throwable) { $rejected = true; }
    check($rejected, 'reject duplicate, unknown or file-valued field');
}
foreach ([substr(form($parts), 0, -2), form($parts) . 'extra', str_replace('Content-Type: audio', 'Other: audio', form($parts))] as $body) {
    try { AparVoice\multipart($body, $type); $rejected = false; }
    catch (Throwable) { $rejected = true; }
    check($rejected, 'reject malformed multipart framing');
}
try { AparVoice\multipart(str_repeat('x', AparVoice\MAX_REQUEST + 1), $type); $rejected = false; }
catch (LengthException) { $rejected = true; }
check($rejected, 'reject body exceeding bounded overhead');
foreach ([['name', 'a'], ['name', str_repeat('a', 81)], ['brand', str_repeat('b', 81)], ['duration', 'INF'], ['duration', '61'], ['consent', 'no']] as [$key, $value]) {
    $invalid = $fields; $invalid[$key] = $value;
    check(AparVoice\validate($invalid)[0] === 400, 'reject invalid ' . $key);
}
$invalid = $fields; $invalid['website'] = '0';
check(AparVoice\validate($invalid)[0] === 202, 'honeypot treats string zero as nonempty');
$invalid = $fields; $invalid['recording']['bytes'] = 'not audio' . str_repeat('x', 200);
check(AparVoice\validate($invalid)[0] === 400, 'reject misleading audio signature');
$invalid = $fields; $invalid['recording']['mime'] = 'constructor';
check(AparVoice\validate($invalid)[0] === 400, 'reject unsupported MIME');
$large = $fields; $large['recording']['bytes'] = "\x1a\x45\xdf\xa3" . str_repeat('x', AparVoice\MAX_BYTES - 4);
check(AparVoice\validate($large)[0] === 0, 'accept exactly 4 MiB recording');
$large['recording']['bytes'] .= 'x';
check(AparVoice\validate($large)[0] === 400, 'reject recording above 4 MiB');
check(AparVoice\utf16Length('😀') === 2, 'name limit matches browser UTF-16 units');

function reply(int $status, mixed $data = null): array { return ['ok' => $status >= 200 && $status < 300, 'status' => $status, 'data' => $data]; }
function runSave(array $responses, array $note): array {
    $calls = [];
    $provider = static function ($url, $method, $headers, $body, $budget) use (&$calls, &$responses) {
        $calls[] = compact('url', 'method', 'headers', 'body', 'budget');
        if ($responses === []) throw new RuntimeException('Unexpected provider call');
        $r = array_shift($responses);
        if ($r instanceof Throwable) throw $r;
        return is_callable($r) ? $r($calls) : $r;
    };
    $result = AparVoice\save($note, 'sb_secret_TEST_ONLY_NOT_REAL', '192.0.2.1', $provider);
    return [$result, $calls];
}
$present = static function (array $calls): array {
    $row = json_decode($calls[2]['body'], true);
    return reply(200, [['id' => $row['id'], 'storage_path' => $row['storage_path']]]);
};
[$r, $calls] = runSave([reply(200, true), reply(200), reply(201)], $note);
check($r[0] === 201 && count($calls) === 3, 'success requires rate reservation, object upload and metadata');
check($calls[1]['headers']['x-upsert'] === 'false' && !str_contains($calls[0]['body'], '192.0.2.1'), 'private object never overwrites and IP is hashed');
check(preg_match('/^[a-f0-9-]{36}$/', $r[1]['id']) === 1, 'success includes opaque submission ID');
[$r, $calls] = runSave([reply(200, false)], $note);
check($r[0] === 429 && count($calls) === 1, 'throttled request does not upload');
[$r, $calls] = runSave([reply(500)], $note);
check($r[0] === 503 && count($calls) === 1, 'rate-limit outage fails closed');
[$r, $calls] = runSave([reply(200, true), new RuntimeException('timeout')], $note);
check($r[0] === 502 && $r[1]['error'] === AparVoice\UNCERTAIN && count($calls) === 2, 'upload timeout reports uncertainty');
[$r, $calls] = runSave([reply(200, true), reply(200), new RuntimeException('lost response'), $present], $note);
check($r[0] === 201 && count($calls) === 4, 'lost insert response reconciles existing row');
[$r, $calls] = runSave([reply(200, true), reply(200), reply(403, ['code' => '42501']), reply(200, []), reply(200)], $note);
check($r[0] === 502 && $calls[4]['method'] === 'DELETE', 'explicit rollback and absent row permits private object cleanup');
foreach ([reply(500), reply(409, ['code' => '23505']), new RuntimeException('timeout')] as $failure) {
    [$r, $calls] = runSave([reply(200, true), reply(200), $failure, reply(200, []), reply(201), $present], $note);
    check($r[0] === 201 && $calls[4]['body'] === $calls[2]['body'] && $calls[4]['headers']['Prefer'] === 'resolution=ignore-duplicates,return=minimal', 'ambiguous insert retries same ID without overwrite');
    check(!in_array('DELETE', array_column($calls, 'method'), true), 'ambiguous insert never deletes potentially committed audio');
}
[$r, $calls] = runSave([reply(200, true), reply(200), reply(500), reply(200, []), reply(500), reply(200, [])], $note);
check($r[0] === 502 && $r[1]['error'] === AparVoice\UNCERTAIN && !in_array('DELETE', array_column($calls, 'method'), true), 'unresolved save retains private audio and reports uncertainty');
echo "$passed cPanel adapter checks passed.\n";
