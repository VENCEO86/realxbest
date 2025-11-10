$(function() {

});

jQuery(document).ready(function () {

    jQuery(function() {
        $("#top_btn").on("click", function() {
            $("html, body").animate({scrollTop:0}, '500');
            return false;
        });
    });

	// parallax-box
	jQuery('.parallax-window').parallax({imageSrc:'<?php echo G5_THEME_URL?>/img/bg-5.jpg'});
	jQuery(function () {
		jQuery('[data-toggle="tooltip"]').tooltip()
	});

	//owl
	jQuery("#owl1").owlCarousel({
		loop:true,
		margin:10,
		nav:false,
		responsive:{
			0:{
				items:2
			},
			600:{
				items:3
			},
			1000:{
				items:4
			}
		}
	});
	// owl2
	jQuery('#owl2').owlCarousel({
		items:1,
		margin:10,
		autoHeight:true,
		responsive:{
			0:{
				items:1
			},
			600:{
				items:1
			},
			1000:{
				items:1
			}
		}
	});
	// owl3
	jQuery('#owl3').owlCarousel({
		items:1,
		margin:10,
		autoHeight:true,
		responsive:{
			0:{
				items:1
			},
			600:{
				items:1
			},
			1000:{
				items:1
			}
		}
	});
	// owl4
	jQuery('#owl4').owlCarousel({
		items:1,
		margin:3,
		autoHeight:true,
		responsive:{
			0:{
				items:1
			},
			600:{
				items:1
			},
			1000:{
				items:1
			}
		}
	});
	// countdown
	'use strict';			
	jQuery('.countdown').final_countdown({
		'start': 1362139200,
		'end': 1388461320,
		'now': 1387461319        
	});
	//search
	jQuery('.search').on("click", function () {
		if(jQuery('.search-btn').hasClass('fa-search')){
			jQuery('.search-open').fadeIn(500);
			jQuery('.search-btn').removeClass('fa-search');
			jQuery('.search-btn').addClass('fa-times');
		} else {
			jQuery('.search-open').fadeOut(500);
			jQuery('.search-btn').addClass('fa-search');
			jQuery('.search-btn').removeClass('fa-times');
		}
	});

	jQuery(function ($) {
		$(".sidebar-dropdown > a").click(function() {
			$(".sidebar-submenu").slideUp(200);
			if (
				$(this)
				.parent()
				.hasClass("active")
			) {
				$(".sidebar-dropdown").removeClass("active");
				$(this)
				.parent()
				.removeClass("active");
			} else {
				$(".sidebar-dropdown").removeClass("active");
				$(this)
				.next(".sidebar-submenu")
				.slideDown(200);
			$(this)
				.parent()
				.addClass("active");
			}
		});

		$("#close-sidebar").click(function() {
			$(".page-wrapper").removeClass("toggled");
			$("body").removeClass("overlay");
		});

		$("#show-sidebar-click").click(function() {
			$(".page-wrapper").addClass("toggled");
		});
	  
	});


});