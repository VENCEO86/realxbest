<?php
if (!defined("_GNUBOARD_")) exit; // 개별 페이지 접근 불가

// add_stylesheet('css 구문', 출력순서); 숫자가 작을 수록 먼저 출력됨
add_stylesheet('<link rel="stylesheet" href="'.$outlogin_skin_url.'/style.css">', 0);
?>
<div class="sidebar-header">
	<form name="foutlogin" action="<?php echo $outlogin_action_url ?>" onsubmit="return fhead_submit(this);" method="post" autocomplete="off">
	<input type="hidden" name="url" value="<?php echo $outlogin_url ?>">
		<div class="form-group">
			<input type="text" name="mb_id" required maxlength="20" id="username" class="form-control" placeholder="아이디">
		</div>
		<div class="form-group">
			<input type="password" name="mb_password" id="password" class="form-control" placeholder="패스워드">
		</div>
		<div class="form-group">
			<div class="login-left">
			<label for="auto_login" class="text-info"><span>자동로그인</span> <span><input id="auto_login" name="auto_login" type="checkbox" value="1"></span></label>
			</div>

			<div class="login-right">
			<label for="member-id" class="text-info"><span><a href="<?php echo G5_BBS_URL ?>/register.php">회원가입</a></span></label>
			<label for="member-password" class="text-info"><span><a href="<?php echo G5_BBS_URL ?>/password_lost.php" id="ol_password_lost">정보찾기</a></span></label>	
			</div>
			<br>
			<input type="submit" name="submit" class="btn btn-info btn-md btn-block" value="로그인">

		   <?php
			// 소셜로그인 사용시 소셜로그인 버튼
			@include_once(get_social_skin_path().'/social_outlogin.skin.1.php');
			?>

		</div>
	</form>
</div>

<script>
$omi = $('#ol_id');
$omp = $('#ol_pw');
$omi_label = $('#ol_idlabel');
$omi_label.addClass('ol_idlabel');
$omp_label = $('#ol_pwlabel');
$omp_label.addClass('ol_pwlabel');

$(function() {

    $("#auto_login").click(function(){
        if ($(this).is(":checked")) {
            if(!confirm("자동로그인을 사용하시면 다음부터 회원아이디와 비밀번호를 입력하실 필요가 없습니다.\n\n공공장소에서는 개인정보가 유출될 수 있으니 사용을 자제하여 주십시오.\n\n자동로그인을 사용하시겠습니까?"))
                return false;
        }
    });
});

function fhead_submit(f)
{
    return true;
}
</script>
<!-- } 로그인 전 아웃로그인 끝 -->
