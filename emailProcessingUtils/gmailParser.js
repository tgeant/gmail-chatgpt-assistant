// Libraries
const replyParser = require('node-email-reply-parser');

// This function takes an email address and returns the role of the email sender,
// 'assistant' if it's the same as the environment variable EMAIL_USER, 'user' otherwise.
function emailToRole(emailAddress) {
    return emailAddress === process.env.EMAIL_USER ? 'assistant' : 'user';
}

// This function takes a text and extracts the email address from the first line,
// assuming the email address is enclosed in angle brackets.
function extractEmailFromFirstLine(text) {
    const firstLine = text.split('\n')[0];
    const regex = /<([^>]+)>/;
    const match = firstLine.match(regex);

    if (match) {
        return match[1];
    }

    return null;
}

// This function takes a text and removes the email quoting format,
// '>' character followed by a space, from the beginning of each line.
function cleanReplyText(text) {
    const lines = text.split('\n');
    lines.shift(); // Remove the first line
    const cleanedLines = lines.map(line => line.replace(/^>\s*/, ''));
    return cleanedLines.join('\n');
}

// This function takes a history message object and returns an array of messages
// with roles (assistant or user) based on the email addresses and content.
// The resulting messages are formatted according to the GPT-3.5 Chat API.
function historyMessageToMessagesWithRoles(msg) {
    // Extract the content from the message object and Parse the email content
    let emailContent = msg.content;
    let reply = replyParser(emailContent);

    // Create a message object for the visible (non-quoted) text of the email with the appropriate role
    let visibleResponse = { "role": emailToRole(msg.from), "content": reply.getVisibleText() };

    // Initialize the result array with the visible response
    let result = [visibleResponse];

    // Find the first quoted fragment in the parsed reply object
    let firstQuotedFragment = reply.getFragments().find(fragment => fragment._isQuoted);
    let firstQuotedContent = firstQuotedFragment ? firstQuotedFragment._content : null;

    // If there is quoted content, extract the email address of the sender and create a message object
    if (firstQuotedContent) {
        let mailFirstQuote = extractEmailFromFirstLine(firstQuotedContent);
        result.unshift({ "role": mailFirstQuote ? emailToRole(mailFirstQuote) : 'assistant', "content": cleanReplyText(firstQuotedContent) });
    }

    // Return the resulting array of messages with roles
    return result;
}


// Export the historyMessageToMessagesWithRoles function for use in other modules
module.exports = {
    historyMessageToMessagesWithRoles,
};
