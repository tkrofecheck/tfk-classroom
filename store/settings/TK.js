(function() {
// One of the big benefits of using a js file instead of json for settings
// is the ability to add comments
window.settings = {

    // General settings
    "BRAND_NAME"                    : "TIME FOR KIDS",
    "BRAND_CODE"                    : "TK",
    "SCHEDULE"                      : "weekly",
    
    "num_folios_displayed"          : 9, // default number of folios displayed in library
    
    "library_show_banner"           : true,
    "store_banners_type"            : "link", //(e.g. subscribe, link, '')
    
    "library_show_subscribe"        : false,
    
    "DISPLAY_HEADER_TEXT"           : false, // displays logo image if false otherwise IS_HEADER_TEXT (below)
    
    "IS_STORE_SHOW_CHROME"          : true,
    "IS_ENTITLEMENT_VIEWER"         : true,
    "IS_HEADER_TEXT"                : "",
    "IS_SUBHEADER_TEXT"             : "Download a Sample",
    "IS_AUTO_OPEN_DOWNLOADED_FOLIO" : true,
    "IS_UPDATING_TEXT"              : "Updating Store...",
    
    "IS_VIDEO"                      : false,
    
    // ************************************************************
    // OMNITURE
    // ************************************************************
    "omniture_account"           : "timagtimekidsall",
    "omniture_server"            : "metrics.time.com",
    "omniture_ssl_server"        : "smetrics.time.com",
    
    // ************************************************************
    // NAV BAR, LOGIN DIALOG, RESTORE
    // ************************************************************
    "LBL_SIGN_OUT"                  : "&laquo; Library",
    "LBL_SIGN_IN"                   : "Sign In",
    "LBL_STUDENT_SIGN_IN"           : "Student",
    "LBL_TEACHER_SIGN_IN"           : "Teacher",
    "LBL_SUBSCRIBE"                 : "Subscribe",
    "LBL_RESTORE_ALL_PURCHASES"     : "Restore All Purchases",
    "LBL_REMOVE_ISSUES_FROM_IPAD"   : "Remove Issues from iPad",
    "LBL_AUTO_ARCHIVE"              : "Auto Archive",
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
    "FORGOT_PASSWORD_URL"           : "",
    "PRIVACY_POLICY_URL"            : "http://www.timeinc.net/subs/privacy/eula/tk/tk-familyed-index.html",
    
    "lucie_server_root": "https://lucie.timeinc.com/webservices/adobews/",
    "dev_asset_root": "./",
    "prod_asset_root": "./",
    
    // ************************************************************  
    // SAMPLE ISSUES
    // ************************************************************        
    "samples": [
      {
        "gradeLevel":"K-1",
        "issues":[
          {"type":"Teacher", "productId":"", "id":""},
          {"type":"Student", "productId":"", "id":""}
        ],
        "description":"Help get your class excited about reading with <em>TIME For Kids’</em> <strong>interactive, multimedia features</strong> and <strong>engaging group reading activities</strong>, all while building early <strong>nonfiction</strong> literacy skills. Guide readers in identifying and describing important text features such as main topics, purpose, and supporting details. Each issue comes with <strong>teacher resources</strong> that help with lesson planning, prompting and student support."
      },
      {
        "gradeLevel":"2",
        "issues":[
          {"type":"Teacher", "productId":"", "id":""},
          {"type":"Student", "productId":"", "id":""}
        ],
        "description":"Use <em>TIME For Kids’</em> <strong>informational text</strong> and <strong>multimedia activities</strong> to build skills such as reading comprehension and critical thinking. Help your class develop an understanding of main purpose and supporting details, while using various text features to locate key facts in a story. Each issue comes with <strong>teacher resources</strong> that help with lesson planning, prompting and student support."
      },
      {
        "gradeLevel":"3-4",
        "issues":[
          {"type":"Teacher", "productId":"", "id":""},
          {"type":"Student", "productId":"", "id":""}
        ],
        "description":"Share the excitement of <strong>informational text</strong> with your students, using the <strong>interactive features and multimedia activities</strong> in <em>TIME For Kids</em>. Guide students as they develop reading comprehension skills such as summarization, determining main ideas, describing text structure and comprehending reasoning and evidence. <strong>Assessments</strong> in each issue measure comprehension and proficiency with <strong>Common Core State Standards</strong>."
      },
      {
        "gradeLevel":"5-6",
        "issues":[
          {"type":"Teacher", "productId":"", "id":""},
          {"type":"Student", "productId":"", "id":""}
        ],
        "description":"Continue to build advanced nonfiction literacy skills using the <strong>engaging text</strong> and <strong>interactive, multimedia activities</strong> featured in <em>TIME For Kids</em>. Develop students’ abilities to identify multiple main ideas and supporting details, compare and contrast ideas, identify evidence and evaluate arguments. <strong>Assessments</strong> in each issue measure comprehension and proficiency with <strong>Common Core State Standards</strong>."
      }
    ],
    
"ihatethelastcomma": true};
})();

window.settings.FULFILLMENT_URL += window.settings.ACCOUNT_ID;


