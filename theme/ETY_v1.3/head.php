<?php
if (!defined('_GNUBOARD_')) exit; // 개별 페이지 접근 불가

if (G5_IS_MOBILE) {
    include_once(G5_THEME_MOBILE_PATH.'/head.php');
    return;
}

include_once(G5_THEME_PATH.'/head.sub.php');
include_once(G5_LIB_PATH.'/latest.lib.php');
include_once(G5_LIB_PATH.'/outlogin.lib.php');
include_once(G5_LIB_PATH.'/poll.lib.php');
include_once(G5_LIB_PATH.'/visit.lib.php');
include_once(G5_LIB_PATH.'/connect.lib.php');
include_once(G5_LIB_PATH.'/popular.lib.php');
//include_once(G5_EXTEND_PATH.'/ety.lib.php');


// 모바일쪽지확인
if($is_member){
    $sql = " SELECT count(*) as cnt FROM {$g5['memo_table']} WHERE me_recv_mb_id = '{$member['mb_id']}' AND me_read_datetime = '0000-00-00 00:00:00' ";
    $memo_result = sql_fetch($sql);
	$memo_count = $memo_result['cnt'];
}
?>
	<!-- google fonts -->
	<link href="https://fonts.googleapis.com/css?family=Muli:200,200i,300,300i,400,400i,600|Noto+Sans+KR:100,300,400,500,700,900&amp;subset=korean" rel="stylesheet">
    <!-- Bootstrap core CSS -->
    <link href="<?php echo G5_THEME_URL?>/assets/bootstrap/css/bootstrap.min.css" rel="stylesheet">
	<!-- fontawesome -->
	<link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.5.0/css/all.css" integrity="sha384-B4dIYHKNBt8Bc12p+WXckhzcICo0wtJAoU8YZTY5qE0Id1GSseTk6S+L3BlXeVIU" crossorigin="anonymous">
	<!-- owl Carousel -->
	<link rel="stylesheet" href="<?php echo G5_THEME_URL?>/assets/owlcarousel/css/owl.carousel.min.css">
	<link rel="stylesheet" href="<?php echo G5_THEME_URL?>/assets/owlcarousel/css/owl.theme.default.min.css">
	<!-- countdown -->
	<link href="<?php echo G5_THEME_URL?>/assets/countdown/css/demo.css" rel="stylesheet">
	<!-- animate -->
	<link href="<?php echo G5_THEME_URL?>/assets/animate/animate.min.css" rel="stylesheet">
    <!-- Custom styles for this template -->
    <link href="<?php echo G5_THEME_URL?>/css/modern-business.css" rel="stylesheet">

	
	<!-- sidebar -->
	<link rel="stylesheet" href="<?php echo G5_THEME_URL?>/css/bootstrap-essentials.min.css">
	<link href="<?php echo G5_THEME_URL?>/css/sidebar.css" rel="stylesheet">

    <!--[if lt IE 9]>
      <script src="https://oss.maxcdn.com/html5shiv/3.7.2/html5shiv.min.js"></script>
      <script src="https://oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>
    <![endif]-->

	<!-- BANNER : TOP -->
	<div class="container-fluid banner-background">
		<div class="container-banner">
			<div class="banner-top">
				<a href="http://ety.kr/board/theme_update/7" target="_blank"><img src="<?php echo G5_THEME_URL?>/img/topbanner.png"></a>
			</div>
			<a href="javascrit:;" id="top-close">
				&nbsp;
			</a>
		</div>
	</div>
	<script>
	$("#top-close").click(function() {
		$(".banner-background").hide();
	});
	</script>
	<div class="container-fluid top-line">
		<div class="container">
			<div class="row">
				<div class="col-md-12">
					<?php
					if(defined('_INDEX_')) { // index에서만 실행
						include G5_BBS_PATH.'/newwin.inc.php'; // 팝업레이어
					}
					?>
					<div id="tnb">
						<ul>
							<?php if ($is_member) {  ?>
							<li><a href="<?php echo G5_BBS_URL ?>/member_confirm.php?url=<?php echo G5_BBS_URL ?>/register_form.php"><i class="fa fa-cog" aria-hidden="true"></i> 정보수정</a></li>
							<li><a href="<?php echo G5_BBS_URL ?>/logout.php">로그아웃</a></li>
							<?php if ($is_admin) {  ?>
							<li class="tnb_admin"><a href="<?php echo G5_ADMIN_URL ?>"><b><i class="fa fa-user-circle" aria-hidden="true"></i> 관리자</b></a></li>
							<?php }  ?>
							<?php } else {  ?>
							<li><a href="<?php echo G5_BBS_URL ?>/register.php"><i class="fa fa-user-plus" aria-hidden="true"></i> 회원가입</a></li>
							<li><a href="<?php echo G5_BBS_URL ?>/login.php"><b>로그인</b></a></li>
							<?php }  ?>

							<li><a href="<?php echo G5_BBS_URL ?>/faq.php"><i class="fa fa-question" aria-hidden="true"></i> <span>FAQ</span></a></li>
							<li><a href="<?php echo G5_BBS_URL ?>/qalist.php"><i class="fa fa-comments" aria-hidden="true"></i> <span>1:1문의</span></a></li>
							<li><a href="<?php echo G5_BBS_URL ?>/current_connect.php" class="visit"><i class="fa fa-users" aria-hidden="true"></i> <span>접속자</span><strong class="visit-num"><?php echo connect('theme/basic'); // 현재 접속자수, 테마의 스킨을 사용하려면 스킨을 theme/basic 과 같이 지정  ?></strong></a></li>
							<li><a href="<?php echo G5_BBS_URL ?>/new.php"><i class="fa fa-history" aria-hidden="true"></i> <span>새글</span></a></li>
						</ul>
					  </div>
				</div><!-- /col -->
			</div><!-- /row -->
		</div><!-- /container -->
	</div><!-- /container-fluid -->
	<div class="container top-main">
		<div class="row pt10 pb10">
			<div class="col-md-6 text-left">
				<a class="navbar-brand logo1" href="<?php echo G5_URL ?>" class="logo" alt="<?php echo $config['cf_title']; ?>"><img src="<?php echo G5_THEME_URL ?>/img/logo.png" alt="<?php echo $config['cf_title']; ?>"></a>
			</div><!-- /col -->
			<div class="col-md-6 text-right pt10 pr20">
				<a href="http://ety.kr/board/theme_update" target="_blank"><span>테마자료실</span></a> | 
				<a href="http://ety.kr/board/free_template" target="_blank"><span>무료템플릿</span></a> | 
				<a href="http://www.softzone.co.kr" target="_blank"><span>포트폴리오</span></a> | 
				<a href="http://ety.kr/board/qa" target="_blank"><span>질문게시판</span></a>
			</div><!-- /col -->
		</div><!-- /row -->
	</div>
	<div class="container">
	<nav class="navbar navbar-expand-lg navbar-dark bg-dark pc">
		<button class="navbar-toggler navbar-toggler-left" type="button" data-toggle="collapse" data-target="#navbarResponsive" aria-controls="navbarResponsive" aria-expanded="false" aria-label="Toggle navigation">
		  <span class="navbar-toggler-icon"></span>
		</button>
		<div class="collapse navbar-collapse" id="navbarResponsive">
		  <ul class="navbar-nav ml-auto">
				<?php
				$sql = " select *
							from {$g5['menu_table']}
							where me_use = '1'
							  and length(me_code) = '2'
							order by me_order, me_id ";
				$result = sql_query($sql, false);
				$gnb_zindex = 999; // gnb_1dli z-index 값 설정용
				$menu_datas = array();
				for ($i=0; $row=sql_fetch_array($result); $i++) {
					$menu_datas[$i] = $row;

					$sql2 = " select *
								from {$g5['menu_table']}
								where me_use = '1'
								  and length(me_code) = '4'
								  and substring(me_code, 1, 2) = '{$row['me_code']}'
								order by me_order, me_id ";
					$result2 = sql_query($sql2);
					for ($k=0; $row2=sql_fetch_array($result2); $k++) {
						$menu_datas[$i]['sub'][$k] = $row2;
					}
				}
				$i = 0;
				foreach( $menu_datas as $row ){
					if( empty($row) ) continue; 
				?>			
					<?php if($row['sub']['0']) { ?>
						<li class="nav-item dropdown">
							<a class="nav-link dropdown-toggle" href="<?php echo $row['me_link']; ?>" id="navbarDropdownBlog" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" target="_<?php echo $row['me_target']; ?>">
							<?php echo $row['me_name'] ?>
							</a>
								<!-- 서브 -->
								<ul class="dropdown-menu dropdown-menu-right" aria-labelledby="navbarDropdownPortfolio">
									<?php
									// 하위 분류
									$k = 0;
									foreach( (array) $row['sub'] as $row2 ){

									if( empty($row2) ) continue; 

									?>
									<a class="dropdown-item" href="<?php echo $row2['me_link']; ?>" target="_<?php echo $row2['me_target']; ?>"><?php echo $row2['me_name'] ?></a>

									<?php
									$k++;
									}   //end foreach $row2

									if($k > 0)
									echo '</ul>'.PHP_EOL;
									?>
					<?php }else{?>
						<li class="nav-item">
						<a class="nav-link" href="<?php echo $row['me_link']; ?>" target="_<?php echo $row['me_target']; ?>"><?php echo $row['me_name'] ?></a>
						</li>
					<?php }?>
				</li>
				
				<?php
				$i++;
				}   //end foreach $row

				if ($i == 0) {  ?>
					<li class="gnb_empty">메뉴 준비 중입니다.<?php if ($is_admin) { ?> <br><a href="<?php echo G5_ADMIN_URL; ?>/menu_list.php">관리자모드 &gt; 환경설정 &gt; 메뉴설정</a>에서 설정하실 수 있습니다.<?php } ?></li>
				<?php } ?>
				<!-- pc 검색 -->
				<li class="pc">
					<i class="search fa fa-search search-btn"></i>
					<div class="search-open">
						<form name="fsearchbox" method="get" action="<?php echo G5_BBS_URL ?>/search.php" onsubmit="return fsearchbox_submit(this);">
						<input type="hidden" name="sfl" value="wr_subject||wr_content">
						<input type="hidden" name="sop" value="and">
						<div class="input-group animated fadeInDown">
							<input type="text" name="stx" id="sch_stx" class="form-control searchbox" placeholder="Search">
							<span class="input-group-btn">
								<button type='submit' id="sch_submit" class="btn01" type="button">Go</button>
							</span>
						</div>
						</form>
						<script>
						function fsearchbox_submit(f)
						{
							if (f.stx.value.length < 2) {
								alert("검색어는 두글자 이상 입력하십시오.");
								f.stx.select();
								f.stx.focus();
								return false;
							}

							// 검색에 많은 부하가 걸리는 경우 이 주석을 제거하세요.
							var cnt = 0;
							for (var i=0; i<f.stx.value.length; i++) {
								if (f.stx.value.charAt(i) == ' ')
									cnt++;
							}

							if (cnt > 1) {
								alert("빠른 검색을 위하여 검색어에 공백은 한개만 입력할 수 있습니다.");
								f.stx.select();
								f.stx.focus();
								return false;
							}

							return true;
						}
						</script>

					</div>				
				</li>
		  </ul>
		</div>
	  </div>
	</nav>




