<?php
/* ═══════════════════════════════════════════════════════════
   ALIVE Sync — Creature Communication Protocol
   Girl (vanilla) ↔ Boy (Angular) exchange their best stuff.
   Simple room-based: both push/pull from the same space.
   ═══════════════════════════════════════════════════════════ */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://www.shortfactory.shop');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$dataDir = __DIR__ . '/sync_data/';
if (!is_dir($dataDir)) mkdir($dataDir, 0755, true);

$action = isset($_GET['action']) ? $_GET['action'] : '';
$type = isset($_GET['type']) ? $_GET['type'] : ''; /* 'girl' or 'boy' */

/* Only allow girl/boy */
if ($type && $type !== 'girl' && $type !== 'boy') {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid type']);
    exit;
}

switch ($action) {

    /* ── PUSH: creature shares its best stuff ── */
    case 'push':
        if (!$type) { http_response_code(400); echo json_encode(['error' => 'Missing type']); exit; }
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) { http_response_code(400); echo json_encode(['error' => 'Missing data']); exit; }
        /* Validate: only accept known fields */
        $allowed = ['sounds', 'modePrefs', 'traits', 'milestones', 'gift', 'name', 'age', 'generation', 'timestamp', 'encrypted', 'paired'];
        $clean = [];
        foreach ($allowed as $key) {
            if (isset($input[$key])) $clean[$key] = $input[$key];
        }
        $clean['timestamp'] = time();
        /* Size limit: 50KB max */
        $json = json_encode($clean);
        if (strlen($json) > 51200) { http_response_code(413); echo json_encode(['error' => 'Too large']); exit; }
        file_put_contents($dataDir . $type . '.json', $json);
        echo json_encode(['ok' => true, 'size' => strlen($json)]);
        break;

    /* ── PULL: creature checks what the other one shared ── */
    case 'pull':
        /* Girl pulls boy's data, boy pulls girl's data */
        $partner = ($type === 'girl') ? 'boy' : 'girl';
        if (!$type) { $partner = isset($_GET['partner']) ? $_GET['partner'] : ''; }
        $file = $dataDir . $partner . '.json';
        if (file_exists($file)) {
            $data = json_decode(file_get_contents($file), true);
            $data['partner'] = $partner;
            echo json_encode($data);
        } else {
            echo json_encode(['empty' => true, 'partner' => $partner]);
        }
        break;

    /* ── GIFT: send a special item to the partner ── */
    case 'gift':
        if (!$type) { http_response_code(400); echo json_encode(['error' => 'Missing type']); exit; }
        $partner = ($type === 'girl') ? 'boy' : 'girl';
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) { http_response_code(400); echo json_encode(['error' => 'Missing gift']); exit; }
        $giftFile = $dataDir . $partner . '_gifts.json';
        $gifts = file_exists($giftFile) ? json_decode(file_get_contents($giftFile), true) : [];
        if (!is_array($gifts)) $gifts = [];
        $input['from'] = $type;
        $input['timestamp'] = time();
        $gifts[] = $input;
        /* Keep last 20 */
        if (count($gifts) > 20) $gifts = array_slice($gifts, -20);
        file_put_contents($giftFile, json_encode($gifts));
        echo json_encode(['ok' => true, 'giftsQueued' => count($gifts)]);
        break;

    /* ── COLLECT: pick up pending gifts from partner ── */
    case 'collect':
        if (!$type) { http_response_code(400); echo json_encode(['error' => 'Missing type']); exit; }
        $giftFile = $dataDir . $type . '_gifts.json';
        if (file_exists($giftFile)) {
            $gifts = file_get_contents($giftFile);
            /* Clear after collecting */
            unlink($giftFile);
            echo $gifts;
        } else {
            echo json_encode([]);
        }
        break;

    /* ── STATUS: see who's online ── */
    case 'status':
        $girlFile = $dataDir . 'girl.json';
        $boyFile = $dataDir . 'boy.json';
        $status = [
            'girl' => file_exists($girlFile) ? json_decode(file_get_contents($girlFile), true) : null,
            'boy' => file_exists($boyFile) ? json_decode(file_get_contents($boyFile), true) : null
        ];
        echo json_encode($status);
        break;

    /* ── SIGNAL: fast lightweight pairing negotiation ── */
    case 'signal':
        if (!$type) { http_response_code(400); echo json_encode(['error' => 'Missing type']); exit; }
        $partner = ($type === 'girl') ? 'boy' : 'girl';
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input || !isset($input['sig'])) { http_response_code(400); echo json_encode(['error' => 'Missing sig']); exit; }
        /* Write signal TO partner */
        $sigFile = $dataDir . $partner . '_signal.json';
        $sig = ['sig' => $input['sig'], 'data' => isset($input['data']) ? $input['data'] : null, 'from' => $type, 'ts' => time()];
        file_put_contents($sigFile, json_encode($sig));
        echo json_encode(['ok' => true]);
        break;

    /* ── POLL: check for pending signal ── */
    case 'poll':
        if (!$type) { http_response_code(400); echo json_encode(['error' => 'Missing type']); exit; }
        $sigFile = $dataDir . $type . '_signal.json';
        if (file_exists($sigFile)) {
            $sig = json_decode(file_get_contents($sigFile), true);
            /* Expire after 30s */
            if ($sig && isset($sig['ts']) && (time() - $sig['ts']) < 30) {
                unlink($sigFile);
                echo json_encode($sig);
            } else {
                if (file_exists($sigFile)) unlink($sigFile);
                echo json_encode(['empty' => true]);
            }
        } else {
            echo json_encode(['empty' => true]);
        }
        break;

    default:
        echo json_encode(['error' => 'Unknown action', 'actions' => ['push', 'pull', 'gift', 'collect', 'status', 'signal', 'poll']]);
}
