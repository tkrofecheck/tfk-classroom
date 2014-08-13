(function() {
// One of the big benefits of using a js file instead of json for settings
// is the ability to add comments
window.settings = {

    "TEST_MODE"                     : false, // true to show every issue in library / otherwise set to false
    
    // General settings
    "BRAND_NAME"                    : "TIME FOR KIDS",
    "BRAND_CODE"                    : "TK",
    "SCHEDULE"                      : "weekly",
    
    "num_folios_displayed"          : 9, // default number of folios displayed in library
    
    "library_show_banner"           : true,
    "store_banners_type"            : "link", //(e.g. subscribe, link, '')
    
    "library_show_subscribe"        : false,
    
    "DISPLAY_HEADER_TEXT"           : false, // displays logo image if false otherwise IS_HEADER_TEXT (below)
    
    "IS_ENTITLEMENT_VIEWER"         : true,
    "IS_HEADER_TEXT"                : "Library",
    "IS_AUTO_OPEN_DOWNLOADED_FOLIO" : true,
    "IS_UPDATING_TEXT"              : "Updating Library...",
    
    "TIME_BEFORE_SIGNOUT_COUNTDOWN_SECONDS"     : 1800, // 1800 = 30 minutes
    "SIGNOUT_COUNTDOWN_SECONDS"     : 600, // 600 = 10 minutes
    
    // ************************************************************
    // OMNITURE
    // ************************************************************
    "omniture_account"           : "",
    "omniture_server"            : "",
    "omniture_ssl_server"        : "",
    
    // ************************************************************
    // NAV BAR, LOGIN DIALOG, RESTORE
    // ************************************************************
    "LBL_SIGN_OUT"                  : "Sign Out",
    "LBL_SIGN_IN"                   : "Sign In",
    "LBL_STUDENT_SIGN_IN"           : "Student",
    "LBL_TEACHER_SIGN_IN"           : "Teacher",
    "LBL_SUBSCRIBE"                 : "Subscribe",
    "LBL_RESTORE_ALL_PURCHASES"     : "Restore All Purchases",
    "LBL_REMOVE_ISSUES_FROM_IPAD"   : "Remove Issues from iPad",
    "LBL_AUTO_ARCHIVE"              : "Auto Archive",
    "LBL_AUTO_SIGNOUT"              : "Auto Sign-out",
    "LBL_SELECT_ALL"                : "Select All",
    "LBL_DESELECT_ALL"              : "Deselect All",
    "LBL_LOGOUT_MESSAGE"            : "No activity. Logging out in:",
    "LBL_RATE_THIS_APP"             : "Rate this App!",
    
    // ************************************************************
    // ADOBE APP INFO
    // http://mageng.it.timeinc.com/twiki/bin/view/Main/DPS-MagazineXML-Urls
    // ************************************************************
    "ADOBE_APP_ID"                    : "231d0c6f-f31c-52da-ae7a-76ebe92d2f07",
    "APP_ID"                        : "com.timeinc.tfk.apple",

    // ************************************************************
    // SUPPORT INFO
    // ************************************************************
    "SUPPORT_PHONE"                 : "1-866-784-9818",
    "SUPPORT_EMAIL"                 : "timedigital@customersvc.com",

    // ************************************************************  
    // URLS
    // ************************************************************  
    "FULFILLMENT_URL"               : "http://www.dpsapps.com/dps/v2_library_store_templates/fulfillment_proxy.php?accountId=",
    "BANNER_TARGET_URL"             : "http://www.google.com",
    "CREATE_ACCOUNT_URL"            : "",
    "FORGOT_PASSWORD_URL"           : "https://subscription.timeforkids.com/storefront/universalForgotPassword.ep?magcode=TK",
    "PRIVACY_POLICY_URL"            : "http://subscription-assets.timeforkids.com/prod/assets/themes/magazines/default/template-resources/html/legal/TK/teachapp/pp.html",
    
    "dev_tcmfeed_image_root": "http://ecom-dev01-app.usdlls2.savvis.net:10400/html/v25app/data/images/",
    "prod_tcmfeed_image_root": "http://subscription-assets.timeinc.com/prod/assets/appstorefronts-jq/v25data/images/",
        
    "lucie_server_root"             : "https://qa-lucie.timeinc.com/webservices/adobews/",
    //"lucie_server_root"             : "https://lucie.timeinc.com/webservices/adobews/",
    "teacher_type"                  : "dau-cmp", //subscriber type for teacher in lucie
    
    "dev_asset_root"                : "./",
    "prod_asset_root"               : "./",
    
    // ************************************************************  
    // LEARN MORE SLIDESHOW SLIDES
    // ************************************************************
    "slides": [
      {"image":"001.png", "clickthrough":false},
      {"image":"002.png", "clickthrough":false},
      {"image":"003.png", "clickthrough":false},
      {"image":"004.png", "clickthrough":true, "class":"samples"}
    ],
    
"ihatethelastcomma": true};
})();

window.settings.FULFILLMENT_URL += window.settings.ACCOUNT_ID;
window.settings.adobeFeedUrl = "http://edge.adobe-dcfs.com/ddp/issueServer/issues?accountId="+settings.ADOBE_APP_ID+"&targetDimension=2048x1536,1024x768,1024x748,2048x1496,1136x640,960x640,480x320";

window.settings.adobeFeedUrl_dev = "http://subscription-assets.timeinc.com/prod/assets/appstorefronts-jq/adobe-feeds/"+settings.APP_ID+".xml";
window.settings.DEV_TCM_FEED = "http://ecom-dev01-app.usdlls2.savvis.net:10400/html/v25app/data/" + settings.BRAND_CODE + ".json";
window.settings.PRODUCTION_TCM_FEED = "http://subscription-assets.timeinc.com/prod/assets/appstorefronts-jq/v25data/" + settings.BRAND_CODE + ".json";


