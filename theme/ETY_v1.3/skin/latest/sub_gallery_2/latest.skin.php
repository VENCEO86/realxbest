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
    for ($i=0; $i<count($list); $i++) {
	
	// 최근게시물 공지는 제외
	if(!$list[$i]['is_notice']) {

	$arr = explode('/',$list[$i]['wr_10']);
	$yt = str_replace("watch?v=", "", $arr[3]);
	$yt = explode('&',$yt);
	$yt = $yt[0];
	
	if($yt) {
		$img_content = '<img src="https://img.youtube.com/vi/'.$yt.'/0.jpg" alt="'.$list[$i]['wr_subject'].'" style="width:100%; height: 120px;">';
	}else{
		$thumb = get_list_thumbnail($bo_table, $list[$i]['wr_id'], $thumb_width, $thumb_height, false, true);
		if($thumb['src']) {
			$img = $thumb['src'];
		} else {
			$img = G5_IMG_URL.'/no_img.png';
			$thumb['alt'] = '이미지가 없습니다.';
		}
		$img_content = '<img src="'.$img.'" alt="'.$thumb['alt'].'" style="width:100%; height: 120px;">';
	}
    ?>
        <!-- img -->
		<div class="col-lg-3 col-sm-6 col-6 mb10">
            <a href="<?php echo $list[$i]['href'] ?>" class="lt_img"><?php echo $img_content; ?></a>
        </div>
		<!-- text -->
		<div class="col-lg-3 col-sm-6 col-6 mb10">
            <?php
			// 제목
			echo "<div class='gallery_title'>";
			echo "<a href=\"".$list[$i]['href']."\"> ";
			if($list[$i]['ca_name']) { 
				echo "<span class='la_cate'>[".$list[$i]['ca_name']."]</span>";
				echo cut_str($list[$i]['subject'],'10','..')."<br />";
			}else{
				echo cut_str($list[$i]['subject'],'35','..')."<br />";
			}
            echo "</a>";
			echo "</div>";

			// 내용
			echo "<div class='gallery_content'>";
			if ($list[$i]['icon_secret']) echo "<i class=\"fa fa-lock\" aria-hidden=\"true\"></i><span class=\"sound_only\">비밀글</span> ";
            //if ($list[$i]['icon_new']) echo "<span class=\"new_icon\">N<span class=\"sound_only\">새글</span></span>";
            //if ($list[$i]['icon_hot']) echo "<span class=\"hot_icon\">H<span class=\"sound_only\">인기글</span></span>";

			echo "<a href=\"".$list[$i]['href']."\"> ";
			echo cut_str(strip_tags($list[$i]['wr_content']),'45','...')."";
            echo "</a>";
			echo "</div>";


			echo "<span class='sub_gallery_2_profile'>";
			echo get_member_profile_img($list[$i]['mb_id']);
			echo "&nbsp;".$list[$i]['wr_name'];
			echo "</span>";


            //echo "<a href=\"".$list[$i]['href']."\"> ";
            //if ($list[$i]['is_notice'])
            //    echo "<strong>".$list[$i]['subject']."</strong>";
            //else
            //echo $list[$i]['subject'];
            //echo "</a>";

            // if ($list[$i]['link']['count']) { echo "[{$list[$i]['link']['count']}]"; }
            // if ($list[$i]['file']['count']) { echo "<{$list[$i]['file']['count']}>"; }

             //echo $list[$i]['icon_reply']." ";
           // if ($list[$i]['icon_file']) echo " <i class=\"fa fa-download\" aria-hidden=\"true\"></i>" ;
            //if ($list[$i]['icon_link']) echo " <i class=\"fa fa-link\" aria-hidden=\"true\"></i>" ;


			

            if ($list[$i]['comment_cnt'])  echo "
            <span class=\"lt_cmt\">+ ".$list[$i]['wr_comment']."</span>";

            ?>			
			<span class="lt_date"><?php echo $list[$i]['datetime2'] ?></span>
		</div>
    <?php }  ?>
    <?php if (count($list) == 0) { //게시물이 없을 때  ?>
    <li class="empty_li">게시물이 없습니다.</li>
    <?php } // for  ?>
	<?php } // if  ?>
</div>