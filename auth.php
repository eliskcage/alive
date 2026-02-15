<?php
/* ═══════════════════════════════════════════════════════════
   ALIVE Auth — WebAuthn Registration + Login
   Biometric security for the creature.
   Credentials stored in auth_data/credentials.json.
   Credentials seeded on first run (configure your own below).
   ═══════════════════════════════════════════════════════════ */
header('Content-Type: application/json');
session_start();

$DATA_DIR = __DIR__ . '/auth_data/';
$CRED_FILE = $DATA_DIR . 'credentials.json';
$RP_ID = 'localhost'; /* Change to your domain */
$RP_NAME = 'ALIVE';

function base64url_encode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}
function base64url_decode($b64u) {
    $b64 = strtr($b64u, '-_', '+/');
    $pad = strlen($b64) % 4;
    if ($pad) $b64 .= str_repeat('=', 4 - $pad);
    return base64_decode($b64);
}

function publicKeyPemFromBase64($b64_or_b64url) {
    $b64 = strtr($b64_or_b64url, '-_', '+/');
    $pad = strlen($b64) % 4;
    if ($pad) $b64 .= str_repeat('=', 4 - $pad);
    $der = base64_decode($b64);
    if ($der === false) return null;
    return "-----BEGIN PUBLIC KEY-----\n" .
           chunk_split(base64_encode($der), 64, "\n") .
           "-----END PUBLIC KEY-----\n";
}

function loadCredentials() {
    global $CRED_FILE, $DATA_DIR;
    if (!file_exists($CRED_FILE)) {
        /* No seed credentials — first user to register becomes the owner */
        $seed = [];
        saveCredentials($seed);
        return $seed;
    }
    $data = json_decode(file_get_contents($CRED_FILE), true);
    return is_array($data) ? $data : [];
}

function saveCredentials($creds) {
    global $CRED_FILE, $DATA_DIR;
    if (!is_dir($DATA_DIR)) mkdir($DATA_DIR, 0755, true);
    file_put_contents($CRED_FILE, json_encode($creds, JSON_PRETTY_PRINT));
}

$op = isset($_GET['op']) ? $_GET['op'] : null;

