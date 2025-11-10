<?php
if (!defined('_GNUBOARD_')) exit; // 개별 페이지 접근 불가
include_once(G5_LIB_PATH.'/thumbnail.lib.php');

// add_stylesheet('css 구문', 출력순서); 숫자가 작을 수록 먼저 출력됨
add_stylesheet('<link rel="stylesheet" href="'.$latest_skin_url.'/style.css">', 0);

$thumb_width = 0;
$thumb_height = 80;

// 최근등록된 전체 이미지를 9개씩 나누어서 보여줌
$count = sql_fetch("select count(*) as cnt from g5_board_file");
$count = $count['cnt'];

?>
<style>

/*.left_shop_gallery{padding:0;}*/
.left_shop_gallery_row {
    margin-left: -5px;
    margin-right: -5px;
}
.left_shop_gallery_col {
    padding-left: 3px;
    padding-right: 3px;
}

</style>

<div class="head-title">
	<h2 class="h2-title-bottom">최근이미지리스트</h2>
	<a href="#" class="btn-more"><span class="sound_only">최근이미지리스트</span></a>
</div>

<div id="owl4" class="owl-carousel owl-theme">
	<div class="item">
		<div class="row left_shop_gallery_row">
			<?php
			// 게시판
			$bo_table = "gallery";
			$query = sql_query("SELECT * FROM g5_board_file WHERE bo_table = '$bo_table' order by wr_id desc limit 9");
			while($row = sql_fetch_array($query)){
				$wr_id = $row['wr_id'];
				$img = $row['bf_file'];
				$img_content = "<img src=/data/file/".$bo_table."/".$img." style='width:100%; height: 65px;'>";

			?>
			<div class="col-md-4 col-4 left_shop_gallery_col mb5">
				<a href="/bbs/board.php?bo_table=<?php echo $bo_table;?>&wr_id=<?php echo $wr_id;?>" class="lt_img"><?php echo $img_content; ?></a>
			</div>
			<?php }  ?>
		</div>
	</div>

	<div class="item">
		<div class="row left_shop_gallery_row">
			<?php
			// 게시판
			$bo_table = "gallery";
			$query = sql_query("SELECT * FROM g5_board_file WHERE bo_table = '$bo_table' order by wr_id desc limit 9");
			while($row = sql_fetch_array($query)){
				$wr_id = $row['wr_id'];
				$img = $row['bf_file'];
				$img_content = "<img src=/data/file/".$bo_table."/".$img." style='width:100%; height: 65px;'>";

			?>
			<div class="col-md-4 col-4 left_shop_gallery_col mb5">
				<a href="/bbs/board.php?bo_table=<?php echo $bo_table;?>&wr_id=<?php echo $wr_id;?>" class="lt_img"><?php echo $img_content; ?></a>
			</div>
			<?php }  ?>
		</div>
	</div>
	<div class="item">
		<div class="row left_shop_gallery_row">
			<?php
			// 게시판
			$bo_table = "gallery";
			$query = sql_query("SELECT * FROM g5_board_file WHERE bo_table = '$bo_table' order by wr_id desc limit 9");
			while($row = sql_fetch_array($query)){
				$wr_id = $row['wr_id'];
				$img = $row['bf_file'];
				$img_content = "<img src=/data/file/".$bo_table."/".$img." style='width:100%; height: 65px;'>";

			?>
			<div class="col-md-4 col-4 left_shop_gallery_col mb5">
				<a href="/bbs/board.php?bo_table=<?php echo $bo_table;?>&wr_id=<?php echo $wr_id;?>" class="lt_img"><?php echo $img_content; ?></a>
			</div>
			<?php }  ?>
		</div>
	</div>
</div>


