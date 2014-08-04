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
    "id": "cac122e0-5b8d-4eb1-a5d1-6bc42244250c",
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
    "productId": "com.timeinc.tfk.apple.teacher.k1.06012014",
    "folioNumber": "June 28, 2013",
    "publicationDate": "2013-06-27T04:00:00Z",
    "folioDescription": "Download the latest issue! Get the scoop on the summer's hottest movies and games. Plus, videos, slide shows and more!",
    "description": "Download the latest issue! Get the scoop on the summer's hottest movies and games. Plus, videos, slide shows and more!",
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
  },
  {
    "updatedSignal": {
      "_bindings": [],
      "_prevParams": null
    },
    "id": "bf7ddd84-f25c-4e9d-a6a8-c32e1b007f8c",
    "currentTransactions": [],
    "downloadSize": 0,
    "state": 100,
    "previewImageURL": null,
    "title": "TIME for Kids FAMILY EDITION",
    "isCompatible": true,
    "isDownloadable": true,
    "isViewable": true,
    "isArchivable": true,
    "isUpdatable": true,
    "productId": "com.timeinc.tfk.apple.student.k1.06012014",
    "folioNumber": "September 07, 2012",
    "publicationDate": "2012-09-06T04:00:00Z",
    "folioDescription": "Arctic sea ice is melting. That is not good news for polar bears. Find out what zoos are doing to save them.",
    "description": "Arctic sea ice is melting. That is not good news for polar bears. Find out what zoos are doing to save them.",
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
  },
  {
    "updatedSignal": {
      "_bindings": [],
      "_prevParams": null
    },
    "id": "35f2ec01-7c87-48da-8f95-293a2e770e82",
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
    "productId": "com.timeinc.tfk.apple.teacher.22.06012014",
    "folioNumber": "January 11, 2013",
    "publicationDate": "2013-01-10T05:00:00Z",
    "folioDescription": "Take a look back at the most memorable events-and photos-of 2012. Plus, newsmakers, videos, slide shows and more!",
    "description": "Take a look back at the most memorable events-and photos-of 2012. Plus, newsmakers, videos, slide shows and more!",
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
  },
  {
    "updatedSignal": {
      "_bindings": [],
      "_prevParams": null
    },
    "id": "6107a6d3-b418-40d8-aeef-269ff4861ca3",
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
    "productId": "com.timeinc.tfk.apple.student.22.06012014",
    "folioNumber": "April 04, 2014",
    "publicationDate": "2014-04-03T04:00:00Z",
    "folioDescription": "Celebrate Earth Day! Learn about scientists’ efforts to track sharks. Plus, newsmakers, videos, slide shows, and more!",
    "description": "Celebrate Earth Day! Learn about scientists’ efforts to track sharks. Plus, newsmakers, videos, slide shows, and more!",
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
  },
  {
    "updatedSignal": {
      "_bindings": [],
      "_prevParams": null
    },
    "id": "49402780-1d9d-46c3-9433-3b16d092fd2c",
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
    "productId": "com.timeinc.tfk.apple.teacher.34.06012014",
    "folioNumber": "April 04, 2014",
    "publicationDate": "2014-04-03T04:00:00Z",
    "folioDescription": "Celebrate Earth Day! Learn about scientists’ efforts to track sharks. Plus, newsmakers, videos, slide shows, and more!",
    "description": "Celebrate Earth Day! Learn about scientists’ efforts to track sharks. Plus, newsmakers, videos, slide shows, and more!",
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
  },
  {
    "updatedSignal": {
      "_bindings": [],
      "_prevParams": null
    },
    "id": "dca7b70e-6aa7-4d24-860a-d6ab23e46f36",
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
    "productId": "com.timeinc.tfk.apple.student.34.06012014",
    "folioNumber": "August 02, 2013",
    "publicationDate": "2013-08-01T04:00:00Z",
    "folioDescription": "Find out about America's wild horses. Learn how to build a sand castle. Plus, newsmakers, videos, slide shows and more!",
    "description": "Find out about America's wild horses. Learn how to build a sand castle. Plus, newsmakers, videos, slide shows and more!",
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
  },
  {
    "updatedSignal": {
      "_bindings": [],
      "_prevParams": null
    },
    "id": "bd38096e-ce0d-431e-b498-84e2c26eeedb",
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
    "productId": "com.timeinc.tfk.apple.teacher.56.06012014",
    "folioNumber": "September 06, 2013",
    "publicationDate": "2013-09-05T04:00:00Z",
    "folioDescription": "Download the latest issue! Get smart and be cool for school. Explore Ecuador. Plus, newsmakers, videos, and more!",
    "description": "Download the latest issue! Get smart and be cool for school. Explore Ecuador. Plus, newsmakers, videos, and more!",
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
  },
  {
    "updatedSignal": {
      "_bindings": [],
      "_prevParams": null
    },
    "id": "f61b4d76-ea74-474e-aeea-0107f62bc838",
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
    "productId": "com.timeinc.tfk.apple.student.56.06012014",
    "folioNumber": "January 10, 2014",
    "publicationDate": "2014-01-09T05:00:00Z",
    "folioDescription": "Download the latest issue! Find out about the coolest inventions of 2013. Plus videos, slide shows, and more!",
    "description": "Download the latest issue! Find out about the coolest inventions of 2013. Plus videos, slide shows, and more!",
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
