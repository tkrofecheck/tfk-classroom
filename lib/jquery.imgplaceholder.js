(function($) {

var $window = $(window),
    scrollTop = 0,
    viewHeight = $window.height();

function is_in_range($img, top, bottom) {
  var img_top = $img.offset().top,
      img_bottom = img_top + $img.height();

  return img_bottom > top && img_top < bottom;
}
function is_onscreen($img) {
  return is_in_range($img,
                     scrollTop,
                     scrollTop + viewHeight);
}
function is_just_offscreen($img) {
  var margin = viewHeight * 1.3;
  return is_in_range($img,
                     scrollTop - margin,
                     scrollTop + viewHeight + margin);
}
function show_img($img) {
  var img_url = $img.data("realSrc"),
      real_img;

  if ($img.attr('src') == img_url) return;

  real_img = new Image();
  real_img.src = img_url;
  
  function show_real_img() {
    $img.attr('src', img_url);
  }

  if (real_img.complete) show_real_img();
  else $(real_img).on("load", show_real_img);
}
function hide_img($img) {
  var img_url = $img.data("placeholderSrc");
  if ($img.attr('src') == img_url) return;

  $img.attr('src', img_url);
}

function show_as_needed($img) {
  setTimeout(function() {
    if (is_onscreen($img)) {
      show_img($img);
    }
    else if (is_just_offscreen($img)) {
      setTimeout(function() {
        if (is_just_offscreen($img)) {
          show_img($img);
        }
      }, 500);
    }
    else {
      hide_img($img);
    }
  });
}

$.fn.imgPlaceholder = function() {
  this.each(function() {
    var $img = $(this),
        real_url = $img.data("realSrc");

    if (!real_url) return;
    $img.data("placeholderSrc", $img.attr("src"));
    $img.addClass("imgPlaceholder-trackScrolling");
    
    show_as_needed($img);
    
  });
  return this;
}

$window.on("scroll", function() {
  scrollTop = $window.scrollTop();
  console.log("SCROLL EVENT");

  $(".imgPlaceholder-trackScrolling").each(function() {
    var $img = $(this);
    show_as_needed($img);
  });
});

})(jQuery);
