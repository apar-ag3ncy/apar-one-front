<?php
declare(strict_types=1);
require __DIR__ . '/../deploy/cpanel/voice-local.php';
$passed = 0;
function check(bool $condition, string $label): void {
    global $passed;
    if (!$condition) throw new RuntimeException('FAIL: ' . $label);
    $passed++; echo 'PASS: ' . $label . "\n";
}
$root = sys_get_temp_dir() . '/apar-voice-unit-' . bin2hex(random_bytes(6));
mkdir($root, 0700); mkdir($root . '/public', 0700);
function removeFixture(string $path): void {
    if (is_dir($path) && !is_link($path)) { foreach (scandir($path) as $item) if ($item !== '.' && $item !== '..') removeFixture($path . '/' . $item); rmdir($path); }
    else unlink($path);
}
try {
    $audio = "\x1a\x45\xdf\xa3" . str_repeat('a', 300);
    $post = ['name' => 'Internal QA', 'brand' => 'Synthetic', 'duration' => '2', 'consent' => 'yes', 'website' => ''];
    file_put_contents($root . '/upload.tmp', $audio);
    $files = ['recording' => ['error' => UPLOAD_ERR_OK, 'type' => 'audio/webm;codecs=opus', 'tmp_name' => $root . '/upload.tmp']];
    $fields = AparVoice\uploadedFields($post, $files, fn($path) => $path === $root . '/upload.tmp');
    [$status, $note] = AparVoice\validate($fields);
    check($status === 0 && $note['bytes'] === $audio, 'native multipart adapter retains the exact recording');
    foreach ([[$post + ['extra' => 'x'], $files], [array_replace($post, ['name' => ['bad']]), $files], [$post, ['recording' => ['error' => [0]]]], [$post, $files + ['other' => []]] ] as [$p, $f]) {
        try { AparVoice\uploadedFields($p, $f, fn() => true); $rejected = false; } catch (InvalidArgumentException) { $rejected = true; }
        check($rejected, 'native upload rejects unexpected fields and array injection');
    }
    try { AparVoice\uploadedFields($post, $files); $rejected = false; } catch (InvalidArgumentException) { $rejected = true; }
    check($rejected, 'production adapter refuses a non-uploaded local file');
    $large = $files; $large['recording']['error'] = UPLOAD_ERR_INI_SIZE;
    try { AparVoice\uploadedFields($post, $large); $rejected = false; } catch (LengthException) { $rejected = true; }
    check($rejected, 'server upload limit produces a size error');
    [$status, $reply] = AparVoice\saveLocal($note, $root . '/private', $root . '/public', '192.0.2.1', 1800000000);
    check($status === 201 && $reply['ok'], 'submission is acknowledged after private atomic save');
    $day = gmdate('Y-m-d', 1800000000);
    $saved = $root . '/private/' . $day . '/' . $reply['id'];
    check(file_get_contents($saved . '/recording.webm') === $audio, 'stored bytes match the upload');
    $metadata = json_decode(file_get_contents($saved . '/note.json'), true, 16, JSON_THROW_ON_ERROR);
    check($metadata['name'] === 'Internal QA' && $metadata['sha256'] === hash('sha256', $audio), 'metadata matches the stored audio');
    check((fileperms($saved) & 0777) === 0700 && (fileperms($saved . '/note.json') & 0777) === 0600 && (fileperms($saved . '/recording.webm') & 0777) === 0600, 'private directories and files have restricted permissions');
    check(glob($root . '/public/*') === [] && glob($root . '/private/' . $day . '/.pending-*') === [], 'no public or incomplete recordings remain');
    check(!str_contains(file_get_contents($root . '/private/.limits.json'), '192.0.2.1'), 'abuse limiter stores hashed addresses only');
    check(AparVoice\saveLocal($note, $root . '/private', $root . '/public', '192.0.2.1', 1800000001)[0] === 201, 'second note accepted');
    check(AparVoice\saveLocal($note, $root . '/private', $root . '/public', '192.0.2.1', 1800000002)[0] === 201, 'third note accepted');
    check(AparVoice\saveLocal($note, $root . '/private', $root . '/public', '192.0.2.1', 1800000003)[0] === 429, 'fourth note is rate limited');
    check(count(glob($root . '/private/' . $day . '/*/note.json')) === 3, 'rate-limited notes are not stored');
    check(AparVoice\saveLocal($note, $root . '/private', $root . '/public', '192.0.2.2', 1800000003)[0] === 201, 'another visitor has a separate limit');
    check(AparVoice\saveLocal($note, $root . '/private', $root . '/public', '192.0.2.1', 1800003603)[0] === 201, 'hourly limit expires');
    check(AparVoice\saveLocal($note, $root . '/public/unsafe', $root . '/public', '192.0.2.1')[0] === 503, 'storage inside public root fails closed');
    check(glob($root . '/public/unsafe/*') === [], 'rejected public storage contains no audio');
    mkdir($root . '/quota', 0700); $quota = fopen($root . '/quota/fixture.bin', 'wb'); ftruncate($quota, AparVoice\STORAGE_LIMIT); fclose($quota);
    check(AparVoice\saveLocal($note, $root . '/quota', $root . '/public', '192.0.2.1')[0] === 503, 'storage quota stops new writes');
    file_put_contents($root . '/private/.limits.json', '{bad json');
    check(AparVoice\saveLocal($note, $root . '/private', $root . '/public', '192.0.2.1')[0] === 503, 'damaged limiter fails closed');
    symlink($root . '/public', $root . '/linked');
    check(AparVoice\saveLocal($note, $root . '/linked', $root . '/public', '192.0.2.1')[0] === 503, 'symlinked storage is rejected');
    echo "$passed local-storage checks passed.\n";
} finally { removeFixture($root); }
