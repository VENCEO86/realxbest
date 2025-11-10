<?php
if (!defined('_GNUBOARD_')) exit; // 개별 페이지 접근 불가
include_once(G5_LIB_PATH.'/thumbnail.lib.php');

// add_stylesheet('css 구문', 출력순서); 숫자가 작을 수록 먼저 출력됨
add_stylesheet('<link rel="stylesheet" href="'.$latest_skin_url.'/style.css">', 0);
$thumb_width = 0;
$thumb_height = 150;
?>

<div class="row">	
	<?php
	//유튜브
    for ($i=0; $i<1; $i++) {
	
	// 최근게시물 공지는 제외
	if(!$list[$i]['is_notice']) {

	$arr = explode('/',$list[$i]['wr_10']);
	$yt = str_replace("watch?v=", "", $arr[3]);
	$yt = explode('&',$yt);
	$yt = $yt[0];
	
	if($yt) {
		$img_content = '<img src="https://img.youtube.com/vi/'.$yt.'/0.jpg" alt="'.$list[$i]['wr_subject'].'" style="width:100%;">';
	}else{
		$thumb = get_list_thumbnail($bo_table, $list[$i]['wr_id'], $thumb_width, $thumb_height, false, true);
		if($thumb['src']) {
			$img = $thumb['src'];
		} else {
			$img = G5_THEME_URL.'/img/no_img.png';
			$thumb['alt'] = '이미지가 없습니다.';
		}
		$img_content = '<img src="'.$thumb['ori'].'" alt="'.$thumb['alt'].'" style="width:100%; height: 250px;">';
	}
    ?>
        <!-- img -->
		<div class="col-md-12 mb10">
            <a href="<?php echo $list[$i]['href'] ?>" class="lt_img"><?php echo $img_content; ?></a>
        </div>
		<div class="col-md-12 mt10 mb10">
			<?php echo "<span style='line-height:1.5; color:#888'>".cut_str(strip_tags($list[$i]['wr_content']),'45','...')."</span>";?>
		</div>
	<?php }  ?>
	<?php }  ?>
	
		
	<?php
    for ($i=1; $i<count($list); $i++) {
	?>
		<!-- text -->
		<div class="col-md-12">
            <?php
			// 제목
			echo "<div class='gallery_title'>";
			echo "<a href=\"".$list[$i]['href']."\"> ";
			if($list[$i]['ca_name']) { 
				echo "<span class='la_cate'>[".$list[$i]['ca_name']."]</span>";
				echo cut_str($list[$i]['subject'],'15','..')."";
			}else{
				echo cut_str($list[$i]['subject'],'40','..')."";
			}
            echo "</a>";
			echo "</div>";

			// 내용
			echo "<div class='gallery_content'>";
			if ($list[$i]['icon_secret']) echo "<i class=\"fa fa-lock\" aria-hidden=\"true\"></i><span class=\"sound_only\">비밀글</span> ";
            //if ($list[$i]['icon_new']) echo "<span class=\"new_icon\">N<span class=\"sound_only\">새글</span></span>";
            //if ($list[$i]['icon_hot']) echo "<span class=\"hot_icon\">H<span class=\"sound_only\">인기글</span></span>";

			echo "</div>";

		

            //if ($list[$i]['comment_cnt'])  echo "
            //<span class=\"lt_cmt\">+ ".$list[$i]['wr_comment']."</span>";

            ?>
		</div>
    <?php }  ?>
</div>