/* Dependencies:
 *   - underscore.js
 */
(function() {
  
  function Signal(auto_fire) {
    // auto_fire causes callbacks passed to add() and addOnce() to 
    // fire immediately, and it isn't part of the real API.
    // It just allows us to mock the Signals more simply
    
    this._bindings = [];
    this.add = function(cb) {
      if (auto_fire) setTimeout(cb);
      else this._bindings.push(cb);
    };
    this.has = function(fn) {
      for (var i=this._bindings.length; i--;) {
        if (fn === this._bindings[i]) return true;
      }
      return false;
    };
    this.addOnce = function(cb) {
      if (auto_fire) setTimeout(cb, 300);
      else this._bindings.push(_.once(cb));
    };
    this.trigger = function() {
      var args = arguments;
      _(this._bindings).each(function(fn) {
        fn.apply(window, args);
      });
    }
  }
  function Transaction(ttl) {
    var transaction = this,
        now = moment().unix();
    
    this.progress = 0;
    this.step = 0; // Initialized
    this.progressSignal = new Signal;
    this.completedSignal = new Signal;
    this.stateChangedSignal = new Signal;

    _(ttl).times(function(t) {
      setTimeout(function() {
        if (transaction.step != 1) transaction.stateChangedSignal.trigger(transaction);
        transaction.step = 1; // Downloading
        transaction.progress = 100 * (t/ttl);
        transaction.progressSignal.trigger(transaction);
      }, t*1000);
    });
    setTimeout(function() {
      if (transaction.step != 2) transaction.stateChangedSignal.trigger(transaction);
      transaction.step = 2; // Installing
      transaction.completedSignal.trigger(transaction);
    }, ttl*1000);
  }

  var folios = [
  {
    "updatedSignal": {
      "_bindings": [],
      "_prevParams": null
    },
    "id": "851a6c96-d889-410f-9638-8160200d23b1",
    "currentTransactions": [],
    "downloadSize": 0,
    "state": 100,
    "previewImageURL": null,
    "title": "TIME for Kids FAMILY EDITION",
    "isCompatible": true,
    "isDownloadable": true,
    "isViewable": false,
    "isArchivable": false,
    "isUpdatable": true,
    "productId": "com.timeinc.tfk.ipad.inapp.05012013",
    "folioNumber": "September 01, 2013",
    "publicationDate": "2013-08-09T04:00:00Z",
    "folioDescription": "Download the latest issue! Get the scoop on the summer's hottest movies and games. Plus, videos, slide shows and more!",
    "description": "Download the latest issue! Get the scoop on the summer's hottest movies and games. Plus, videos, slide shows and more!.",
    "price": "$4.99",
    "broker": "appleStore",
    "filter": null,
    "isThirdPartyEntitled": false,
    "targetDimensions": "2048x1536",
    "isPurchasable": true,
    "supportsContentPreview": false,
    "receipt": null,
    "entitlementType": 0,
    "hasSections": false,
    "contentPreviewState": 0,
    "sections": {
      "addedSignal": {
        "_bindings": [],
        "_prevParams": null
      },
      "removedSignal": {
        "_bindings": [],
        "_prevParams": null
      },
      "internal": {}
    }
  }
  ];
  var subscriptions = {
    "com.timeinc.tfk.ipad.subs.9": {
      "updatedSignal": {
        "_bindings": [],
        "_prevParams": null
      },
      "productId": "com.timeinc.tfk.ipad.subs.9",
      "title": "TIME for Kids",
      "duration": "1 Year",
      "price": "$19.99",
      "isOwned": false,
      "receipt": {
        contains: function() { return true; }
      },
    },
    "com.timeinc.tfk.ipad.subs.3": {
      "updatedSignal": {
        "_bindings": [],
        "_prevParams": null
      },
      "productId": "com.timeinc.tfk.ipad.subs.3",
      "title": "TIME for Kids",
      "duration": "1 Month",
      "price": "$1.99",
      "isOwned": false,
      "receipt": null
    }
  };    

  window.MockAPI = {
    initializationComplete: new Signal(true),
    analyticsService: {
      trackCustomEvent: function() {}
    },
    authenticationService: {
      // token/username is valid for People Store (iOS)
      isUserAuthenticated: false,
      token: null, //"ea60559d43362cd85dcc291b146b899212775b796551744177277c1615410e6e51e10f0b43df99111820f73134541fbad594fe067e0984d51c5b6bc76006d124",
      logout: function() {},
      userAuthenticationChangedSignal: new Signal(),
      updatedSignal: new Signal(),
      userName: null, //'time@jiaaro.com',
    },
    deviceService: {
      isOnline: true,
      omnitureVisitorId: '11111111-22222222-33333333-44444444',
      pushNotificationToken: '0000000000000000000000000000000000000000000000000000000000000000'
    },
    receiptService: {
      availableSubscriptions: subscriptions,
      newReceiptsAvailableSignal: new Signal(),
      restorePurchases: function() { return new Transaction(2); },
    },
    libraryService: {
      folioStates: {
        DOWNLOADING: 201,
        ENTITLED: 200,
        EXTRACTABLE: 400,
        EXTRACTING: 401,
        INSTALLED: 1000,
        INVALID: 0,
        PURCHASABLE: 100,
        PURCHASING: 101,
        UNAVAILABLE: 50
      },
      updateLibrary: function() { return new Transaction(2); },
      updatedSignal: new Signal(),
      folioMap: {
        addedSignal: new Signal(),
        sort: function(cb) { return _(folios).sort(cb); },
        internal: function(cb) { return _(folios).sort(cb); },
      }
    },
    settingsService: {
      autoArchive: {
        isSupported: true,
        isEnabled: true,
        updatedSignal: new Signal()
      }
    },
    transactionManager: {
      transactionStates: {
        FAILED: -100,
        CANCELED: -1,
        INITIALIZED: 0,
        PAUSED: 100,
        ACTIVE: 200,
        FINISHED: 400
      }
    }
  };

  
  folios.forEach(function(folio) { 
    folio.updatedSignal = new Signal;
    folio.purchase = function() { 
      confirm("Are you sure you want to buy this?");
      setTimeout(function() { folio.isDownloadable = true }, 750);
      return new Transaction(1);
    }
    folio.isFree = function () { return this.broker == "noChargeStore" }
    folio.download = function() {
      var transaction = new Transaction(20);
      setTimeout(function() {
        folio.isViewable = true;
      }, 9000);
      return transaction;
    }
    folio.verifyContentPreviewSupported = function() {
      return new Transaction(1);
    }
    folio.currentStateChangingTransaction = function() { return null }
    folio.canDownloadContentPreview = function() {
      return this.supportsContentPreview &&
        !this.hasSections &&
        this.isPurchasable &&
        this.isCompatible &&
        !this.isArchivable &&
        (this.currentStateChangingTransaction() == null); 
    }
    folio.downloadContentPreview = function() {
      setTimeout(function() {
        folio.isViewable = true;
      }, 6000);
      return new Transaction(15);
    }
    folio.view = function() {
      alert("Viewing folio: " + folio.productId);
      setTimeout(function() { location.reload(); }, 1000);
    }
    folio.getPreviewImage = function(w, h, p) {
      var t = new Transaction(1);
      t.width = w;
      t.height = h;
      t.isPortrait = p;
      t.previewImageURL = "http://thetopsdirectory.com/img/article.jpg";
      return t;
    }
    MockAPI.libraryService.folioMap[folio.id] = folio 
  });
 
  for (var sub_id in subscriptions) (function(sub) {
    sub.isActive = function() {
      return this.isOwned && this.receipt.contains(new Date());
    }
  })(subscriptions[sub_id]);


})();
