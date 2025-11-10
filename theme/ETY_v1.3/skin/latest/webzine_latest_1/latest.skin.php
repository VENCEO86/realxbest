<?php
if (!defined('_GNUBOARD_')) exit; // 개별 페이지 접근 불가
include_once(G5_LIB_PATH.'/thumbnail.lib.php');

// add_stylesheet('css 구문', 출력순서); 숫자가 작을 수록 먼저 출력됨
add_stylesheet('<link rel="stylesheet" href="'.$latest_skin_url.'/style.css">', 0);

$thumb_width = 0;
$thumb_height = 150;
?>
<div class="head-title">
	<h2 class="h2-title-bottom"><?php echo $bo_subject?></h2>
	<a href="#" class="btn-more"><span class="sound_only"><?php echo $bo_subject?></span></a>
	<span class="more"><a href="/bbs/board.php?bo_table=<?php echo $bo_table?>">› 더보기</a></span>
</div>
<div class="row">
	<?php
    for ($i=0; $i<1; $i++) {
    $thumb = get_list_thumbnail($bo_table, $list[$i]['wr_id'], $thumb_width, $thumb_height, false, true);

    if($thumb['src']) {
        $img = $thumb['src'];
    } else {
        $img = G5_IMG_URL.'/no_img.png';
        $thumb['alt'] = '이미지가 없습니다.';
    }
    $img_content = '<img src="'.$img.'" alt="'.$thumb['alt'].'" style="width:100%; height: 120px;">';
    ?>
			<!-- img -->
			<div class="col-md-3">
				<a href="<?php echo $list[$i]['href'] ?>" class="lt_img"><?php echo $img_content; ?></a>
			</div>
			<!-- text -->
			<div class="col-md-9">
				<?php
				// 제목
				echo "<div class='gallery_title_wz1'>";
				echo "<a href=\"".$list[$i]['href']."\"> ";
				if($list[$i]['ca_name']) { 
					//echo "<span class='la_cate'>[".$list[$i]['ca_name']."]</span>";
					echo cut_str($list[$i]['subject'],'80','..')."<br />";
				}else{
					echo cut_str($list[$i]['subject'],'80','..')."<br />";
				}
				echo "</a>";
				echo "</div>";

				// 내용
				echo "<div class='gallery_content_wz'>";
				if ($list[$i]['icon_secret']) echo "<i class=\"fa fa-lock\" aria-hidden=\"true\"></i><span class=\"sound_only\">비밀글</span> ";
				if ($list[$i]['icon_new']) echo "<span class=\"new_icon\">N<span class=\"sound_only\">새글</span></span>";
				if ($list[$i]['icon_hot']) echo "<span class=\"hot_icon\">H<span class=\"sound_only\">인기글</span></span>";

				echo "<a href=\"".$list[$i]['href']."\"> ";
				echo cut_str(strip_tags($list[$i]['wr_content']),'150','...')."";
				echo "</a>";
				echo "</div>";


				echo "<span class='sub_gallery_2_profile'>";
				echo get_member_profile_img($list[$i]['mb_id']);
				echo "&nbsp;".$list[$i]['wr_name'];
				echo "</span> ";
		

				if ($list[$i]['comment_cnt'])  echo "
				<span class=\"dot_02\">+ ".$list[$i]['wr_comment']."</span>";

				?>			
				<span class='dot_01'>|</span>
				<span class="lt_date"><?php echo $list[$i]['datetime'] ?></span>
				<span class='dot_01'>|</span>
				조회수 : <span class="dot_02"><?php echo $list[$i]['wr_hit']?></span>
			</div><!-- /col -->
    <?php }//for  ?>
</div>
<div class="news_list"></div>
<div class="row">
	<?php
	for ($i=1; $i<count($list); $i++) {
	?>
		<!-- text -->
		<div class="col-md-6">
			<?php
			// 제목
			echo "<div class='gallery_title_wz2'>";
			if ($list[$i]['icon_new']) echo "<span class=\"new_icon\">N<span class=\"sound_only\">새글</span></span>";
			echo "<a href=\"".$list[$i]['href']."\"> ";
			if($list[$i]['ca_name']) { 
				echo "<span class='la_cate_wz'>[".$list[$i]['ca_name']."]</span>";
				echo cut_str($list[$i]['subject'],'80','..')."";
			}else{
				echo cut_str($list[$i]['subject'],'150','..')."";
			}
			echo "</a>";
				if ($list[$i]['comment_cnt'])  echo "
				<span class=\"dot_02\">+ ".$list[$i]['wr_comment']."</span>";
			echo "</div>";

			//if ($list[$i]['icon_secret']) echo "<i class=\"fa fa-lock\" aria-hidden=\"true\"></i><span class=\"sound_only\">비밀글</span> ";
			
			//if ($list[$i]['icon_hot']) echo "<span class=\"hot_icon\">H<span class=\"sound_only\">인기글</span></span>";
			?>			
		</div>
	<?php }  ?>
</div>