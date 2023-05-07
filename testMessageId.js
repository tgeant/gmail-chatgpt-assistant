const Imap = require('imap');
require('dotenv').config();
const { simpleParser } = require('mailparser');

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

(async () => {
  try {
    const messageId = '<CAGYAXQ4CrTGDZ3-gFk6mdKKuZJC+oL9Xd_XhCgMqrFfa6iv0SA@mail.gmail.com>';
    const threadId = await getThreadIdFromMessageId(imap, messageId);
    console.log('Thread ID:', threadId);
  } catch (error) {
    console.error(error);
  }
})();


async function getThreadIdFromMessageId(imap, messageId) {
  return new Promise((resolve, reject) => {
    imap.once('ready', function () {
      imap.openBox('INBOX', true, async function (err, box) {
        if (err) reject(err);

        imap.search([['HEADER', 'MESSAGE-ID', messageId]], async function (err, results) {
          if (err) reject(err);

          const f = imap.fetch(results, { bodies: ''});

            f.on("message", async function(msg, seqno) {
                msg.on("attributes", function(attrs) {
                    // Get the thread id from here
                    thread_id = attrs["x-gm-thrid"]
                    console.log("thread id: "+thread_id);
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
      console.log('Connection ended');
    });

    imap.connect();
  });
}
