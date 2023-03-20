/* 
This script performs a very basic check of the headers looking for a fail message
from spf or dkim checks.

*/

function checkEmailHeadersForSpoofing() {
  
    const searchRange = "newer_than:1d";
    const msgLabel = "FailedSpoofTest";
  
    var labelSpoof = GmailApp.getUserLabelByName(msgLabel);
    var cache = CacheService.getScriptCache();
  
    // If the label var is empty because it didn't already exist, this creates the label in your gmail 
    if (!labelSpoof) {
      labelSpoof = GmailApp.createLabel(msgLabel);
    }
  
    const threads = GmailApp.search(searchRange);
    for (var i = 0; i < threads.length; i++) {
      var message = threads[i].getMessages()[0];  // get first message in thread
  
      // Check if message ID is in cache
      if (cache.get(message.getId())) {
          // Logger.log("message already in cache " + message.getSubject());
          // uncomment next line to remove all messages from cache
          // cache.remove(message.getId());
          continue; // Skip this message if already processed
      }
  
      var headers = message.getRawContent().split('Content-Type:')[0].trim().toLowerCase();
      if (headers.indexOf("spf=fail") > -1 || headers.indexOf("dkim=fail") > -1) {
        var sender = message.getFrom().replace(/^.+<([^>]+)>$/, "$1").toLowerCase();
        threads[i].addLabel(labelSpoof); // add the label to the thread to indicate it was processed by this script
        GmailApp.moveThreadToSpam(threads[i]); // move the thread to the spam folder
        Logger.log("Found email with failed SPF or DKIM signature: \n" + 
          "From: " + sender + "\n" +
          "Subject: " + message.getSubject());
      } else {
          // toss the message in the cache
          cache.put(message.getId(), 'true', 10800); // Store message ID in cache for 3 hours
      }
    }
  }