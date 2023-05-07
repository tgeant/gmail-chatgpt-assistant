// Libraries
const Imap = require('imap');

// Config
const imapConfig = require('../imapConfig');

// IMAP configuration
const imap = new Imap(imapConfig);

// Function to get the thread ID from a message ID
async function getThreadIdFromMessageId(messageId) {
  return new Promise((resolve, reject) => {
    // When the IMAP connection is ready, open the inbox
    imap.once('ready', function () {
      imap.openBox('INBOX', true, async function (err, box) {
        if (err) reject(err);

        // Search for the message with the given messageId
        imap.search([['HEADER', 'MESSAGE-ID', messageId]], async function (err, results) {
          if (err) reject(err);

          // Fetch the message with the matching messageId
          const f = imap.fetch(results, { bodies: '' });

          f.on("message", async function (msg, seqno) {
            // Extract the threadId from the message attributes
            msg.on("attributes", function (attrs) {
              const threadId = attrs["x-gm-thrid"];
              resolve(threadId);
            });
          });

          // Handle fetch errors
          f.once('error', function (err) {
            reject('Fetch error: ' + err);
          });

          // Close the IMAP connection when the fetch is complete
          f.once('end', function () {
            imap.end();
          });
        });
      });
    });

    // Handle IMAP connection errors
    imap.once('error', function (err) {
      reject(err);
    });

    // Connect to the IMAP server
    imap.connect();
  });
}

// Export the getThreadIdFromMessageId function
module.exports = {
  getThreadIdFromMessageId
};
