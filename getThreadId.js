const Imap = require('imap');
require('dotenv').config();

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

async function getThreadIdFromMessageId(messageId) {
  return new Promise((resolve, reject) => {
    imap.once('ready', function () {
      imap.openBox('INBOX', true, async function (err, box) {
        if (err) reject(err);

        imap.search([['HEADER', 'MESSAGE-ID', messageId]], async function (err, results) {
          if (err) reject(err);

          const f = imap.fetch(results, { bodies: '' });

          f.on("message", async function (msg, seqno) {
            msg.on("attributes", function (attrs) {
              const threadId = attrs["x-gm-thrid"];
              resolve(threadId);
            });
          });

          f.once('error', function (err) {
            reject('Fetch error: ' + err);
          });

          f.once('end', function () {
            imap.end();
          });
        });
      });
    });

    imap.once('error', function (err) {
      reject(err);
    });

    imap.once('end', function () {
      console.log('Connection ended (getThreadId)');
    });

    imap.connect();
  });
}

module.exports = {
  getThreadIdFromMessageId
};
