const FACEBOOK_ACCESS_TOKEN = require('../config').facebookToken;
const request = require('request');
const crawlSchedule = require('./crawlSchedule');

const sendTextMessage = async (senderId, text) => {
  try {
    await request({
      url: 'https://graph.facebook.com/v2.6/me/messages',
      qs: { access_token: FACEBOOK_ACCESS_TOKEN },
      method: 'POST',
      json: {
        recipient: { id: senderId },
        message: { text }
      }
    });
  } catch (error) {
    console.log('error :', error);
  }
};

module.exports.getClassSchedule = async event => {
  const senderId = event.sender.id;
  const message = event.message.text;
  console.log('message :', message);
  let response = null;
  try {
    response = await crawlSchedule.crawlClassSchedule();
  } catch (error) {
    console.log('error :', error);
    response = 'Error when get schedule. Please try again!';
  }
  await sendTextMessage(senderId, response);
  console.log('Message sent');
};
