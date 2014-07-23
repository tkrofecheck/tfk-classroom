
App.preload = function(cb) {
  function img(path) {
    App.preload.img(settings.asset_root + path);
  }

  img("images/mask.gif");
  img("images/" + settings.brandCode + "/curl.png");
  img(settings.cover_spacer_img);

  (cb||$.noop)();
}
App.preload.img = function(img_url, cb) {
  cb = cb || $.noop;
  if (!img_url) return setTimeout(cb);

  var i = new Image;
  i.addEventListener("load", cb);
  i.src = img_url;
  if (i.complete) setTimeout(cb);
};