<!-------------------------- 모바일 네비게이션 메뉴 -------------------------->
<div class="mobile">
	<div class="page-wrapper chiller-theme">
		<div class="mobile-logo">
			<a class="logo-img" href="<?php echo G5_URL ?>" class="logo" alt="<?php echo $config['cf_title']; ?>">ETY.KR</a>
		</div>
		<div class="ety-main">
			<div class="ety-dark">
				<div class="ety-dark-left">
					<a class="ety-button ety-dark ety-xlarge" id="show-sidebar-click">
						<i class="fa fa-bars" aria-hidden="true"></i>
					</a>
					<div class="ety-container"></div>
				</div><!-- 우측슬라이드 -->
				<div class="ety-dark-right">
					<!-- 마이페이지 만들것 --><a href="javascript:void(0)"><i class="fa fa-user" aria-hidden="true"></i></a>
					<!-- //우측슬라이드 -->
				</div>
			</div><!-- /ety-dark -->
		</div><!-- /ety-main -->
		<!-- sidebar menu -->
		<div id="sidebar" class="sidebar-wrapper" style="z-index:9999">
			<div class="sidebar-content">
			  <div class="sidebar-brand">
				<div class="social-btn">
					<a href="https://www.facebook.com/leejongo" target="_blank" class="btn btn-social-icon btn-facebook"><i class="fab fa-facebook"></i></a>
					<a href="https://www.instagram.com/site_developer/" target="_blank" class="btn btn-social-icon btn-instagram"><i class="fab fa-instagram"></i></a>
					<a href="https://www.facebook.com/leejongo" target="_blank" class="btn btn-social-icon btn-twitter"><i class="fab fa-twitter"></i></a>
                    <?php if($is_member){ ?>
					<a href="https://www.facebook.com/leejongo" target="_blank" class="btn btn-social-icon btn-twitter"><i class="fa fa-envelope"></i></a>
					
                        <div class="memo1">
                            <a href="<?php echo G5_BBS_URL ?>/memo.php" target="_blank"><span class="badge badge-pill badge-success notification"><?php echo $memo_count?></span></a>
                        </div>
					</a>
					<?php } ?>
                </div>
				<div id="close-sidebar">
				  <i class="fas fa-times"></i>
				</div>
			  </div>

			<?php echo outlogin('theme/basic_v10_mobile'); // 외부 로그인, 테마의 스킨을 사용하려면 스킨을 theme/basic 과 같이 지정 ?>

			<!-- search  -->
			<form name="fsearchbox" method="get" action="<?php echo G5_BBS_URL ?>/search.php" onsubmit="return fsearchbox_submit(this);">
			<input type="hidden" name="sfl" value="wr_subject||wr_content">
			<input type="hidden" name="sop" value="and">
				<div class="sidebar-search">
				<div>
				  <div class="input-group">
					<input type="text" name="stx" id="sch_stx" class="form-control search-menu" placeholder="Search">
					<button type='submit' id="sch_submit" type="button">
					  <span class="input-group-text">
						<i class="fa fa-search" aria-hidden="true"></i>
					  </span>
					</button>
				  </div>
				</div>
				</div>
			</form>
			<script>
			function fsearchbox_submit(f)
			{
				if (f.stx.value.length < 2) {
					alert("검색어는 두글자 이상 입력하십시오.");
					f.stx.select();
					f.stx.focus();
					return false;
				}

				// 검색에 많은 부하가 걸리는 경우 이 주석을 제거하세요.
				var cnt = 0;
				for (var i=0; i<f.stx.value.length; i++) {
					if (f.stx.value.charAt(i) == ' ')
						cnt++;
				}

				if (cnt > 1) {
					alert("빠른 검색을 위하여 검색어에 공백은 한개만 입력할 수 있습니다.");
					f.stx.select();
					f.stx.focus();
					return false;
				}

				return true;
			}
			</script>

			  <!-- sidebar-search  -->
			  <div class="sidebar-menu">
				<ul>

					<li class="header-menu">
					<span>CATEGORY</span>
					</li>

					<li class="sidebar-dropdown">
					<?php
					foreach( $menu_datas as $row ){
						if( empty($row) ) continue; 
							if($row['sub']['0']) {
					?>
							<a href="#">
                              <i class="far fa-comment-dots"></i>
							  <span><?php echo $row['me_name']?></span>
							  
							</a>
							<div class="sidebar-submenu">
							  <ul>
								<?php
									// 하위 분류
									$k = 0;
									foreach( (array) $row['sub'] as $row2 ){
										if( empty($row2) ) continue; 
									?>
									<li>
										<a href="<?php echo $row2['me_link']; ?>"><span><?php echo $row2['me_name'] ?></span></a>
									</li>
									<?php
									$k++;
									}//end foreach $row2
								if($k > 0)
								echo '</ul>'.PHP_EOL;
								echo "</div>";
							}
					}//foreach
					?>
					</li>
				</ul>
			  </div>
			  <!-- sidebar-menu  -->
			</div>
			<!-- sidebar-content  -->
		</div>
		<!-- //sidebar menu -->
	</div><!-- //page-wrapper -->
</div><!-- //mobile -->
<!-------------------------- //모바일 네비게이션 메뉴 -------------------------->


	<div class="container">
		<div class="row">
			<div class="col-md-9 col-xs-12 layout-left pt10 pb50 main-container">
