///////////////////////////////////////////////////////////////////////////
// Slider
///////////////////////////////////////////////////////////////////////////
/* global settings, $, adobeDPS */
window.libBanner = (function(lib) {
  // lib is the object that will be stored in window.libBanner

  ///////////////////////////////////////////////////////////////////////////
  // iOS Version Matching
  ///////////////////////////////////////////////////////////////////////////
  if (/iP(hone|od|ad)/.test(navigator.platform)) {
    // supports iOS 2.0 and later: <http://bit.ly/TJjs1V>
    var v = (navigator.appVersion).match(/OS (\d+)_(\d+)_?(\d+)?/);
    lib.ios_version = [parseInt(v[1], 10), parseInt(v[2], 10), parseInt(v[3] || 0, 10)];
  } else {
    // for testing use 7.0.4
    lib.ios_version = [7, 0, 1];
  }

  lib.ios_version.toString = function() {
    return this.join(".");
  };

  lib.is_version = function is_version(version_expr) {
    /* version_expr looks like:
    *     "7"  same as "=7"
    *     "=7" major version must be 7
    *     "=7.0" major version must be 7, minor must be 0
    *     "<7" major version must less than 7
    *     "<=6" major version must be less than or equal to 6
    *     "!7" major version must be anyhting other than 7
    *     "!7.0.4" full version must be anything other than 7.0.4
    *
    *  Note: a blank version_expr will always return true.
    */

    if (!lib.ios_version) return true;
    if (!version_expr) return true;

    // version looks like [7, 0, 4];
    var version = version_expr.replace(/^[<>=!]*/g, "").split(".").map(function(i) {
          return parseInt(i, 10);
        });

    function eq() {
      for (var i = 0; i < version.length; i++) {
        if (lib.ios_version[i] != version[i]) return false;
      }
      return true;
    }
    function lt() {
      for (var i = 0; i < version.length; i++) {
        if (lib.ios_version[i] > version[i]) return false;
        if (lib.ios_version[i] < version[i]) return true;
      }
      return false;
    }
    function gt() {
      for (var i = 0; i < version.length; i++) {
        if (lib.ios_version[i] < version[i]) return false;
        if (lib.ios_version[i] > version[i]) return true;
      }
      return false;
    }

    if (version_expr.slice(0, 2) == "<=") {
      return lt() || eq();
    } else if (version_expr.slice(0, 2) == ">=") {
      return gt() || eq();
    } else if (version_expr.slice(0, 1) == "<") {
      return lt();
    } else if (version_expr.slice(0, 1) == ">") {
      return gt();
    } else if (version_expr.slice(0, 1) == "!") {
      return !eq();
    } else {
      return eq();
    }
  };


  ///////////////////////////////////////////////////////////////////////////
  // Slider
  ///////////////////////////////////////////////////////////////////////////
  var SlideshowGallery = lib.SlideshowGallery = function(root_element) {
    /*
    *  To remove slides based on ios Version add a data-ios-version
    *   attribute to the slide (div is "slide" class) which will be passed to
    *   lib.is_version().
    */

    this.root = root_element || document.querySelector(".carousel");

    // Before getting started, remove slides that don't match the current version of ios
    [].forEach.call(this.root.querySelectorAll(".slide"), function(elem) {
      if (!lib.is_version(elem.dataset.iosVersion)) {
        elem.parentNode.removeChild(elem);
      }
    });

    // data-loop-type="" | options: "infinite", "scrollback"
    this.loopType = this.root.dataset.loopType || "infinite";

    this.currentTranslation = 0;
    this.sliderWidth = this.root.offsetWidth;
    this.slidesObject = this.root.querySelectorAll('.slide');

    for (var i = 0; i < this.slidesObject.length; i++){
       this.slidesObject[i].style.width = this.sliderWidth + 'px';
       this.slidesObject[i].dataset.translation = 0;
    }

    this.slides = this.root.querySelector('.slides');
    this.numSlides = this.slides.children.length;
    this.slides.style.width = (this.sliderWidth * this.numSlides) + 'px';

    this.leftMostSlideIndex = 0;
    this.rightMostSlide = this.slides[this.numSlides - 1];
    this.allSlidesWidth = this.numSlides * this.sliderWidth;
    this._cycle_slides(0);
  };

  SlideshowGallery.prototype._resolve_slide_index = function(i) {
    i = i % this.numSlides;
    if (i < 0) i += this.numSlides;
    return i;
  };

  SlideshowGallery.prototype._cycle_slides = function(direction) {
    if (this.loopType != "infinite") return;

    var i, slide;

    if (direction && direction > 0) {
      // going right
      if (this.currentTranslation <= this.maxTranslation) {
        i = this._resolve_slide_index(this.leftMostSlideIndex);
        slide = this.slidesObject[i];

        slide.dataset.translation = +slide.dataset.translation + this.allSlidesWidth;
        slide.style.webkitTransform = "translate3d(" + slide.dataset.translation + "px,0,0)";
        this.leftMostSlideIndex += 1;
      }
    }
    else if (direction && direction < 0) {
      // going left
      if (this.currentTranslation >= this.minTranslation) {
        i = this._resolve_slide_index(this.leftMostSlideIndex + this.numSlides - 1);
        slide = this.slidesObject[i];

        slide.dataset.translation = +slide.dataset.translation - this.allSlidesWidth;
        slide.style.webkitTransform = "translate3d(" + slide.dataset.translation + "px,0,0)";
        this.leftMostSlideIndex -= 1;
      }
    }

    this.minTranslation = this.leftMostSlideIndex * -this.sliderWidth;
    this.maxTranslation = (this.leftMostSlideIndex + this.numSlides - 1) * -this.sliderWidth;
  };

  SlideshowGallery.prototype.slideNext = function() {
    if (this.numSlides < 2) return this;

    this._cycle_slides(+1);
    this.currentTranslation -= this.sliderWidth;

    // Wrap around.
    if (this.loopType != "infinite") {
      if (this.currentTranslation == this.numSlides * -this.sliderWidth) {
        this.currentTranslation = 0;
      }
    }

    this.slides.style.webkitTransform =
      'translate3d(' + this.currentTranslation + 'px, 0 ,0)';
    return this;
  };

  SlideshowGallery.prototype.slidePrev = function() {
    if (this.numSlides < 2) return this;

    this._cycle_slides(-1);
    this.currentTranslation += this.sliderWidth;

    // Wrap around.
    if (this.loopType != "infinite") {
      if (this.currentTranslation == this.sliderWidth) {
        this.currentTranslation = (this.numSlides - 1) * -this.sliderWidth;
      }
    }

    this.slides.style.webkitTransform =
      'translate3d(' + this.currentTranslation + 'px, 0 ,0)';
    return this;
  };

  SlideshowGallery.prototype.slideEvery = function(ms) {
    var that = this;
    this.slide_every_delay = this.slide_every_delay || ms;
    this.slide_interval = window.setInterval(function(){
      that.slideNext();
    }, this.slide_every_delay);
    return this;
  };

  SlideshowGallery.prototype.cancelAutoSlide = function() {
    window.clearInterval(this.slide_interval);
    return this;
  };

  SlideshowGallery.prototype.enableTouch = function() {
    if (this.numSlides < 2) return this;

    var gallery = this,
        slides = this.slides,
        startX = 0,
        deltaX = 0,
        startTime = null,
        startTouchID = null;

    slides.addEventListener("touchstart", function(ev) {
      if (ev.changedTouches.length != 1) return;

      gallery.cancelAutoSlide();

      startTouchID = ev.changedTouches[0].identifier;
      startTime = +new Date();
      startX = ev.changedTouches[0].pageX;
      deltaX = 0;

      slides.style.webkitTransition = "0s all";
    });

    slides.addEventListener("touchmove", function(ev) {
      ev.preventDefault();

      var touch = null;
      for (var i=ev.changedTouches.length; i--;) {
        if (ev.changedTouches[i].identifier == startTouchID) {
          touch = ev.changedTouches[i];
        }
      }
      if (touch === null) return;

      deltaX = touch.pageX - startX;

      var minTranslation = -gallery.sliderWidth * (gallery.numSlides-1),
          newTranslation = gallery.currentTranslation + deltaX;

      gallery._cycle_slides(-deltaX);

      if (gallery.loopType != "infinite") {
        if (newTranslation < minTranslation) {
          newTranslation = minTranslation + ((newTranslation - minTranslation) * 0.4);
        }
        else if (newTranslation > 0) {
          newTranslation *= 0.4;
        }
      }

      slides.style.webkitTransform =
        'translate3d(' + newTranslation + 'px, 0 ,0)';
    });

    slides.addEventListener("touchend", function(ev) {
      var done = false;
      for (var i=ev.changedTouches.length; i--;) {
        if (ev.changedTouches[i].identifier == startTouchID) done = true;
      }

      if (!done) return;

      var duration = new Date() - startTime;
      if (duration < 500 && Math.abs(deltaX) > 80) {
        var direction = (deltaX > 0) ? 1 : -1;
        deltaX = gallery.sliderWidth * direction;
      }
      startTouchID = null;
      gallery.currentTranslation += deltaX;
      gallery.slideToNearest(function() {
        slides.style.webkitTransition = "1s all";
        gallery.cancelAutoSlide().slideEvery();
      });
    });
    return this;
  };

  SlideshowGallery.prototype.slideToNearest = function(cb) {
    this.slides.style.webkitTransition = "0.25s all";

    var nearest_slide = Math.round(-1 * this.currentTranslation / this.sliderWidth);
    if (this.loopType != "infinite") {
      nearest_slide = Math.max(Math.min(nearest_slide, this.slidesObject.length-1), 0);
    }

    this.currentTranslation = -1 * nearest_slide * this.sliderWidth;
    this.slides.style.webkitTransform =
      'translate3d(' + this.currentTranslation + 'px, 0 ,0)';

    // don't call the callback for 350ms extra to allow for any lag in the animation
    setTimeout(cb, 350);
  };

  return lib;

})(window.libBanner || {});