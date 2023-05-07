// Libraries
const simpleParser = require('mailparser').simpleParser;
const Imap = require('imap');

// Config
const imapConfig = require('../imapConfig');

// IMAP configuration
const imap = new Imap(imapConfig);

// Function to open the inbox
function openInbox(cb) {
  imap.openBox('INBOX', true, cb);
}

// Function to fetch the email thread using the threadId
async function fetchThread(threadId) {
  return new Promise((resolve, reject) => {
    let threadArray = [];

    // When the IMAP connection is ready, open the inbox
    imap.once('ready', function () {
      openInbox(async function (err, box) {
        if (err) reject(err);

        // Search for messages in the thread using the threadId
        imap.search([['X-GM-THRID', `${threadId}`]], async function (err, results) {
          if (err) reject(err);

          // Fetch the messages in the thread
          const f = imap.fetch(results, { bodies: '' });
          let messageCount = results.length;
          let processedMessages = 0;

          // Process each message in the thread
          f.on('message', function (msg, seqno) {
            msg.on('body', async function (stream, info) {
              try {
                // Parse the message using the simpleParser library
                const parsed = await simpleParser(stream);

                // Create a message object with the sender's email address and content
                const msg = {
                  from: parsed.from.value[0].address,
                  content: parsed.text
                }
                // Add the message object to the thread array
                threadArray.push(msg);
              } catch (err) {
                reject(err);
              } finally {
                processedMessages++;
                // Once all messages are processed, close the IMAP connection and resolve the thread array
                if (processedMessages === messageCount) {
                  imap.end();
                  resolve(threadArray);
                }
              }
            });
          });

          // Handle fetch errors
          f.once('error', function (err) {
            reject('Fetch error: ' + err);
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

// Export the fetchThread function
module.exports = fetchThread;
