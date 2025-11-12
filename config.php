<?php
define('G5_PATH', __DIR__);
define('G5_DATA_PATH', G5_PATH . '/data');

// -------------------------------------------------
// 기본 환경 상수 정의
define('G5_VERSION', '5.5.0');
define('G5_ESCAPE_FUNCTION', 'htmlspecialchars');

// -------------------------------------------------
// DB 환경 변수 로드
$mysql_host = getenv('MYSQL_HOST') ?: 'localhost';
$mysql_user = getenv('MYSQL_USER') ?: 'root';
$mysql_password = getenv('MYSQL_PASSWORD') ?: '';
$mysql_db = getenv('MYSQL_DB') ?: 'realxbest';
$mysql_port = getenv('MYSQL_PORT') ?: 3306;

// -------------------------------------------------
// DB 상수 정의
define('G5_MYSQL_HOST', $mysql_host);
define('G5_MYSQL_USER', $mysql_user);
define('G5_MYSQL_PASSWORD', $mysql_password);
define('G5_MYSQL_DB', $mysql_db);
define('G5_MYSQL_PORT', (int)$mysql_port);

// -------------------------------------------------
// 오류 표시 설정 (Render용)
ini_set('display_errors', 1);
error_reporting(E_ALL);

// -------------------------------------------------
// PHP 내부 인코딩 설정
if (function_exists('mb_internal_encoding')) {
    mb_internal_encoding('UTF-8');
}
