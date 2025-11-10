<?php
if (!defined('_GNUBOARD_')) exit; // 개별 페이지 접근 불가

// add_stylesheet('css 구문', 출력순서); 숫자가 작을 수록 먼저 출력됨
add_stylesheet('<link rel="stylesheet" href="'.$latest_skin_url.'/style.css">', 0);
?>
<div class="row">
	<!-- 좌측 -->
	<div class="col-md-6">
		<?php for ($i=0; $i<6; $i++) { ?>
			<div class="latest_v10">
				<?php
				if ($list[$i]['comment_cnt'])  echo "
				<span class=\"lt_cmt\">+ ".$list[$i]['comment_cnt']."</span>";
				?>
				<?php
				if ($list[$i]['icon_secret']) echo "<i class=\"fa fa-lock\" aria-hidden=\"true\"></i><span class=\"sound_only\">비밀글</span> ";

				if ($list[$i]['icon_new']) echo "<span class=\"new_icon\">N<span class=\"sound_only\">새글</span></span>";

				if ($list[$i]['icon_hot']) echo "<span class=\"hot_icon\">H<span class=\"sound_only\">인기글</span></span>";

				 echo "<a href=\"".$list[$i]['href']."\"> ";
				if ($list[$i]['is_notice'])
					echo "<strong>".cut_str($list[$i]['subject'],'20','..')."</strong>";
				else
					echo "<span title='".$list[$i]['wr_datetime']." / hit : ".$list[$i]['wr_hit']."'>".cut_str($list[$i]['subject'],'20','..')."</span>";

				echo "</a>";

				// if ($list[$i]['link']['count']) { echo "[{$list[$i]['link']['count']}]"; }
				// if ($list[$i]['file']['count']) { echo "<{$list[$i]['file']['count']}>"; }

				 //echo $list[$i]['icon_reply']." ";
			   // if ($list[$i]['icon_file']) echo " <i class=\"fa fa-download\" aria-hidden=\"true\"></i>" ;
				//if ($list[$i]['icon_link']) echo " <i class=\"fa fa-link\" aria-hidden=\"true\"></i>" ;
			
				?>
				<span class="sub_text_profile_img">
					<?php 
					if($list[$i]['mb_id']) {
						echo get_member_profile_img($list[$i]['mb_id']);
					}
					?>
					<?php echo $list[$i]['wr_name']?>
				</span>
				<span class="lt_date"><?php echo $list[$i]['datetime2'] ?></span>

			</div>
		<?php }  ?>
		<?php if (count($list) == 0) { //게시물이 없을 때  ?>
		<div class="empty_li">게시물이 없습니다.</div>
		<?php }  ?>
	</div>
	<!-- 우측 -->
	<div class="col-md-6">
		<?php for ($i=6; $i<12; $i++) { ?>
			<div class="latest_v10">
				<?php
				//if ($list[$i]['ca_name']) echo "<span class='la_cate'>".$list[$i]['ca_name']." | </span>";
				if ($list[$i]['comment_cnt'])  echo "
				<span class=\"lt_cmt\">+ ".$list[$i]['comment_cnt']."</span>";
				?>
				<?php
				if ($list[$i]['icon_secret']) echo "<i class=\"fa fa-lock\" aria-hidden=\"true\"></i><span class=\"sound_only\">비밀글</span> ";

				if ($list[$i]['icon_new']) echo "<span class=\"new_icon\">N<span class=\"sound_only\">새글</span></span>";

				if ($list[$i]['icon_hot']) echo "<span class=\"hot_icon\">H<span class=\"sound_only\">인기글</span></span>";

				 echo "<a href=\"".$list[$i]['href']."\"> ";
				if ($list[$i]['is_notice'])
					echo "<strong>".cut_str($list[$i]['subject'],'20','..')."</strong>";
				else
					echo "<span title='".$list[$i]['wr_datetime']." / hit : ".$list[$i]['wr_hit']."'>".cut_str($list[$i]['subject'],'20','..')."</span>";

				echo "</a>";

				// if ($list[$i]['link']['count']) { echo "[{$list[$i]['link']['count']}]"; }
				// if ($list[$i]['file']['count']) { echo "<{$list[$i]['file']['count']}>"; }

				 //echo $list[$i]['icon_reply']." ";
			   // if ($list[$i]['icon_file']) echo " <i class=\"fa fa-download\" aria-hidden=\"true\"></i>" ;
				//if ($list[$i]['icon_link']) echo " <i class=\"fa fa-link\" aria-hidden=\"true\"></i>" ;
			
				?>
				<span class="sub_text_profile_img">
					<?php 
					if($list[$i]['mb_id']) {
						echo get_member_profile_img($list[$i]['mb_id']);
					}
					?>
					<?php echo $list[$i]['wr_name']?>
				</span>
				<span class="lt_date"><?php echo $list[$i]['datetime2'] ?></span>

			</div>
		<?php }  ?>
		<?php if (count($list) == 0) { //게시물이 없을 때  ?>
		<div class="empty_li">게시물이 없습니다.</div>
		<?php }  ?>
	</div>
</div>