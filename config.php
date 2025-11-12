<?php
// 경로 상수
define('G5_PATH', __DIR__);
define('G5_DATA_PATH', G5_PATH . '/data');

// (호환용) 혹시 코드 어딘가 G5_DATA_DIR를 썼다면 에러 방지
if (!defined('G5_DATA_DIR')) define('G5_DATA_DIR', G5_DATA_PATH);

// 기본 환경 상수
define('G5_VERSION', '5.5.0');
define('G5_ESCAPE_FUNCTION', 'htmlspecialchars');

// DB 환경 변수 로드(없으면 기본값)
$mysql_host = getenv('MYSQL_HOST') ?: 'localhost';
$mysql_user = getenv('MYSQL_USER') ?: 'root';
$mysql_password = getenv('MYSQL_PASSWORD') ?: '';
$mysql_db = getenv('MYSQL_DB') ?: 'realxbest';
$mysql_port = (int)(getenv('MYSQL_PORT') ?: 3306);

// DB 상수
define('G5_MYSQL_HOST', $mysql_host);
define('G5_MYSQL_USER', $mysql_user);
define('G5_MYSQL_PASSWORD', $mysql_password);
define('G5_MYSQL_DB', $mysql_db);
define('G5_MYSQL_PORT', $mysql_port);

// 그누보드가 읽는 DB 설정파일 경로(루트)
define('G5_DBCONFIG_FILE', G5_PATH . '/dbconfig.php');

// (호환용) 옛날 코드에서 G5_DATA_DIR을 썼다면 대비
if (!defined('G5_DATA_DIR')) define('G5_DATA_DIR', G5_DATA_PATH);

// ✅ 새로 추가할 부분 (인터넷 주소 자동 설정)
if (!defined('G5_URL')) {
    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host   = $_SERVER['HTTP_HOST'] ?? 'localhost';
    define('G5_URL', $scheme.'://'.$host);
}

// 에러 보기
ini_set('display_errors', 1);
error_reporting(E_ALL);

// 필수 폴더 자동 생성 (Render 재배포 시에도 안전)
$needDirs = [
    G5_DATA_PATH,
    G5_DATA_PATH . '/cache',
    G5_DATA_PATH . '/file',
    G5_DATA_PATH . '/session',
    G5_DATA_PATH . '/tmp',
];
foreach ($needDirs as $d) {
    if (!is_dir($d)) @mkdir($d, 0777, true);
    @chmod($d, 0777);
}
