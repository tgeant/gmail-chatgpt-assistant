const Imap = require('imap');
const simpleParser = require('mailparser').simpleParser;
require('dotenv').config();

// IMAP configuration
const imap = new Imap({
  user: process.env.EMAIL_USER,
  password: process.env.EMAIL_PASS,
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  tlsOptions: {
    rejectUnauthorized: false,
  },
});

function openInbox(cb) {
  imap.openBox('INBOX', true, cb);
}

async function fetchThread(threadId) {
  return new Promise((resolve, reject) => {
    let threadArray = [];

    imap.once('ready', function () {
      openInbox(async function (err, box) {
        if (err) reject(err);

        imap.search([['X-GM-THRID', `${threadId}`]], async function (err, results) {
          if (err) reject(err);

          const f = imap.fetch(results, { bodies: '' });
          let messageCount = results.length;
          let processedMessages = 0;

          f.on('message', function (msg, seqno) {
            msg.on('body', async function (stream, info) {
              try {
                const parsed = await simpleParser(stream);
                threadArray.push(parsed.text);
              } catch (err) {
                reject(err);
              } finally {
                processedMessages++;
                if (processedMessages === messageCount) {
                  imap.end();
                  resolve(threadArray);
                }
              }
            });
          });

          f.once('error', function (err) {
            reject('Fetch error: ' + err);
          });
        });
      });
    });

    imap.once('error', function (err) {
      reject(err);
    });

    imap.once('end', function () {
      console.log('Connection ended');
    });

    imap.connect();
  });
}

module.exports = fetchThread;
