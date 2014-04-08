/* global _, settings, App, console, alert, moment, TcmOmni, lucieApi, $, async */
(function() {
  /* Dependencies:
   *   - settings/{TITLE}.js (-> settings_loader.js)
   *   - underscore.js
   *   - async.js
   *   - jQuery
   *   - lucie_entitlements.js
   */
  
  // utility function (used to attach extra folio methods)
  function wrap_object(obj, extra_methods) {
    function subclass() {
      _.extend(this, extra_methods);
    }
    subclass.prototype = obj;
    return new subclass();
  }

  window.APIWrapper = function(raw_api, cb) {
    
    function Wrapper(tcm_feed, adobe_feed) {
      var that = this,
          screen_W = window.screen.width,  // get device screen width
          screen_H = window.screen.height, // get device screen height
          dimensionsArray = [screen_H+"x"+screen_W, screen_H+"x"+(screen_W-20), (screen_H*2)+"x"+(screen_W*2)]; // store all possible issue dimensions in array for device being used;

      // build dictionaries of the tcm_feed and adobe feed for 
      // easy access
      this.tcm_feed = tcm_feed;
      _(tcm_feed.issues).each(function(issue) {
        tcm_feed[issue.id] = issue;
      });
      this.adobe_feed = adobe_feed;
      $("issue", adobe_feed).each(function() {
        var $issue = $(this),
            product_id = $issue.attr("productId"),
            issue_dimensions = $.trim($issue.find("targetDimensions").text());
        
        for (var i=0; i<dimensionsArray.length; i++) {
          if (issue_dimensions == dimensionsArray[i]) {
            adobe_feed[product_id] = $issue;
          }
        }
      });


      // FOLIO METHODS /////////////////////////////////////////////////

      function transaction_to_deferred(t, d) {
        d = d || new $.Deferred();
        t.stateChangedSignal.add(function() {
          if (t.state < 0) {
            d.rejectWith(t, t.state, t.error);
          }
          else if (t.state == 100) {
            // paused
            d.rejectWith(t, t.state, null);
          }
          else d.notifyWith(t, t.progress);
        });
        t.progressSignal.add(function() {
          d.notifyWith(t, t.progress);
        });
        t.completedSignal.add(function() {
          d.notifyWith(t, t.progress);
          d.resolveWith(t, t.state);
        });
        return d;
      }


      function tcmimg(path) {
        if (path === 'undefined') path = undefined;
        return path ? settings.tcmfeed_image_root+path : null
      }
      var extra_folio_methods = {
        "get_deeplink": function(dossier_id) {
          // returns something like:
          //   dps.72c6d01e1eb34f07bf2d2c31643f0646://v1/folio/com.timeinc.ew.ipad.inapp.07182013/113217 
          var protocol = "dps." + settings.adobeAppId + "://";
          return protocol + "v1/folio/" + this.productId + "/" + dossier_id;
        },
        "get_filters": function() {
          // James: I'm not sure if/how multiple filters would be passed
          //   but I'm making this function return a list to support multiple
          //   filters in the future, however that might work
          var fltr = this.adb.find("filter").text() || "";
          return [fltr.toLowerCase()];
        },
        "has_filter": function(fltr) {
          return _(this.get_filters()).contains(fltr.toLowerCase());
        },
        "is_special_issue": function() {
          return this.has_filter("special");
        },
        "goto_dossier": function(dossier_id) {
          window.location.href = this.get_deeplink(dossier_id);
        },
        "get_preview_button_product_id": function() {
          if (!this.tcm) return;
          var product_id = this.tcm.preview_button_product_id;
          if (!raw_api.libraryService.get_by_productId(product_id)) {
            return;
          }
          return product_id;
        },
        "get_preview_button_dossier_id": function() {
          return this.tcm.preview_button_dossier_id;
        },
        "get_additional_covers": function() {
          // used in the store Hero to allow users to swipe through
          // additional images where the hero cover is displayed,
          // though they don't have to all be cover images. Originally
          // built for people
          if (!this.tcm || !this.tcm.additional_covers) return [];
          return _(this.tcm.additional_covers).map(tcmimg);
        },
        "get_additional_covers_large": function() {
          // same as get_additional_cover() but returns the fullscreen
          // sized version of the image (or null/undefined/"" if not specified)
          if (!this.tcm || !this.tcm.additional_covers_lg) return [];
          return _(this.tcm.additional_covers_lg).map(tcmimg);
        },
        "get_welcome_imgs": function() {
          var fallback = [null, this.get_cover_img()],
              imgs = {portrait: [], landscape: []};

          if (this.tcm) {
            imgs.portrait[0] = tcmimg(this.tcm.portrait_intro_img);
            imgs.portrait[1] = tcmimg(this.tcm.portrait_welcome_img);
            imgs.landscape[0] = tcmimg(this.tcm.landscape_intro_img);
            imgs.landscape[1] = tcmimg(this.tcm.landscape_welcome_img);
          }
          if (!_.any(imgs.portrait)) {
            if (_.any(imgs.landscape)) imgs.portrait = imgs.landscape;
            else imgs.portrait = fallback;
          }
          if (!_.any(imgs.landscape)) {
            if (_.any(imgs.portrait)) imgs.landscape = imgs.portrait;
            else imgs.landscape = fallback;
          }
          return imgs;
        },
        "get_cover_img": function() {
          /* URL should end with 'portrait' or 'landscape' - these are the only values that update when covers change */
          return this.adb.find("libraryPreviewUrl").text() + "/portrait/"
        },
        "_defer": function(method, cancall_attr) {
          var d = new $.Deferred(),
              args = Array.prototype.slice.call(arguments, 2);

          method = this[method];

          if (cancall_attr === undefined || this[cancall_attr]) {
            transaction_to_deferred(method.apply(this, args), d);
          }
          else d.reject();
          return d;
        },
        "_view": function() {
          var folio = this;
          setTimeout(function(){ folio.view() }, 250);
        },
        "view_or_preview": function(opts) {
          opts = opts || {};
          var folio = this;

          function try_to_view(fallback) {
            fallback = fallback || $.noop;
            if (folio.isViewable) {
              if ((opts.complete||$.noop)() !== false)
                folio._view();
            }
            else {
              fallback();
            }
          }
          function bind_progress_to_transaction(transaction) {
            function progress_cb() {
              (opts.download_progress||$.noop)(transaction.progress);
              try_to_view();
            }
            transaction.progressSignal.add(progress_cb);
            transaction.stateChangedSignal.add(progress_cb);
            transaction.completedSignal.add(progress_cb);
          }
          function bind_downloads_wait_for_others(t, wait_cb) {
            switch (t.jsonClassName)
            {
              case "ContentPreviewTransaction":
              case "DownloadTransaction":
                bind_progress_to_transaction(t);
                break;
              default:
                t.completedSignal.addOnce(wait_cb);
            }
          }

          if (folio.isDownloadable || folio.isUpdatable) folio.download_and_view(opts);
          else try_to_view(function download_preview() {
            if (folio.currentStateChangingTransaction() !== null) {
              App.log("WaitingForTransaction", "content preview is waiting on a stateChangingTransaction");
              return bind_downloads_wait_for_others(folio.currentStateChangingTransaction(), download_preview);
            }
            var transaction;
            transaction = folio.verifyContentPreviewSupported();
            transaction.completedSignal.addOnce(function() {
              try_to_view(function() {
                if (folio.currentStateChangingTransaction() !== null) {
                  App.log("WaitingForTransaction2", "content preview is waiting on a stateChangingTransaction");
                  return bind_downloads_wait_for_others(folio.currentStateChangingTransaction(), download_preview);
                }

                if (folio.canDownloadContentPreview()) {
                  //eMagazines Preview Download
                  //EMPurchase("PreviewDownload", folio.productId, 0, 
                  //            undefined, undefined, undefined, undefined, 
                  //            $.noop, $.noop);
                  bind_progress_to_transaction(folio.downloadContentPreview());
                }
                else {
                  console.log("ERROR: folio has no content preview!! folio: " + folio.productId);
                  App.error("NoContentPreview",
                      "folio: " + folio.productId +
                      " | supportsContentPreview: " + folio.supportsContentPreview +
                      " | hasSections: " + folio.hasSections +
                      " | isPurchasable: " + folio.isPurchasable +
                      " | isCompatible: " + folio.isCompatible +
                      " | isArchivable: " + folio.isArchivable +
                      " | currentStateChangingTransaction: " +
                      (folio.currentStateChangingTransaction() || {}).jsonClassName
                  );
                  alert("Err: NO CONTENT PREVIEW");
                }
              });
            });
          });

        },
        "get_coverdate": function() {
          return moment(this.adb.find("coverDate").text());
        },
        "get_publicationdate": function() {
          return moment(this.adb.find("publicationDate").text());
        },
        "download_and_view": function(opts) {
          opts = opts || {};
          var dl_transaction,
              folio = this;
          
          function complete() {
            (opts.complete || $.noop)();
            folio._view();
          }

          if (folio.isUpdatable || folio.isDownloadable) {
              dl_transaction = (folio.isUpdatable) ? folio._update() : folio._download();
              dl_transaction.progressSignal.add(function() {
                (opts.download_progress || $.noop)(dl_transaction.progress);
                if (folio.isViewable) {
                  folio._view();
                }
              });
              dl_transaction.completedSignal.addOnce(complete);
            }
          else complete();

        },
        "_get_current_transaction": function(trans_type) {
          var t;
          t = _(this.currentTransactions).chain()
            .filter(function(t) { return t.jsonClassName == trans_type })
            .filter(function(t) { return t.state >= 0 && t.state < 400 })
            .max(function(t) { return t.state })
            .value();
      
          if (!t || t == -Infinity) return null;
          return t;
        },
        "_get_current_download": function() {
          return this._get_current_transaction("DownloadTransaction");
        },
        "_get_current_update": function() {
          return this._get_current_transaction("UpdateTransaction ");
        },
        "_download": function() {
          var t = this._get_current_download();
          if (!t) {
            //if (this.isFree()) {
              //eMagazines Free Download
              //EMPurchase("FreeSample", this.productId, 0,
              //            undefined, undefined, undefined, undefined,
              //            $.noop, $.noop);
            //}
            t = this.download();
          }
          if (t.state == 100) { // paused
            t.resume();
          }
          return t;
        },
        "_update": function() {
          var t = this._get_current_update();
          if (!t) {
            //if (this.isFree()) {
              //eMagazines Free Download
              //EMPurchase("FreeSample", this.productId, 0,
              //            undefined, undefined, undefined, undefined,
              //            $.noop, $.noop);
            //}
            t = this.update();
          }
          if (t.state == 100) { // paused
            t.resume();
          }
          return t;
        },
        "purchase_and_download": function(opts) {
          opts = opts || {};
          
          // valid values: false, "asap", "done"
          //   asap is opportunistic
          //   done will go to view when download completes
          //   false does not send the user into the folio
          if (opts.goto_view === undefined) opts.goto_view = "asap";

          var purchase_transaction,
              folio = this;
          
          function complete() {
            if (opts.goto_view !== false) folio._view();
            (opts.complete || $.noop)();
          }

          folio.updatedSignal.add(function() {
            if (folio.state == 201) { // DOWNLOADING
              download();
            }
            else if (folio.state == 1000) { // INSTALLED 
              complete();
            }
          });

          if (folio.isPurchasable) {
            purchase_transaction = this.purchase();
            purchase_transaction.completedSignal.addOnce(function() {
              // work around for an adobe quirk (this one is a total face-palm)
              // Details: Purchasing an issue initiates a download 
              // automatically - so far, so good. Unfortunately, the download
              // does not exist yet, so we have to release the interpreter
              // before we can safely assume that the downloadTransaction will
              // exist.
              _.delay(download, 50);
            });
            purchase_transaction.stateChangedSignal.add(function() {
              var states = App.api.transactionManager.transactionStates;
              if (purchase_transaction.state == states.CANCELED) {
                purchase_transaction.completedSignal.remove(download);
                (opts.cancelled || $.noop)();
              }
            });
          }
          else download();

          function on_download_progress(dl_transaction) {
            (opts.download_progress || $.noop)(dl_transaction.progress);
            if (opts.goto_view == "asap" && folio.isViewable) {
              complete();
            }
          }
          function on_download_state_changed(dl_transaction) {
            (opts.download_progress || $.noop)(dl_transaction.progress);
            if (folio.isViewable) complete();
            if (dl_transaction.error && dl_transaction.error.code < 0) {
              switch (dl_transaction.error.code) {
                case -100://Indicates the Library could not connect to the Internet to complete a transaction.
                case -110://Indicates the Library could not connect to the particular server needed to complete a transaction.
                case -150://Indicates the provided credentials were not recognized by the entitlement server.
                case -200://Indicates folio and subscription purchasing is disabled on this device.
                case -210://Indicates a single folio purchase transaction failed because an error occurred communicating with the in-app purchase system.
                case -220://Indicates a subscription purchase transaction failed because an error occurred communicating with the in-app purchase system.
                case -225://Indicates there was an error attempting to resolve the valid date ranges for a subscription.
                case -250://Indicates a restore purchases transaction failed because an error occurred communicating with the in-app purchase system.
                case -300://Indicates the user attempted to purchase or download a folio when the publisher's download quota has been exceeded.
                case -400://Indicates the user attempted to purchase or download a folio that is incompatible with the current Viewer.
                case -510://Indicates there was an error downloading the folio that was not network related.
                case -520://Indicates the folio being downloaded was either corrupted or became unavailable
                  dl_transaction.completedSignal.remove(download);
                  (opts.error || $.noop)(dl_transaction.error.code.toString());
                  break;
                case -530://Indicates there was an error during the the installation of the folio
                case -540://Indicates the preview download failed because there was no preview of the folio available
                case -900://Indicates a transaction failed because of an error that occurred in the LibraryAPI
                  // Do not cancel download & do not show error dialog
                  break;
                case -500://Indicates the user attempted to download a folio that was larger than the space available on the device.
                  dl_transaction.completedSignal.remove(download);
                  (opts.error || $.noop)(dl_transaction.error.code.toString());
                  break;
                default:
                  break;
              }
            }
          }
          function download() {
            var dl_transaction;
            if (folio.isUpdateable || folio._get_current_update()) {
              dl_transaction = folio._update();

              if (!dl_transaction.progressSignal.has(on_download_progress)) {
                dl_transaction.progressSignal.add(on_download_progress);
              }
              if (!dl_transaction.stateChangedSignal.has(on_download_state_changed)) {
                dl_transaction.stateChangedSignal.add(on_download_state_changed);
              }
            }
            else if (folio.isDownloadable || folio._get_current_download()) {
              dl_transaction = folio._download();

              if (!dl_transaction.progressSignal.has(on_download_progress)) {
                dl_transaction.progressSignal.add(on_download_progress);
              }
              if (!dl_transaction.stateChangedSignal.has(on_download_state_changed)) {
                dl_transaction.stateChangedSignal.add(on_download_state_changed);
              }
            }
            else complete();
          }
        }
      };

      // LIBRARY METHODS ///////////////////////////////////////////////
      that.libraryService.get_touted_issue = function() {
        return _.head(this.get_visible());
      };
      that.libraryService._get_latest_issue = function() {
        return _.max(this.folioMap.sort(), function(folio) {
          if (!adobe_feed[folio.productId]) return -Infinity;
          if (folio.productId == settings.preview_issue_product_id) return -Infinity;
          return moment(folio.publicationDate);
        });
      };
      that.libraryService.get_latest_issue = function() {
        return _.max(this.get_visible(), function(folio) {
          return moment(folio.publicationDate);
        });
      };
      that.libraryService.get_back_issues = function() {
        var folios = _.filter(this.get_visible(), function(folio) {
          return folio.productId != settings.preview_issue_product_id;
        });
        return _.tail(folios);
      };
      that.libraryService.get_visible = function get_visible() {
        // This is intended to be the primary method of getting the folios
        //    - first item is the touted issue (always)

        if (get_visible.cached) return get_visible.cached;

        var latest_folio,
            folios = this.folioMap.sort();

        folios = _.chain(folios)
          .map(function(folio) {
            var wrapped = wrap_object(folio, extra_folio_methods);
            wrapped.adb = adobe_feed[folio.productId];
            wrapped.tcm = tcm_feed[folio.productId];
            return wrapped;
          }).filter(function(folio) {
            // remove issues missing from the adobe data feed
            return folio.broker;
          }).filter(function(folio) {
            return folio.adb;
          }).value();

        latest_folio = _(folios).max(function(folio) {
          if (folio.productId == settings.preview_issue_product_id) {
            return -Infinity;
          }
          return moment(folio.publicationDate);
        });

        //We can't remove the folio from "folios" otherwise the preview button doesn't work
        //We need to find a way to hide the issue from screen, but not remove it
        /*if (latest_folio.tcm &&
            latest_folio.tcm.preview_button_product_id &&
            latest_folio.tcm.preview_button_product_id !== latest_folio.productId) {
          folios = _(folios).filter(function(folio) {
            return folio.productId !== latest_folio.tcm.preview_button_product_id;
          });
        }*/

        function priority(folio) {
          var p;
          try { p = folio.tcm.sort_priority; }
          catch (e) { p = 0; }
          if (folio.id === latest_folio.id && p === 0) return 100;
          return p;
        }
        function comp(x, y) {
          if (x == y) return 0;
          else return x > y ? 1 : -1;
        }

        folios.sort(function(folio1, folio2) {
            var priority_comp = comp(priority(folio2), priority(folio1));
            if (priority_comp === 0) {
              return comp(folio2.get_publicationdate(), folio1.get_publicationdate());
            }
            else return 2*priority_comp;
          });

        get_visible.cached = folios;
        return folios;
      };

      // cache busting:
      that.libraryService.updatedSignal.add(function() {
        that.libraryService.get_visible.cached = undefined;
      });

      that.libraryService.get_by_productId = function(product_id) {
        return _.find(this.get_visible(), function(folio) {
          return folio.productId == product_id;
        });
      };

      // RECEIPT SERVICE METHODS ///////////////////////////////////////
      that.receiptService.get_short_subnames = function() {
        var durations = {
          "mo": /1 month/i,
          "yr": /1 year/i,
          "mes": /1 mes/i,
          "año": /1 a[nñ]o/i
        };
        return _(this.availableSubscriptions).map(function(s) {
          var duration;
          _(durations).each(function(re, label) {
            if (re.test(s.duration)) duration = label;
          });
          if (!duration) return "";
          return s.price + "/" + duration;
        }).filter(function(s) { return s });
      };

      // USER METHODS //////////////////////////////////////////////////
      function update_omniture_subscriber() {
        if (typeof TcmOmni == "undefined") return;
        var sub = that.authenticationService.lucie_subscriber;
        TcmOmni.set_subscriber(sub.id, sub.type);
      }
      that.authenticationService.get_lucie_data = function() {
        return this._get_lucie_data.d;
      };
      that.authenticationService._get_lucie_data = function _get_lucie_data() {
        var d = new $.Deferred(),
            auth = this;

        _get_lucie_data.d = d;

        if (!auth.isUserAuthenticated) {
          auth.lucie_data = null;
          auth.lucie_subscriber = {id: null, type: 'dsc', is_active: false};
          update_omniture_subscriber();
          d.resolve(auth.lucie_subscriber);
          return;
        }

        lucieApi._default_api_args.authToken = auth.token;

        lucieApi.entitlements(function(data) {
          auth.lucie_data = data;
          auth.lucie_subscriber = {
            id: $("subscriberId", data).text(),
            type: $("subscriberType", data).text(),
            is_active: $("subscriberIsActive", data).text() == "Y"
          };
          update_omniture_subscriber();
          d.resolve(auth.lucie_subscriber);
        }).error(function() {
          auth.logout();
          auth.lucie_data = null;
          auth.lucie_subscriber = {id: null, type: 'dsc', is_active: false};
          update_omniture_subscriber();
          d.resolve(auth.lucie_subscriber);
        });
      };

      // keep the lucie data up to date
      that.authenticationService._get_lucie_data();
      that.authenticationService.userAuthenticationChangedSignal.add(function() {
        that.authenticationService._get_lucie_data();
      });

      that.authenticationService.user_is_subscriber = function(cb) {
        var is_sub = false;

        // apple subscribers
        _(that.receiptService.availableSubscriptions).each(function(receipt) {
          if (receipt.isActive()) is_sub = true;
        });
        if (is_sub) return cb(true);

        this.get_lucie_data().done(function(lucie_subscriber) {
          cb(lucie_subscriber.is_active);
        });
      };
    } // END Wrapper()
    Wrapper.prototype = raw_api;

    var ts = new Date().getTime();
    function load_tcm_feed(cb) {
      function success(data) { console.log("tcm feed loaded"); cb(null, data) }
      settings.tcmfeed_image_root = settings.prod_tcmfeed_image_root;
      $.getJSON(settings.PRODUCTION_TCM_FEED, {t: ts}, success)
        .fail(function() {
          if (window.DEBUG) {
            settings.tcmfeed_image_root = settings.dev_tcmfeed_image_root;
            $.getJSON(settings.DEV_TCM_FEED, {t: ts}, success);
          }
        });
    }
    function load_adobe_feed(cb) {
      function success(data) { console.log("adobe feed loaded"); cb(null, data) }
      $.get(settings.adobeFeedUrl, {t: ts}, success, "xml")
        .fail(function() {
          if (window.DEBUG) $.get(settings.adobeFeedUrl_dev, {t: ts}, success, "xml");
        });
    }
    function ensure_folios_are_loaded(cb) {
      cb = _.once(_.partial(cb, null));

      if (raw_api.libraryService.folioMap.sort().length === 0) {
        var t = raw_api.libraryService.currentTransaction;
        
        if (!t || t.jsonClassName != "LibraryUpdateTransaction") {
          t = raw_api.libraryService.updateLibrary();
        }
        t.completedSignal.add(cb);
      }
      else cb();
    }

    async.parallel([
        load_tcm_feed, load_adobe_feed, ensure_folios_are_loaded
      ],
      function(err, results) {
        if (window.DEBUG) {
          $("targetDimensions", results[1]).text(window.screen.height + "x" + window.screen.width);
        }
        console.log("done loading stuff for wrapper");
        var api = new Wrapper(results[0], results[1]);
        cb(api);
    });

  }; // END of ApiWrapper()
  
})();
