const axios = require('axios');
require('dotenv').config();

// OpenAI API key
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function callAPIChatGPT(prompts, retries = 3) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${OPENAI_API_KEY}`
  };

  const data = {
    "model": "gpt-3.5-turbo",
    "messages": prompts,
    "temperature": 0.7,
    "n": 1,
    "max_tokens": 600,
    //"stop": "\n", // Lengthen the response time
    "presence_penalty": 0,
    "frequency_penalty": 0
  };

  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', data, { headers });
    return response.data.choices[0].message.content;
  } catch (error) {
    if (error.response.status === 429 && retries > 0) {
      console.log('Too many requests. Retrying in 30 seconds...');
      await new Promise(resolve => setTimeout(resolve, 30000));
      return callAPIChatGPT(prompts, retries - 1);
    } else {
      let status = error.response.status ? error.response.status : "inconnu";
      let message = error.response.message ? error.response.message : error.message;
      console.log("Error calling chatGPT API ("+status+") :"+message);
      throw error;
    }
  }
}


module.exports = callAPIChatGPT;