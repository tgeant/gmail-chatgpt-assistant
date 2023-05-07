const Imap = require('imap');
const { simpleParser } = require('mailparser');
const nodemailer = require('nodemailer');
const replyParser = require('node-email-reply-parser');

require('dotenv').config();

// fetching the email thread
const fetchThread = require('./fetchThread');

// chatGPT
const callAPIChatGPT = require('./openai');


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

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


async function getThreadIdFromStream(parsedEmail) {
  try {
    const threadId = parsedEmail.headers.get('x-gm-thrid');
    return threadId;
  } catch (err) {
    console.error(err);
    return null;
  }
}

// Function to extract email conversation from the email content
function extractEmailHistory(emailContent) {

  let reply = replyParser(emailContent);

  console.log("JSON REPLY:\n"+JSON.stringify(reply));

  const messagesWithRole = [];
    messagesWithRole.push({ "role": "user", "content": reply.getFragments()[0] });
    return messagesWithRole;
}


// Function to process and respond to emails
async function processEmail(email) {
  console.log("Processing email:", email.subject);

  console.log(JSON.stringify(email));

  let messageContent = email.text || email.html;

  let threadId = await getThreadIdFromStream(email);

  if(threadId!=null){
    fetchThread(threadId);
    console.log("threadId: "+threadId);
  }
  
  let messages = extractEmailHistory(messageContent);


  // Create prompts for the API
  const prompts = [
    { "role": "system", "content": process.env.SYSTEM_PROMPT },
    ...messages,
  ];

  try {
    // Call the API with prompts
    const apiResponse = await callAPIChatGPT(prompts);

    // Create response email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email.from.value[0].address,
      subject: `RE: ${email.subject}`,
      text: apiResponse,
    };

    // Send response email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
      } else {
        console.log('Email sent successfully:', info.response);
      }
    });
  } catch (error) {
    console.error('Error processing email:', error);
  }
}


// Function to fetch unread emails
function fetchUnreadEmails() {
  imap.search(['UNSEEN'], (error, results) => {
    if (error) {
      console.error('Error searching for emails:', error);
      return;
    }

    // Check if there are no unread emails and start idle mode if true
    if (results.length === 0) {
      console.log('No unread emails found.');
      startIdle();
      return;
    }

    // Fetch unread emails, mark them as seen and retrieve their bodies
    const fetch = imap.fetch(results, {
      bodies: '',
      markSeen: true,
    });

    // Listen for the 'message' event when fetching emails
    fetch.on('message', (msg, seqno) => {
      let emailData = '';

      // Listen for the 'body' event to retrieve the email body
      msg.on('body', (stream, info) => {
        // Concatenate email data chunks as they are received
        stream.on('data', (chunk) => {
          emailData += chunk;
        });

        // When the email body stream ends, parse the email data
        stream.on('end', () => {
          simpleParser(emailData)
            .then((email) => {
              processEmail(email);
            })
            .catch((err) => {
              // Handle any errors that occurred during email parsing
              console.error("Error parsing email:", err);
            });
        });
      });
    });

    // Listen for the 'error' event during email fetching
    fetch.on('error', (error) => {
      console.error('Error fetching emails:', error);
    });

    // Listen for the 'end' event after all emails have been fetched
    fetch.on('end', () => {
      console.log('All unread emails have been processed.');
      // Start the IMAP idle mode to wait for new emails
      startIdle();
    });
  });
}

// Function to start idle mode
function startIdle() {
  // Add a delay of two seconds before entering IDLE mode
  // This delay ensures that any ongoing email processing is completed
  // before the IMAP client starts waiting for new emails
  setTimeout(() => {
    imap.once('idle', () => {
      console.log('Listening for new emails...');
      imap.done();
    });
  }, 2000);
}

let firstMailEvent = true;

// IMAP new mail event
imap.on('mail', (numNewMail) => {
  if (firstMailEvent) {
    firstMailEvent = false;
    return;
  }

  console.log(`New email${numNewMail > 1 ? 's' : ''} received.`);
  fetchUnreadEmails();
});

// IMAP ready event
imap.once('ready', () => {
  imap.openBox('INBOX', false, (error, box) => {
    if (error) {
      console.error("Error opening the inbox:", error);
      return;
    }

    fetchUnreadEmails();
  });
});

// IMAP error event
imap.once('error', (error) => {
  console.error('IMAP error:', error);
});

// IMAP end event
imap.once('end', () => {
  console.log('IMAP connection closed.');
});

// Connect to IMAP
imap.connect();