<?php
if (!defined('_GNUBOARD_')) exit; // 개별 페이지 접근 불가

if (G5_IS_MOBILE) {
    include_once(G5_THEME_MOBILE_PATH.'/tail.php');
    return;
}
?>
	</div><!-- /col -->
	<div class="col-md-3 layout-right pb30 pt20 pc">
			<?php
			// 이 함수가 바로 최신글을 추출하는 역할을 합니다.
			// 사용방법 : latest(스킨, 게시판아이디, 출력라인, 글자수);
			// 테마의 스킨을 사용하려면 theme/basic 과 같이 지정
			?>
			<?php echo outlogin('theme/basic_v10'); // 외부 로그인, 테마의 스킨을 사용하려면 스킨을 theme/basic 과 같이 지정 ?>
			
			<?php if($bo_table){ ?>
			<!-- 해당그룹 카테고리 출력 -->
			<div class="head-title">
				<h2 class="h2-title-bottom">카테고리</h2>
				<a href="<?php echo G5_URL; ?>" class="btn-more"><span class="sound_only">카테고리</span><i class="fa fa-home"></i></a>
			</div>
			<?php
				$sql = "select * from g5_board where gr_id = '".$gr_id."'";
				$result = sql_query($sql);
				while($row = sql_fetch_array($result)){
					if($row['bo_table'] == $_GET['bo_table']) {
						$active = "on";
						echo "<a href='/bbs/board.php?bo_table=".$row['bo_table']."'>";
						echo "<div class='left_menu ".$active."'>".$row['bo_subject']."</div>";
						echo "</a>";
					}else{
						$active = "";
						echo "<a href='/bbs/board.php?bo_table=".$row['bo_table']."'>";
						echo "<div class='left_menu ".$active."'><img src='".G5_THEME_URL."/img/icon_list.png'> &nbsp;".$row['bo_subject']."</div>";
						echo "</a>";
					}
					//echo "<a href='/bbs/board.php?bo_table=".$row['bo_table']."'>";
					//echo "<div class='left_menu ".$active."'><img src='".G5_THEME_URL."/img/icon_list.png'> &nbsp;".$row['bo_subject']."</div>";
					//echo "</a>";
				}
			}
			?>
			<!-- /해당그룹 카테고리 출력 -->						
			<div class="ht10"></div>

			<?php echo latest('theme/left_latest_small_1', 'gallery', 5, 23);?>
			<div class="ht10"></div>
			<?php echo latest('theme/left_latest_small_2', 'free', 5, 23);?>

			<?php
			// 메인페이지에서만 출력합니다.
			if(!$bo_table) {
			?>

			<!-- 새글,새댓글 -->
			<div class="ht20"></div>
			<div class="row">
				<div class="col-md-12">
					  <ul class="nav nav-tabs nav-justified" role="tablist">
						<li class="nav-item">
						  <a class="nav-link active" data-toggle="tab" href="#lb1">자유게시판</a>
						</li>
						<li class="nav-item">
						  <a class="nav-link" data-toggle="tab" href="#lb2">질문게시판</a>
						</li>
					  </ul>
					  <!-- Tab panes -->
					  <div class="tab-content">
						<div id="lb1" class="tab-pane active">
							<div class="row">
								<!-- 서브갤러리 -->
								<div class="col-md-12">
									<?php echo latest('theme/basic', 'free', 10, 10);?>
									
								</div>
							</div>
						</div>
						<div id="lb2" class="tab-pane fade">
							<div class="row">
								<!-- 서브갤러리 --><div class="col-md-12"><?php echo latest('theme/basic', 'qa', 10, 10);?></div>
							</div>
						</div>
					  </div><!-- /tab -->
				</div><!-- /col -->
			</div><!-- /row -->
			<?php echo poll('theme/basic_v10'); // 설문조사, 테마의 스킨을 사용하려면 스킨을 theme/basic 과 같이 지정 ?>
			<?php echo visit('theme/basic_v10'); // 접속자집계, 테마의 스킨을 사용하려면 스킨을 theme/basic 과 같이 지정 ?>
		<?php }// 메인페이지 if?>

		</div>
	</div><!-- /row -->
</div><!-- /container -->


