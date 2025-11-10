<?php
if (!defined("_GNUBOARD_")) exit; // 개별 페이지 접근 불가

// add_stylesheet('css 구문', 출력순서); 숫자가 작을 수록 먼저 출력됨
add_stylesheet('<link rel="stylesheet" href="'.$outlogin_skin_url.'/style.css">', 0);
?>

<div class="sidebar-header">
	<div class="user-pic">
		<?php echo get_member_profile_img($member['mb_id']); ?>
		<a href="<?php echo G5_BBS_URL ?>/member_confirm.php?url=register_form.php" id="ol_after_info" title="정보수정"><i class="fa fa-cog" aria-hidden="true"></i><span class="sound_only">정보수정</span></a>
		</div>

		<?php if ($is_admin == 'super' || $is_auth) {  ?><a href="<?php echo G5_ADMIN_URL ?>" class="btn_admin btn_04">관리자</a><?php }  ?>

		<div class="user-info">
			<span class="user-name">
			<strong><?php echo $member['mb_name']?></strong>
			</span>
			<span class="user-role"><?php echo $member['mb_id']?></span>

		<span class="user-status">
			<i class="fas fa-battery-three-quarters"></i>
			<span><?php echo $point ?></span>
			<a href="<?php echo G5_BBS_URL ?>/scrap.php" target="_blank"><span class='scrap'><i class="fas fa-thumbtack"></i></span></a>
		</span>
		<span class="user-info-logout"><a href="<?php echo G5_BBS_URL ?>/logout.php"><i class="fas fa-sign-out-alt"></i> 로그아웃</a></span>
	</div><!-- //user-info -->
</div>

<script>
// 탈퇴의 경우 아래 코드를 연동하시면 됩니다.
function member_leave()
{
    if (confirm("정말 회원에서 탈퇴 하시겠습니까?"))
        location.href = "<?php echo G5_BBS_URL ?>/member_confirm.php?url=member_leave.php";
}
</script>
<!-- } 로그인 후 아웃로그인 끝 -->
