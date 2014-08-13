
App.preload = function(cb) {
  function img(path) {
    App.preload.img(settings.asset_root + path);
  }

  console.log("preloading 'Library' images...");
  img("images/logo.png");
  img("images/welcome-signin-popup.jpg");
  img("images/001.png");
  img("images/002.png");
  img("images/003.png");
  img("images/004.png");
  img("images/x.png");
  img("images/signout_banner_arrow.png");
  img("images/signout_banner_text.png");

  (cb||$.noop)();
  //App.preloader.trigger("finish:loading");
};

App.preload.img = function(img_url, cb) {
  cb = cb || $.noop;
  if (!img_url) return setTimeout(cb);

  var i = new Image;
  i.addEventListener("load", cb);
  i.src = img_url;
  if (i.complete) setTimeout(cb);
};