<footer class="bg-light">
	<div class="container">
	<div class="row">

		<div class="col-md-3 pt20 pb20 footer_1">
			<!-- 로고 -->
			<img src="<?php echo G5_THEME_URL; ?>/img/logo.png" class="logo_img mb20" alt="<?php echo G5_VERSION ?>">
			<p class="pcontent">
			현재 최근게시물등은 커뮤니티에 맞게 제작되었습니다.
			</p>
			<p class="pcontent">
			커뮤니티와 쇼핑몰을 동시에 운영하고 있으며<br />
			정확한 고급정보를 드리기 위해서 커뮤니티를<br />
			마련 하였습니다. 많은 관심 부탁드립니다.
			</p>
		</div>

		<div class="col-md-3 pt20 pb80 footer_2">
			<div class="footer_title">인기검색어</div>
			<!-- 인기검색어 -->
			<?php echo popular('theme/basic_v10','15'); // 인기검색어?>
			<!--<div class="footer_title mt20">SNS</div>-->
		</div>

		<div class="col-md-3 pt20 pb20 footer_3">
			<div class="footer_title">바로가기</div>
			<ul class="list-link list-dep">
				<li><a href="/bbs/board.php?bo_table=notice">공지사항</a><i class="fa fa-angle-right"></i></li>
				<li><a href="/bbs/board.php?bo_table=gallery">갤러리</a><i class="fa fa-angle-right"></i></li>
				<li><a href="/bbs/board.php?bo_table=free">자유게시판</a><i class="fa fa-angle-right"></i></li>
				<li><a href="/bbs/board.php?bo_table=qa">질문게시판</a><i class="fa fa-angle-right"></i></li>
				<li><a href="<?php echo G5_BBS_URL; ?>/new.php">최신글</a><i class="fa fa-angle-right"></i></li>
			</ul>
		</div>

		<div class="col-md-3 pt20 pb20 footer_4">
			<div class="footer_title">오시는길,연락처</div>
			<!-- 영업시간안내 -->
			<p class="m-0 a-link pb10 pcontent">
			영업시간안내 : AM 09:00 ~ PM 18:00<br />
			토요일,일요일,공휴일은 쉽니다.<br />
			</p>
			
			<!-- 주소 -->
			<strong>[문의]</strong><br>
			<p class="m-0 a-link pcontent">
			연락처 : <strong>010-5879-1459</strong><br />
			Email : softzonecokr@naver.com<br />
			계좌안내 : 농협 221117-56-125571 이종오
			</P>
			
			<!-- SNS -->
			<p class="m-0 a-link">

			</p>
		</div>

		<div class="col-md-12 mt20 mb50 text-center">
			<div id="ft_wr">
				<div id="ft_link">
					Copyright &copy; <b>소유하신 도메인.</b> All rights reserved.
					<a href="<?php echo G5_BBS_URL; ?>/content.php?co_id=company">회사소개</a>
					<a href="<?php echo G5_BBS_URL; ?>/content.php?co_id=privacy">개인정보처리방침</a>
					<a href="<?php echo G5_BBS_URL; ?>/content.php?co_id=provision">서비스이용약관</a>
				</div>
			</div>
		</div>
	</div>

	<button type="button" id="top_btn"><i class="fa fa-arrow-up" aria-hidden="true"></i><span class="sound_only">상단으로</span></button>
	<script>
	$(function() {
		$("#top_btn").on("click", function() {
			$("html, body").animate({scrollTop:0}, '500');
			return false;
		});
	});
	</script>
	</div><!-- //container -->
</footer>
<?php
if(G5_DEVICE_BUTTON_DISPLAY && !G5_IS_MOBILE) { ?>
<?php
}

if ($config['cf_analytics']) {
    echo $config['cf_analytics'];
}
?>

<!-- } 하단 끝 -->

<script>
$(function() {
    // 폰트 리사이즈 쿠키있으면 실행
    font_resize("container", get_cookie("ck_font_resize_rmv_class"), get_cookie("ck_font_resize_add_class"));
});
</script>



    <!-- Bootstrap core JavaScript -->
    <script type="text/javascript" src="<?php echo G5_THEME_URL?>/assets/jquery/jquery.min.js"></script>
	<script>
	var jQuery = $.noConflict(true);
	</script>
    <script src="<?php echo G5_THEME_URL?>/assets/bootstrap/js/bootstrap.bundle.min.js"></script>
	<script src="<?php echo G5_THEME_URL?>/assets/parallax/js/parallax.min.js"></script>
	<script src="<?php echo G5_THEME_URL?>/assets/owlcarousel/js/owl.carousel.min.js"></script>

	<!-- countdown -->
	<script type="text/javascript" src="<?php echo G5_THEME_URL?>/assets/countdown/js/kinetic.js"></script>
	<script type="text/javascript" src="<?php echo G5_THEME_URL?>/assets/countdown/js/jquery.final-countdown.js"></script>
	<!-- custom -->
	<script src="<?php echo G5_THEME_URL?>/js/custom.js"></script>
	<script src="<?php echo G5_THEME_URL?>/js/bootstrap-essentials.js"></script>
	<script>
	$(window).resize(function (){
		var windowWidth = window.outerWidth;
		if (windowWidth <= 990) {
			$(".main-container").removeClass('col-md-9');
			$(".main-container").addClass('col-md-12');
		}else{
			$(".main-container").removeClass('col-md-12');
			$(".main-container").addClass('col-md-9');
		}
	});

	// <![CDATA[
	jQuery(function($){
		$("ul.gnb > li").mouseover(function(){
			$(".gnbDepth").hide();
			$(".gnbDepth",this).show();
		});
		$("ul.gnb").mouseover(function(e){
			if(e.target==this) $(".gnbDepth").hide();
		});
		$("ul.gnb > li .gnbDepth").mouseout(function(){
			$(this).hide();
		});
		$("article").mouseout(function(){
			$("ul.gnb > li .gnbDepth").hide();
		});
		$(window).on('scroll', function() {
			if($(window).scrollTop() > 0) $('body > div.btn-top').show();
			else $('body > div.btn-top').hide();
		});
	});
	// ]]>

	</script>

<?php
include_once(G5_THEME_PATH."/tail.sub.php");
?>