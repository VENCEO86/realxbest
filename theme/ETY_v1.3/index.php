<?php
define('_INDEX_', true);
if (!defined('_GNUBOARD_')) exit; // 개별 페이지 접근 불가

if (G5_IS_MOBILE) {
    include_once(G5_THEME_MOBILE_PATH.'/index.php');
    return;
}

include_once(G5_THEME_PATH.'/head.php');

?>

<!-- 슬라이드 -->
<div class="ht10"></div>
<header>
  <div id="carouselExampleIndicators" class="carousel slide" data-ride="carousel">
	<ol class="carousel-indicators">
	  <li data-target="#carouselExampleIndicators" data-slide-to="0" class="active"></li>
	  <li data-target="#carouselExampleIndicators" data-slide-to="1"></li>
	  <li data-target="#carouselExampleIndicators" data-slide-to="2"></li>
	</ol>
	<div class="carousel-inner" role="listbox">
	  <div class="carousel-item active" style="background-image: url('<?php echo G5_THEME_URL?>/img/banner/banner1.png')">
		<div class="carousel-caption d-none d-md-block">
		<a href="http://ety.kr/board/ety_theme_manual" target="_blank">
			<h3 class="ko_20_main">무료배포 에티테마</h3>
			<p class="white">무료로 배포되는 에티테마 v1.3 입니다.</p>
		</a>
		</div>
	  </div>
	  <div class="carousel-item" style="background-image: url('<?php echo G5_THEME_URL?>/img/banner/banner2.png')">
		<div class="carousel-caption d-none d-md-block">
			<a href="http://ety.kr/board/ety_theme_manual" target="_blank">
			<h3 class="ko_20_main">아무것도 몰라요~!</h3>
			<p class="white">그누보드와 에티테마를 처음 사용하는 분들</p>
			</a>
		</div>
	  </div>
	  <div class="carousel-item" style="background-image: url('<?php echo G5_THEME_URL?>/img/banner/banner3.png')">
		<div class="carousel-caption d-none d-md-block">
		<a href="http://ety.kr/board/PAY" target="_blank">
		  <h3 class="ko_20 black">프리미엄 테마 자료실 바로가기</h3>
		  
		</a>
		</div>
	  </div>
	</div>
	<a class="carousel-control-prev" href="#carouselExampleIndicators" role="button" data-slide="prev">
	  <span class="carousel-control-prev-icon" aria-hidden="true"></span>
	  <span class="sr-only">Previous</span>
	</a>
	<a class="carousel-control-next" href="#carouselExampleIndicators" role="button" data-slide="next">
	  <span class="carousel-control-next-icon" aria-hidden="true"></span>
	  <span class="sr-only">Next</span>
	</a>
  </div>
</header>

<!-------------------------- 학습자료 -------------------------->
<div class="head-title-2">
	<h2 class="h2-title-bottom">학습자료</h2>
	<a href="<?php echo G5_BBS_URL ?>/board.php?bo_table=gallery" class="btn-more"><span class="sound_only">학습자료</span><i class="fa fa-plus"></i></a>
</div>
<div class="row">
	<div class="col-md-12">
			<!-- tab menu -->
		  <ul class="nav nav-tabs nav-justified" role="tablist">
			<li class="nav-item">
			  <a class="nav-link active" data-toggle="tab" href="#S1">VueJS</a>
			</li>
			<li class="nav-item">
			  <a class="nav-link" data-toggle="tab" href="#S2">ReactJS</a>
			</li>
			<li class="nav-item">
			  <a class="nav-link" data-toggle="tab" href="#S3">NodeJS</a>
			</li>
		  </ul>
		  <!-- Tab panes -->
		  <div class="tab-content">
			<div id="S1" class="tab-pane active"><br>
				<div class="row">
					<div class="col-md-12"><?php echo latest('theme/sub_gallery_3', 'gallery', 4, 16);?></div>
				</div>
			</div>
			<div id="S2" class="tab-pane fade"><br>
				<div class="row">
					<div class="col-md-12"><?php echo latest('theme/sub_gallery_3', 'gallery', 4, 23);?></div>
				</div>
			</div>
			<div id="S3" class="tab-pane fade"><br>
				<div class="row">
					<div class="col-md-12"><?php echo latest('theme/sub_gallery_3', 'gallery', 4, 23);?></div>
				</div>
			</div>
		  </div>
	</div><!-- /col -->
