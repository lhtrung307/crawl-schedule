const processMessage = require('../services/processMessage');

module.exports = async (req, res) => {
  if (req.body.object === 'page') {
    req.body.entry.forEach(async entry => {
      entry.messaging.forEach(async event => {
        if (event.message && event.message.text) {
          console.log('event.message :', event.message);
          await processMessage.getClassSchedule(event);
        }
      });
    });
    res.status(200).end();
  }
};
