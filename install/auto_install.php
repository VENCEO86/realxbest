<?php
// 자동 설치 스크립트
$_POST['mysql_host'] = 'db';
$_POST['mysql_user'] = 'gnuboard';
$_POST['mysql_pass'] = 'gnuboard1234';
$_POST['mysql_db'] = 'gnuboard';
$_POST['table_prefix'] = 'g5_';
$_POST['admin_id'] = 'admin';
$_POST['admin_pass'] = 'admin1234';
$_POST['admin_name'] = 'venceo';
$_POST['admin_email'] = 'admin@domain.com';

include_once('install_db.php');
?>




