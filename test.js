const Imap = require('imap');
const fetchThread = require('./fetchThread');
require('dotenv').config();


(async () => {
  try {
    const threadId = '1765231660402334219';
    const threadArray = await fetchThread(threadId);
    console.log(JSON.stringify(threadArray));
  } catch (error) {
    console.error(error);
  }
})();
