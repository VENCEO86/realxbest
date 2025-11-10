<?php
if (!defined("_GNUBOARD_")) exit; // 개별 페이지 접근 불가

global $is_admin;

// add_stylesheet('css 구문', 출력순서); 숫자가 작을 수록 먼저 출력됨
add_stylesheet('<link rel="stylesheet" href="'.$visit_skin_url.'/style.css">', 0);
?>
<style>
.vi_area td { border-bottom:1px dotted #dddddd;padding: 6px; 0px; }
</style>
<!-- 접속자집계 시작 { -->
<div class="head-title">
	<h2 class="h2-title-bottom">접속자</h2>
	<a href="#" class="btn-more"><span class="sound_only">접속자</span></a>
</div>
<!-- } 접속자집계 끝 -->
<div class="vi_area">
	<table width="100%" class="vi_area">
		<tr>
			<td width="50%">오늘</td>
			<td width="" align="right"><?php echo number_format($visit[1]) ?></td>
		</tr>
		<tr>
			<td width="50%">어제</td>
			<td width="" align="right"><?php echo number_format($visit[2]) ?></td>
		</tr>
		<tr>
			<td width="50%">최대</td>
			<td width="" align="right"><?php echo number_format($visit[3]) ?></td>
		</tr>
		<tr>
			<td width="50%"><strong>전체</strong></td>
			<td width="" align="right"><strong><?php echo number_format($visit[4]) ?></strong></td>
		</tr>
	</table>
	<?php if ($is_admin == "super") {  ?>
	<div class="vi_admin"><a href="<?php echo G5_ADMIN_URL ?>/visit_list.php" class="btn_admin">상세보기</a></div>
	<?php } ?>
</div>