</div><!-- /row -->

<!-------------------------- 커뮤니티 -------------------------->
<div class="head-title-2">
	<h2 class="h2-title-bottom">커뮤니티</h2>
	<a href="<?php echo G5_BBS_URL ?>/board.php?bo_table=notice" class="btn-more"><span class="sound_only">커뮤니티</span><i class="fa fa-plus"></i></a>
</div>
<div class="row">
	<div class="col-md-12">
			<!-- tab menu -->
		  <ul class="nav nav-tabs nav-justified" role="tablist">
			<li class="nav-item">
			  <a class="nav-link active" data-toggle="tab" href="#t1">공지사항</a>
			</li>
			<li class="nav-item">
			  <a class="nav-link" data-toggle="tab" href="#t2">자유게시판</a>
			</li>
			<li class="nav-item">
			  <a class="nav-link" data-toggle="tab" href="#t3">질문게시판</a>
			</li>
		  </ul>
		  <!-- Tab panes -->
		  <div class="tab-content">
			<div id="t1" class="tab-pane active"><br>
				<div class="row">
					<div class="col-md-12"><?php echo latest('theme/sub_text_1', 'notice', 12, 23);?></div>
				</div>
			</div>
			<div id="t2" class="tab-pane fade"><br>
				<div class="row">
					<div class="col-md-12"><?php echo latest('theme/sub_text_1', 'free', 12, 23);?></div>
				</div>
			</div>
			<div id="t3" class="tab-pane fade"><br>
				<div class="row">
					<div class="col-md-12"><?php echo latest('theme/sub_text_1', 'qa', 12, 23);?></div>
				</div>
			</div>
		  </div>
	</div><!-- /col -->
</div><!-- /row -->

<?php

/***********************************
자유게시판 분류(웃긴글,일반,잡담)
자유게시판에 분류가 있어야 사용 가능합니다.
자신의 커뮤니티에 맞게 수정해서 사용해주세요.


[일반텍스트 최신게시물]
<?php echo latest_options('theme/etykr_text', 'free', 12, 23,'','웃긴글');?>

[갤러리 최신게시물]
<?php echo latest('theme/sub_gallery_3', 'gallery', 4, 16, '', '웃긴글');?>


***********************************/
?>

<div class="head-title-2">
	<h2 class="h2-title-bottom">이야기</h2>
	<a href="<?php echo G5_BBS_URL ?>/board.php?bo_table=free" class="btn-more"><span class="sound_only">이야기</span><i class="fa fa-plus"></i></a>
</div>
<div class="row">
	<div class="col-md-12">
			<!-- tab menu -->
		  <ul class="nav nav-tabs nav-justified" role="tablist">
			<li class="nav-item">
			  <a class="nav-link active" data-toggle="tab" href="#f1">웃긴글</a>
			</li>
			<li class="nav-item">
			  <a class="nav-link" data-toggle="tab" href="#f2">일반</a>
			</li>
			<li class="nav-item">
			  <a class="nav-link" data-toggle="tab" href="#f3">잡담</a>
			</li>
		  </ul>
		  <!-- Tab panes -->
		  <div class="tab-content">
			<div id="f1" class="tab-pane active"><br>
				<div class="row">
					<div class="col-md-12"><?php echo latest_options('theme/etykr_text', 'free', 12, 23,'','웃긴글');?></div>
				</div>
			</div>
			<div id="f2" class="tab-pane fade"><br>
				<div class="row">
					<div class="col-md-12"><?php echo latest_options('theme/etykr_text', 'free', 12, 23,'','일반');?></div>
				</div>
			</div>
			<div id="f3" class="tab-pane fade"><br>
				<div class="row">
					<div class="col-md-12"><?php echo latest_options('theme/etykr_text', 'free', 12, 23,'','잡담');?></div>
				</div>
			</div>
		  </div>
	</div><!-- /col -->
</div><!-- /row -->

<!-------------------------- ./분류 끝 -------------------------->



<!-- 갤러리 슬라이드 -->
<div class="ht10"></div>
<?php echo latest('theme/main_gallery', 'gallery', 12, 23);?>

<!-- 다중 갤러리 -->
<div class="head-title-2">
	<h2 class="h2-title-bottom">미디어</h2>
	<a href="<?php echo G5_BBS_URL ?>/board.php?bo_table=gallery" class="btn-more"><span class="sound_only">미디어</span><i class="fa fa-plus"></i></a>
