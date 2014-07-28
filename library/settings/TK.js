(function() {
// One of the big benefits of using a js file instead of json for settings
// is the ability to add comments
window.settings = {

    "TEST_MODE"                     : true, // true to show every issue in library / otherwise set to false
    
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
    
    "TIME_BEFORE_SIGNOUT_COUNTDOWN_SECONDS"     : 5,
    "SIGNOUT_COUNTDOWN_SECONDS"     : 600,
    
    // ************************************************************
    // OMNITURE
    // ************************************************************
    "omniture_account"           : "timagtimekidsall",
    "omniture_server"            : "metrics.time.com",
    "omniture_ssl_server"        : "smetrics.time.com",
    
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
    
    // ************************************************************
    // ADOBE APP INFO
    // http://mageng.it.timeinc.com/twiki/bin/view/Main/DPS-MagazineXML-Urls
    // ************************************************************
    "ACCOUNT_ID"                    : "231d0c6f-f31c-52da-ae7a-76ebe92d2f07",
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
    "PRIVACY_POLICY_URL"            : "http://www.timeinc.net/subs/privacy/eula/tk/tk-familyed-index.html",
    
    "lucie_server_root": "https://lucie.timeinc.com/webservices/adobews/",
    "dev_asset_root": "./",
    "prod_asset_root": "./",
    
    // ************************************************************  
    // SLIDESHOW SLIDES
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


