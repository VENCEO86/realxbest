<?php
if (!defined('_GNUBOARD_')) exit; // 개별 페이지 접근 불가
include_once(G5_LIB_PATH.'/thumbnail.lib.php');

// add_stylesheet('css 구문', 출력순서); 숫자가 작을 수록 먼저 출력됨
add_stylesheet('<link rel="stylesheet" href="'.$latest_skin_url.'/style.css">', 0);
$thumb_width = 0;
$thumb_height = 150;
?>
<!--
<div class="head-title">
	<h2 class="h2-title-bottom"><?php echo $bo_subject?></h2>
	<a href="#" class="btn-more"><span class="sound_only"><?php echo $bo_subject?></span></a>
	<span class="more"><a href="/bbs/board.php?bo_table=<?php echo $bo_table?>">› 더보기</a></span>
</div>
-->
<div class="row">	
	<?php
    for ($i=0; $i<count($list); $i++) {
    $thumb = get_list_thumbnail($bo_table, $list[$i]['wr_id'], $thumb_width, $thumb_height, false, true);

    if($thumb['src']) {
        $img = $thumb['src'];
    } else {
        $img = G5_IMG_URL.'/no_img.png';
        $thumb['alt'] = '이미지가 없습니다.';
    }
    $img_content = '<img src="'.$img.'" alt="'.$thumb['alt'].'" style="width:70px; height:66px; border-radius:50%;">';
    ?>
        <!-- img -->
		<div class="col-md-4" style="padding-right:0px;">
            <a href="<?php echo $list[$i]['href'] ?>" class="lt_img"><?php echo $img_content; ?></a>
        </div>
		<!-- text -->
		<div class="col-md-8" style="padding-left:0px;">
            <?php
			// 제목
			echo "<div class='gallery_title'>";
			echo "<a href=\"".$list[$i]['href']."\"> ";
			if($list[$i]['ca_name']) { 
				//분류숨김 echo "<span class='la_cate'>[".$list[$i]['ca_name']."]</span>";
				echo cut_str($list[$i]['subject'],'15','..')."<br />";
			}else{
				echo cut_str($list[$i]['subject'],'15','..')."<br />";
			}
            echo "</a>";
			echo "</div>";

			// 내용
			echo "<div class='gallery_content'>";
			if ($list[$i]['icon_secret']) echo "<i class=\"fa fa-lock\" aria-hidden=\"true\"></i><span class=\"sound_only\">비밀글</span> ";
            if ($list[$i]['icon_new']) echo "<span class=\"new_icon\">N<span class=\"sound_only\">새글</span></span>";
            if ($list[$i]['icon_hot']) echo "<span class=\"hot_icon\">H<span class=\"sound_only\">인기글</span></span>";

			echo "<a href=\"".$list[$i]['href']."\"> ";
			echo cut_str(strip_tags($list[$i]['wr_content']),'34','...')."";
            echo "</a>";
			echo "</div>";
            ?>
		</div>
    <?php }  ?>
    <?php if (count($list) == 0) { //게시물이 없을 때  ?>
    <li class="empty_li">게시물이 없습니다.</li>
    <?php }  ?>
</div>