</div>
<div class="row">
	<div class="col-md-12">
			<!-- tab menu -->
		  <ul class="nav nav-tabs nav-justified" role="tablist">
			<li class="nav-item">
			  <a class="nav-link active" data-toggle="tab" href="#gtt1">유튜브 4K 영상</a>
			</li>
			<li class="nav-item">
			  <a class="nav-link" data-toggle="tab" href="#gtt2">유머게시판</a>
			</li>
			<li class="nav-item">
			  <a class="nav-link" data-toggle="tab" href="#gtt3">KPOP</a>
			</li>
		  </ul>
		  <!-- Tab panes -->
		  <div class="tab-content">
			<div id="gtt1" class="tab-pane active"><br>
				<div class="row">
					<!-- 서브갤러리 --><div class="col-md-12"><?php echo latest('theme/sub_gallery_3', 'gallery', 8, 16);?></div>
				</div>
			</div>
			<div id="gtt2" class="tab-pane fade"><br>
				<div class="row">
					<!-- 서브갤러리 --><div class="col-md-12"><?php echo latest('theme/sub_gallery_3', 'gallery', 8, 16);?></div>
				</div>
			</div>
			<div id="gtt3" class="tab-pane fade"><br>
				<div class="row">
					<div class="col-md-12"><?php echo latest('theme/sub_gallery_3', 'gallery', 8, 16);?></div>
				</div>
			</div>
		  </div>
	</div><!-- /col -->
</div><!-- /row -->

<!-- 다중웹진 -->
<div class="head-title-2">
	<h2 class="h2-title-bottom">매거진</h2>
	<a href="<?php echo G5_BBS_URL ?>/board.php?bo_table=gallery" class="btn-more"><span class="sound_only">매거진</span><i class="fa fa-plus"></i></a>
</div>
<div class="row">
	<div class="col-md-12">
			<!-- tab menu -->
		  <ul class="nav nav-tabs nav-justified" role="tablist">
			<li class="nav-item">
			  <a class="nav-link active" data-toggle="tab" href="#ggt1">영화예고편</a>
			</li>
			<li class="nav-item">
			  <a class="nav-link" data-toggle="tab" href="#ggt2">뉴스,이슈</a>
			</li>
			<li class="nav-item">
			  <a class="nav-link" data-toggle="tab" href="#ggt3">얼리어답터</a>
			</li>
		  </ul>
		  <!-- Tab panes -->
		  <div class="tab-content">
			<div id="ggt1" class="tab-pane active"><br>
				<div class="row">
					<!-- 서브갤러리 --><div class="col-md-12"><?php echo latest('theme/sub_gallery_2', 'gallery', 4, 16);?></div>
				</div>
			</div>
			<div id="ggt2" class="tab-pane fade"><br>
				<div class="row">
					<!-- 서브갤러리 --><div class="col-md-12"><?php echo latest('theme/sub_gallery_2', 'gallery', 4, 16);?></div>
				</div>
			</div>
			<div id="ggt3" class="tab-pane fade"><br>
				<div class="row">
					<div class="col-md-12"><?php echo latest('theme/sub_gallery_2', 'gallery', 4, 16);?></div>
				</div>
			</div>
		  </div>
	</div><!-- /col -->
</div><!-- /row -->

<div class="head-title">
	<h2 class="h2-title-bottom">자료실</h2>
	<a href="<?php echo G5_BBS_URL ?>/board.php?bo_table=gallery" class="btn-more"><span class="sound_only">자료실</span><i class="fa fa-plus"></i></a>
</div>

<div class="row main_gallery_row">
	<div class="col-md-4 col-sm-12 col-12 main_gallery_col"><?php echo latest('theme/main_latest_small_1', 'gallery', 5, 23);?></div>
	<div class="col-md-4 col-sm-6 col-6 main_gallery_col"><?php echo latest('theme/main_latest_small_1', 'gallery', 5, 23);?></div>
	<div class="col-md-4 col-sm-6 col-6 main_gallery_col"><?php echo latest('theme/main_latest_small_1', 'gallery', 5, 23);?></div>
</div>

<div class="ht50"></div>

<?php
include_once(G5_THEME_PATH.'/tail.php');
?>