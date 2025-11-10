<?php
header('Content-Type: text/html; charset=utf-8');
mb_internal_encoding('UTF-8');

include_once('./_common.php');
?>
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<title>UTF-8 확인</title>
<style>
body { font-family: 'Malgun Gothic', Arial, sans-serif; padding: 20px; background: #f5f5f5; }
.box { background: white; padding: 20px; margin: 10px 0; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
h2 { color: #333; border-bottom: 2px solid #2196F3; padding-bottom: 10px; }
table { width: 100%; border-collapse: collapse; margin: 10px 0; }
th, td { padding: 10px; text-align: left; border: 1px solid #ddd; }
th { background: #f5f5f5; font-weight: bold; }
.ok { color: green; font-weight: bold; }
.error { color: red; font-weight: bold; }
</style>
</head>
<body>
<h1>✅ UTF-8 인코딩 최종 확인</h1>

<div class="box">
<h2>1. admin 사용자 정보</h2>
<table>
<tr><th>항목</th><th>값</th><th>상태</th></tr>
<?php
$mb = sql_fetch("SELECT mb_id, mb_name, mb_nick FROM {$g5['member_table']} WHERE mb_id='admin'");
echo "<tr><td>아이디</td><td>{$mb['mb_id']}</td><td class='ok'>OK</td></tr>";
echo "<tr><td>이름</td><td>{$mb['mb_name']}</td><td class='" . (mb_check_encoding($mb['mb_name'], 'UTF-8') ? 'ok'>OK' : 'error'>ERROR') . "</td></tr>";
echo "<tr><td>닉네임</td><td>{$mb['mb_nick']}</td><td class='" . (mb_check_encoding($mb['mb_nick'], 'UTF-8') ? 'ok'>OK' : 'error'>ERROR') . "</td></tr>";
?>
</table>
</div>

<div class="box">
<h2>2. 사이트 설정</h2>
<table>
<tr><th>항목</th><th>값</th></tr>
<?php
$cfg = sql_fetch("SELECT cf_title, cf_admin FROM {$g5['config_table']}");
echo "<tr><td>사이트 제목</td><td>{$cfg['cf_title']}</td></tr>";
echo "<tr><td>관리자</td><td>{$cfg['cf_admin']}</td></tr>";
?>
</table>
</div>

<div class="box">
<h2>3. 게시판 목록</h2>
<table>
<tr><th>게시판 ID</th><th>게시판 제목</th><th>게시글 수</th></tr>
<?php
$boards = sql_query("SELECT bo_table, bo_subject, bo_count_write FROM {$g5['board_table']} ORDER BY bo_table");
while ($board = sql_fetch_array($boards)) {
    echo "<tr><td>{$board['bo_table']}</td><td>{$board['bo_subject']}</td><td>{$board['bo_count_write']}</td></tr>";
}
?>
</table>
</div>

<div class="box">
<h2>4. 갤러리 최근 게시글</h2>
<table>
<tr><th>ID</th><th>제목</th><th>작성자</th></tr>
<?php
$posts = sql_query("SELECT wr_id, wr_subject, wr_name FROM g5_write_gallery ORDER BY wr_id DESC LIMIT 5");
while ($post = sql_fetch_array($posts)) {
    echo "<tr><td>{$post['wr_id']}</td><td>{$post['wr_subject']}</td><td>{$post['wr_name']}</td></tr>";
}
?>
</table>
</div>

<div class="box">
<h2>5. 자유게시판 최근 게시글</h2>
<table>
<tr><th>ID</th><th>제목</th><th>작성자</th></tr>
<?php
$posts = sql_query("SELECT wr_id, wr_subject, wr_name FROM g5_write_free ORDER BY wr_id DESC LIMIT 5");
while ($post = sql_fetch_array($posts)) {
    echo "<tr><td>{$post['wr_id']}</td><td>{$post['wr_subject']}</td><td>{$post['wr_name']}</td></tr>";
}
?>
</table>
</div>

<div class="box">
<h2>6. MySQL 연결 상태</h2>
<table>
<tr><th>변수명</th><th>값</th></tr>
<?php
$result = sql_query("SHOW VARIABLES LIKE 'character_set%'");
while ($row = sql_fetch_array($result)) {
    echo "<tr><td>{$row['Variable_name']}</td><td>{$row['Value']}</td></tr>";
}
?>
</table>
</div>

<div class="box" style="background: #e8f5e9; border-left: 4px solid #4CAF50;">
<h2>✅ 결과</h2>
<p><strong>위의 모든 한글이 올바르게 표시되면 UTF-8 설정이 완료된 것입니다!</strong></p>
<p>만약 여전히 깨져 보인다면 브라우저 캐시를 삭제해주세요.</p>
<ul>
<li>Chrome/Edge: Ctrl + Shift + Delete</li>
<li>전체 기간의 쿠키 및 캐시 삭제</li>
<li>브라우저 재시작</li>
</ul>
</div>

</body>
</html>