switch ($op) {

    /* ── CHECK: any registered credentials? ── */
    case 'check':
        $creds = loadCredentials();
        echo json_encode(['hasUsers' => count($creds) > 0, 'count' => count($creds)]);
        break;

    /* ── STATUS: is session authenticated? ── */
    case 'status':
        echo json_encode([
            'authenticated' => !empty($_SESSION['alive_authenticated']),
            'user' => isset($_SESSION['alive_user']) ? $_SESSION['alive_user'] : null
        ]);
        break;

    /* ── REGISTER OPTIONS (GET) ── */
    case 'register-options':
        $challenge = random_bytes(32);
        $_SESSION['webauthn_challenge'] = base64url_encode($challenge);
        $_SESSION['webauthn_challenge_ts'] = time();
        $_SESSION['webauthn_op'] = 'register';

        $userId = random_bytes(16);
        $_SESSION['webauthn_user_id'] = base64url_encode($userId);

        $existingCreds = loadCredentials();
        $excludeCreds = [];
        foreach ($existingCreds as $c) {
            $excludeCreds[] = ['type' => 'public-key', 'id' => $c['id']];
        }

        echo json_encode([
            'challenge' => $_SESSION['webauthn_challenge'],
            'rp' => ['name' => $RP_NAME, 'id' => $RP_ID],
            'user' => [
                'id' => $_SESSION['webauthn_user_id'],
                'name' => 'alive-user',
                'displayName' => 'ALIVE User'
            ],
            'pubKeyCredParams' => [
                ['type' => 'public-key', 'alg' => -7],
                ['type' => 'public-key', 'alg' => -257]
            ],
            'authenticatorSelection' => [
                'authenticatorAttachment' => 'platform',
                'userVerification' => 'required',
                'residentKey' => 'preferred'
            ],
            'timeout' => 60000,
            'excludeCredentials' => $excludeCreds,
            'attestation' => 'none'
        ]);
        break;

    /* ── REGISTER (POST) — store new credential ── */
    case 'register':
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);
        if (!$data) { echo json_encode(['error' => 'Invalid JSON']); exit; }

        $expectedChallenge = isset($_SESSION['webauthn_challenge']) ? $_SESSION['webauthn_challenge'] : null;
        $expectedOp = isset($_SESSION['webauthn_op']) ? $_SESSION['webauthn_op'] : null;
        if (!$expectedChallenge || $expectedOp !== 'register') {
            echo json_encode(['error' => 'No registration challenge in session']);
            exit;
        }

        /* Verify clientDataJSON */
        $clientDataJSON = base64url_decode(isset($data['clientDataJSON']) ? $data['clientDataJSON'] : '');
        $clientData = json_decode($clientDataJSON, true);
        if (!$clientData || !hash_equals($expectedChallenge, isset($clientData['challenge']) ? $clientData['challenge'] : '')) {
            echo json_encode(['error' => 'Challenge mismatch']);
            exit;
        }
        if ((isset($clientData['type']) ? $clientData['type'] : '') !== 'webauthn.create') {
            echo json_encode(['error' => 'Wrong ceremony type']);
            exit;
        }

        /* Store credential */
        $credId = isset($data['id']) ? $data['id'] : null;
        $publicKey = isset($data['publicKey']) ? $data['publicKey'] : null;
        if (!$credId || !$publicKey) {
            echo json_encode(['error' => 'Missing credential data']);
            exit;
        }

        /* Size sanity check */
        if (strlen($credId) > 500 || strlen($publicKey) > 500) {
            echo json_encode(['error' => 'Credential too large']);
            exit;
        }

        $creds = loadCredentials();

        /* Check duplicate */
        foreach ($creds as $c) {
            if ($c['id'] === $credId) {
                echo json_encode(['error' => 'Credential already registered']);
                exit;
            }
        }

        /* Max 50 credentials */
        if (count($creds) >= 50) {
            echo json_encode(['error' => 'Too many registered devices']);
            exit;
        }

        $creds[] = [
            'id' => $credId,
            'publicKey' => $publicKey,
            'userId' => isset($_SESSION['webauthn_user_id']) ? $_SESSION['webauthn_user_id'] : base64url_encode(random_bytes(16)),
            'created' => time()
        ];
        saveCredentials($creds);

        /* Auto-login after registration */
        $_SESSION['alive_authenticated'] = true;
        $_SESSION['alive_user'] = $credId;
        $_SESSION['alive_login_time'] = time();
        unset($_SESSION['webauthn_challenge'], $_SESSION['webauthn_op']);

        echo json_encode(['success' => true, 'message' => 'Registered']);
        break;

    /* ── LOGIN OPTIONS (GET) ── */
    case 'login-options':
        $creds = loadCredentials();
        if (empty($creds)) {
            echo json_encode(['error' => true, 'message' => 'No registered users', 'needsRegister' => true]);
            exit;
        }

        $challenge = random_bytes(32);
        $_SESSION['webauthn_challenge'] = base64url_encode($challenge);
        $_SESSION['webauthn_challenge_ts'] = time();
        $_SESSION['webauthn_op'] = 'login';

        $allowCreds = [];
        foreach ($creds as $c) {
            $allowCreds[] = ['type' => 'public-key', 'id' => $c['id']];
        }

        echo json_encode([
            'challenge' => $_SESSION['webauthn_challenge'],
            'timeout' => 60000,
            'rpId' => $RP_ID,
            'userVerification' => 'preferred',
            'allowCredentials' => $allowCreds
        ]);
        break;

    /* ── LOGIN (POST) — verify assertion ── */
    case 'login':
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);
        if (!$data) { echo json_encode(['error' => 'Invalid JSON']); exit; }

        $expectedChallenge = isset($_SESSION['webauthn_challenge']) ? $_SESSION['webauthn_challenge'] : null;
        if (!$expectedChallenge) {
            echo json_encode(['success' => false, 'error' => 'No challenge in session']);
            exit;
        }

        $id = isset($data['id']) ? $data['id'] : (isset($data['rawId']) ? $data['rawId'] : null);
        $response = isset($data['response']) ? $data['response'] : null;
        if (!$id || !$response) {
            echo json_encode(['success' => false, 'error' => 'Malformed assertion']);
            exit;
        }

        /* Find credential */
        $creds = loadCredentials();
        $cred = null;
        foreach ($creds as $c) {
            if ($c['id'] === $id) { $cred = $c; break; }
        }
        if (!$cred) {
            echo json_encode(['success' => false, 'error' => 'Unknown credential']);
            exit;
        }

        /* Decode assertion */
        $clientDataJSON = base64url_decode(isset($response['clientDataJSON']) ? $response['clientDataJSON'] : '');
        $authenticatorData = base64url_decode(isset($response['authenticatorData']) ? $response['authenticatorData'] : '');
        $signature = base64url_decode(isset($response['signature']) ? $response['signature'] : '');

        if (!$clientDataJSON || !$authenticatorData || !$signature) {
            echo json_encode(['success' => false, 'error' => 'Missing assertion fields']);
            exit;
        }

        /* Verify challenge */
        $clientData = json_decode($clientDataJSON, true);
        if (!$clientData || !hash_equals($expectedChallenge, isset($clientData['challenge']) ? $clientData['challenge'] : '')) {
            echo json_encode(['success' => false, 'error' => 'Challenge mismatch']);
            exit;
        }

        /* Verify RP ID hash */
        if (strlen($authenticatorData) < 37) {
            echo json_encode(['success' => false, 'error' => 'authenticatorData too short']);
            exit;
        }
        $rpIdHash = substr($authenticatorData, 0, 32);
        if (!hash_equals(hash('sha256', $RP_ID, true), $rpIdHash)) {
            echo json_encode(['success' => false, 'error' => 'RP ID hash mismatch']);
            exit;
        }

        /* Verify signature */
        $clientDataHash = hash('sha256', $clientDataJSON, true);
        $signedData = $authenticatorData . $clientDataHash;
        $pem = publicKeyPemFromBase64($cred['publicKey']);

        $ok = openssl_verify($signedData, $signature, $pem, OPENSSL_ALGO_SHA256);
        if ($ok === 1) {
            $_SESSION['alive_authenticated'] = true;
            $_SESSION['alive_user'] = $cred['id'];
            $_SESSION['alive_login_time'] = time();
            unset($_SESSION['webauthn_challenge'], $_SESSION['webauthn_op']);
            echo json_encode(['success' => true]);
        } elseif ($ok === 0) {
            echo json_encode(['success' => false, 'error' => 'Signature verification failed']);
        } else {
            echo json_encode(['success' => false, 'error' => 'OpenSSL error: ' . openssl_error_string()]);
        }
        break;

    default:
        echo json_encode(['error' => 'Unknown op', 'ops' => ['check', 'status', 'register-options', 'register', 'login-options', 'login']]);
}
