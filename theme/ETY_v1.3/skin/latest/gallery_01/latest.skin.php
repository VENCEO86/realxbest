<?php
if (!defined('_GNUBOARD_')) exit; // 개별 페이지 접근 불가
include_once(G5_LIB_PATH.'/thumbnail.lib.php');

// add_stylesheet('css 구문', 출력순서); 숫자가 작을 수록 먼저 출력됨
add_stylesheet('<link rel="stylesheet" href="'.$latest_skin_url.'/style.css">', 0);
$thumb_width = 204;
$thumb_height = 190;
?>
<STYLE>
img { width:100%;}
.gallery_row {
    margin-left: -5px;
    margin-right: -5px;
}
.gallery_col {
    padding-left: 5px;
    padding-right: 5px;
}
</STYLE>
<div class="head-title">
	<h2 class="h2-title-bottom"><?php echo $bo_subject?></h2>
	<a href="#" class="btn-more"><span class="sound_only"><?php echo $bo_subject?></span></a>
	<span class="more"><a href="/bbs/board.php?bo_table=<?php echo $bo_table?>">› 더보기</a></span>
</div>
<div class="row gallery_row">	
	<?php
    for ($i=0; $i<count($list); $i++) {
    $thumb = get_list_thumbnail($bo_table, $list[$i]['wr_id'], $thumb_width, $thumb_height, false, true);

    if($thumb['src']) {
        $img = $thumb['src'];
    } else {
        $img = G5_IMG_URL.'/no_img.png';
        $thumb['alt'] = '이미지가 없습니다.';
    }
    $img_content = '<img class="img-thumbnail" src="'.$img.'" alt="'.$thumb['alt'].'" style="width:100%;height:190px;">';
    ?>
        <div class="col-md-4 col-sm-6 gallery_col" style='position: relative;'>
		<a href="<?php echo $list[$i]['href'] ?>"><?php echo $img_content; ?></a>
			<div class="over_content">
				
				<?php
					echo "<a href=\"".$list[$i]['href']."\" class='over_subject'> ";
					if ($list[$i]['is_notice'])
						echo "<strong>".$list[$i]['subject']."</strong>";
					else
						echo $list[$i]['subject'];

	?>
			</div>
		</a>
	<?
		echo "<div class='profile_area'>";
		echo "<span class='sub_gallery_3_profile'>";
		//echo get_member_profile_img($list[$i]['mb_id']);
		echo "<span class='la-name'>".$list[$i]['wr_name']."</span>";
		echo "</span>";	
		
	?>
		<span class="lt_date"><?php echo $list[$i]['datetime2'] ?></span>
		</div><!-- /area -->
		<div class="ht10"></div>
        </div><!-- /col -->

    <?php }  ?>
    <?php if (count($list) == 0) { //게시물이 없을 때  ?>
    <li class="empty_li">게시물이 없습니다.</li>
    <?php }  ?>
	
</div>