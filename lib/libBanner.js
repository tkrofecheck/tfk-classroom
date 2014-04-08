/* global settings, $, adobeDPS */
window.libBanner = (function() {
  // lib is the object that will be stored in window.libBanner
  var lib = {};


  
  /////////////////////////////////////////////////////////////////////////// 
  // Utility Functions
  ///////////////////////////////////////////////////////////////////////////
  
  // Returns a wrapper function that allows fn() to be called exactly once
  function once(fn) {
    var called = false;
    function wrapper() {
      if (called) return;
      called = true;
      return fn.apply(this, arguments);
    }
    return wrapper;
  }



  /////////////////////////////////////////////////////////////////////////// 
  // Banner View Count
  ///////////////////////////////////////////////////////////////////////////
  var view_count = parseInt(localStorage.bannerViewCount || 0, 10);
  view_count += 1;
  lib.view_count = view_count;
  localStorage.bannerViewCount = view_count;



  /////////////////////////////////////////////////////////////////////////// 
  // iOS Version Matching
  ///////////////////////////////////////////////////////////////////////////
  if (/iP(hone|od|ad)/.test(navigator.platform)) {
    // supports iOS 2.0 and later: <http://bit.ly/TJjs1V>
    var v = (navigator.appVersion).match(/OS (\d+)_(\d+)_?(\d+)?/);
    lib.ios_version = [parseInt(v[1], 10), parseInt(v[2], 10), parseInt(v[3] || 0, 10)];
  }
  else {
    // for testing use 7.0.4
    lib.ios_version = [7, 0, 1];
  }
  
  lib.ios_version.toString = function() { return this.join("."); }

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
    }
    else if (version_expr.slice(0, 2) == ">=") {
      return gt() || eq();
    }
    else if (version_expr.slice(0, 1) == "<") {
      return lt();
    }
    else if (version_expr.slice(0, 1) == ">") {
      return gt();
    }
    else if (version_expr.slice(0, 1) == "!") {
      return !eq();
    }
    else {
      return eq();
    }
  }
  


  /////////////////////////////////////////////////////////////////////////// 
  // API Support
  ///////////////////////////////////////////////////////////////////////////

  lib.api = (typeof adobeDPS != "undefined") ? adobeDPS : window.MockAPI;

  function wait_for_api(method_name, fn) {
    if (!lib.api) return;

    // end result:  lib[method_name] = fn
    //
    // If the method is called before the API is ready it will set a 
    // timeout and try again.
    //
    lib[method_name] = function() {
      var that = this,
          args = arguments;
      setTimeout(function() {
        lib[method_name].apply(that, args);
      }, 500);
    };
    lib.api.initializationComplete.addOnce(function() {
      lib[method_name] = fn;
    });
  }
  
  wait_for_api("api_ready", function(cb) {
    cb();
  });

  wait_for_api("buy_issue", function(product_id, dossier_id) {
    var folio = lib.api.libraryService.folioMap.getByProductId(product_id);
    
    var view_folio = once(function() {
      if (dossier_id) {
        var protocol = "dps." + settings.adobeAppId + "://";
        window.location.href = protocol + "v1/folio/" + product_id + "/" + dossier_id;
      }
      else {
        folio.view();
      }
    });

    folio.updatedSignal.add(function self() {
      if (!folio.isViewable) return;
      view_folio();
      folio.updatedSignal.remove(self);
    });

    (function self() {
      if (folio.isViewable) {
        return view_folio();
      }

      var t = folio.currentStateChangingTransaction();
      if (t !== null) {
        var cb = self;

        if (!t.progressSignal.has(cb)) t.progressSignal.add(cb);
        if (!t.stateChangedSignal.has(cb)) t.stateChangedSignal.add(cb);

        // paused
        if (t.state === 100) t.resume();

        return;
      }
      
      if (folio.isPurchasable) {
        folio.purchase();
      }
      else if (folio.isDownloadable) {
        folio.download();
      }
    })();
  });

  wait_for_api("buy_sub", function(product_id) {
    lib.api.receiptService.availableSubscriptions[product_id].purchase();
  });
  
  wait_for_api("lucie_register", function() {
    $.each(lib.api.receiptService.availableSubscriptions, function(productId, sub) {
      if (sub.isActive()) {
        lib.api.dialogService.displayCustomDialog();
      }
    });
  });

  // Simple wrapper around trackCustomEvent() to wait for the API
  wait_for_api("trackCustomEvent", function(events, vars) {
    lib.api.analyticsService.trackCustomEvent(events, vars);
  });

  lib.track_user_action = function(evt_name, page_name) {
    /* Example values:
    *    evt_name: "banner_taps_subscribe" (subscribe/buyissue/downloadfree/register)
    *    page_name: "Library|Banner|Subscriber" (Subscriber/Nonsubscriber)
    */
    lib.trackCustomEvent("customEvent3", {
      customVariable3: evt_name,
      customVariable4: page_name
    });
  };

  lib.track_page_view = function(page_name) {
    /* Example values:
    *    page_name: "Library|Banner|Subscriber" (Subscriber/Nonsubscriber/Allusers)
    */
    lib.trackCustomEvent("customEvent3", {
      customVariable3: "library_banner_pageview",
      customVariable4: page_name
    });
  };

  var auto_download_defaults = {
    progress: $.noop,
    failure: $.noop,
    skipped: $.noop,
    viewable: $.noop
  };
  wait_for_api("auto_download", function(product_id, opts) {
    opts = $.extend({}, auto_download_defaults, opts || {});

    // only run on first banner load
    if (lib.view_count > 1) return opts.skipped();

    var folio = lib.api.libraryService.folioMap.getByProductId(product_id);

    // only allow these functions to be called one time
    opts.viewable = once(opts.viewable);
    function check_viewable() {
      if (folio.isViewable) opts.viewable(folio);
    }
    
    // can't auto-download a folio that isn't free
    if (!folio.isFree()) return opts.failure();

    folio.updatedSignal.add(check_viewable);

    if (folio.isDownloadable) {
      var t = folio.download();
      t.progressSignal.add(function() {
        check_viewable();
        opts.progress(folio, t.progress);
      });
      t.stateChangedSignal.add(function() {
        check_viewable();

        if (t.state < 0) {
          opts.failure(); // error
          t.stateChangedSignal.removeAll();
          t.progressSignal.removeAll();
        }
        else if (t.state == 100) t.resume(); // paused
        else opts.progress(folio, t.progress);
      });
    }
    else if (folio.isViewable) {
      check_viewable();
    }
    else {
      opts.failure();
    }
  });



  ///////////////////////////////////////////////////////////////////////////
  // eMagazines
  ///////////////////////////////////////////////////////////////////////////
  lib.emags_enabled = !!(settings.eMagsAppId && window.EMStart);

  if (lib.emags_enabled) {
    window.__eMagsInitHandlerWrapper = function() {
      EMStart();
      EMGetCurrentCampaignID(function(campaign_id) { // Campaign ID Found
        lib.trackCustomEvent("customEvent5", {
          customVariable5: campaign_id
        });
      });
      
      lib.api_ready(function() {
        lib.api.receiptService.newReceiptsAvailableSignal.add(function(receipts) {
          var receipt, evt_type, product_id, price, sub, folio;

          for (var i=receipts.length; i--;) {
            receipt = receipts[i];

            product_id = receipt.productId;
            if (receipt.isSubscription) {
              sub = lib.api.receiptService.availableSubscriptions[product_id];
              price = sub.price;
              evt_type = (sub.duration.toLowerCase() == "1 month") ? "MonthlySubscription" : "AnnualSubscription";
            }
            else {
              folio = lib.api.libraryService.get_by_productId(product_id);
              price = folio.price;
              evt_type = "SingleCopySale";
            }
            
            // remove dollar signs and other currecy symbols
            price = price.replace(/[^\d\.]/gi, "");

            EMPurchase(evt_type, product_id, price);
          }
        });
      });
    }
  }



  ///////////////////////////////////////////////////////////////////////////
  // ECHO (Push notifications)
  ///////////////////////////////////////////////////////////////////////////
  wait_for_api("echo", function() {
    var that = this,
        d_authenticated = lib.api.authenticationService.isUserAuthenticated,
        d_omni_visitor_id = lib.api.deviceService.omnitureVisitorId.toString().replace(/-/g,""),
        d_push_token = lib.api.deviceService.pushNotificationToken.toString(),
        d_email,
        data;
    
    that.postMade = false;
    that.echo_url = settings.echo_stage;
      
    if (settings.echoENV == "prod") {
      that.echo_url = settings.echo_prod;
    }
    console.log(that.echo_url);
      
    if (d_authenticated) { /* User logged in : Get email address from API */
      d_email = lib.api.authenticationService.userName;
      
      if (d_email && (!localStorage.echoEmail || localStorage.echoEmail != d_email)) {
        /* Email address is different then last time
         * or this is the first visit, echo record should be updated */
        localStorage.echoEmail = d_email;
        that.postMade = false;
      }
    } else { /* User not logged in : Get email address from localStorage (if available) */
      if (localStorage.echoEmail) {
        d_email = localStorage.echoEmail;
      }
    }
      
      
    /* Continue if connected */
    if (d_push_token && d_omni_visitor_id && !that.postMade) {
      data = {
          "device[token]"                     : d_push_token,
          "device[email]"                     : d_email,
          "device[bundle]"                    : settings.echo_bundle_id,
          "device[device_authenticity_token]" : settings.echo_token,
          "device[omniture_id]"               : d_omni_visitor_id,
          "device[apps_channel_id]"           : settings.echo_channel_id
      };
      
      console.log("data",data);
      
      $.ajax({
        type: 'POST',
        url: that.echo_url,
        crossDomain: true,
        data: data,
        success: function(responseData, textStatus, jqXHR) {
            that.postMade = true;
            console.log("ECHO - " + textStatus,responseData);
        },
        error: function (responseData, textStatus, errorThrown) {
            that.postMade = false;
            console.log("ECHO - " + textStatus,responseData);
        }
      });
    } else {
        return false;
    }
  });


  ///////////////////////////////////////////////////////////////////////////
  // Slider
  ///////////////////////////////////////////////////////////////////////////
  var SlideshowGallery = lib.SlideshowGallery = function() {
    /*
    *  To remove slides based on ios Version add a data-ios-version 
    *   attribute to the slide (div is "slide" class) which will be passed to
    *   lib.is_version().
    */

    // Before getting started, remove slides that don't match the current version of ios
    [].forEach.call(document.querySelectorAll(".slide"), function(elem) {
      if (!lib.is_version(elem.dataset.iosVersion)) {
        elem.parentNode.removeChild(elem);
      }
    });

    this.currentTranslation = 0;
    this.sliderWidth = document.querySelector('.carousel').offsetWidth;
    this.slidesObject = document.querySelectorAll('.slide');
    
    for (var i = 0; i < this.slidesObject.length; i++){
       this.slidesObject[i].style.width = this.sliderWidth + 'px';
    }
    
    this.slides = document.querySelector('.slides');
    this.numSlides = this.slides.children.length;
    this.slides.style.width = (this.sliderWidth * this.numSlides) + 'px';
  };

  SlideshowGallery.prototype.slideNext = function() {
    if (this.numSlides < 2) return this;

    this.currentTranslation -= this.sliderWidth;
    
    // Wrap around.
    if (this.currentTranslation == this.numSlides * -this.sliderWidth) {
      this.currentTranslation = 0;
    }

    this.slides.style.webkitTransform =
      'translate3d(' + this.currentTranslation + 'px, 0 ,0)';
    return this;
  };

  SlideshowGallery.prototype.slidePrev = function() {
    if (this.numSlides < 2) return this;

    this.currentTranslation += this.sliderWidth;

    // Wrap around.
    if (this.currentTranslation == this.sliderWidth) {
      this.currentTranslation = (this.numSlides - 1) * -this.sliderWidth;
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
  }

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

      if (newTranslation < minTranslation) {
        newTranslation = minTranslation + ((newTranslation - minTranslation) * 0.4);
      }
      else if (newTranslation > 0) {
        newTranslation *= 0.4;
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
  }

  SlideshowGallery.prototype.slideToNearest = function(cb) {
    this.slides.style.webkitTransition = "0.25s all";
    
    var nearest_slide = Math.round(-1 * this.currentTranslation / this.sliderWidth);
    nearest_slide = Math.max(Math.min(nearest_slide, this.slidesObject.length-1), 0);

    this.currentTranslation = -1 * nearest_slide * this.sliderWidth;
    this.slides.style.webkitTransform =
      'translate3d(' + this.currentTranslation + 'px, 0 ,0)';

    // don't call the callback for 350ms extra to allow for any lag in the animation
    setTimeout(cb, 350);
  }



  return lib;

})();
