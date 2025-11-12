<?php
/**********************************************************
 * Gnuboard Render 배포용 config.php (완성본)
 * - 경로/URL 상수
 * - ENV → DB 상수
 * - 설치용 /data 폴더 자동 생성+권한
 **********************************************************/

// 1) 기본 경로 상수
define('G5_PATH', __DIR__);
define('G5_DATA_PATH', G5_PATH . '/data');

// (호환) 예전 코드에서 G5_DATA_DIR 사용 시 대비
if (!defined('G5_DATA_DIR')) define('G5_DATA_DIR', G5_DATA_PATH);

// 2) URL 상수 (설치 전에도 필요)
if (!defined('G5_URL')) {
    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host   = $_SERVER['HTTP_HOST'] ?? 'localhost';
    define('G5_URL', $scheme . '://' . $host);
}

// 3) 기본 환경 상수
define('G5_VERSION', '5.5.0');
define('G5_ESCAPE_FUNCTION', 'htmlspecialchars');

// 4) Render ENV → DB 상수 (없으면 기본값)
$mysql_host = getenv('MYSQL_HOST') ?: 'localhost';
$mysql_user = getenv('MYSQL_USER') ?: 'root';
$mysql_password = getenv('MYSQL_PASSWORD') ?: '';
$mysql_db = getenv('MYSQL_DB') ?: 'realxbest';
$mysql_port = (int)(getenv('MYSQL_PORT') ?: 3306);

define('G5_MYSQL_HOST', $mysql_host);
define('G5_MYSQL_USER', $mysql_user);
define('G5_MYSQL_PASSWORD', $mysql_password);
define('G5_MYSQL_DB', $mysql_db);
define('G5_MYSQL_PORT', $mysql_port);

// 5) ★가장 중요★ 설치가 /data/dbconfig.php 를 만들도록 정의
//    (여기 "파일명"만 정의해야 함. 절대경로를 넣으면 경로가 두 번 붙어 망가집니다)
define('G5_DBCONFIG_FILE', 'dbconfig.php');

// 6) 에러 보기
ini_set('display_errors', 1);
error_reporting(E_ALL);

// 7) 설치/실행에 필요한 /data 하위 폴더들을 자동 생성 + 권한 부여
$needDirs = [
    G5_DATA_PATH,
    G5_DATA_PATH . '/cache',
    G5_DATA_PATH . '/file',
    G5_DATA_PATH . '/session',
    G5_DATA_PATH . '/tmp',
];
foreach ($needDirs as $d) {
    if (!is_dir($d)) { @mkdir($d, 0777, true); }
    @chmod($d, 0777);
    @file_put_contents($d . '/.perm_test', 'ok'); // 쓰기 테스트
}
