const http = require('https');
const crypto = require('crypto');
const querystring = require('querystring');
const { sms: { publicKey, privateKey, sender, phone } } = require('./config.json');

module.exports = sendSms;

function sendSms({ text }) {
  if (!publicKey || !privateKey || !sender || !phone) {
    return;
  }

  const data = { text, phone, sender, action: 'sendSMS' };
  const params = querystring.stringify({
    key: publicKey,
    sum: controlSum(data),
    text,
    phone,
    sender,
  });

  const options = {
    method: 'post',
    host: 'api.atompark.com',
    path: `/api/sms/3.0/sendSMS?${params}`,
  };

  http.request(options, function (res) {
    let response = '';
    res.on('data', function (chunk) {
      response += chunk;
    });

    res.on('end', function () {
      const { error } = JSON.parse(response);
      if (error) {
        console.log('[sms]', error);
      }
    });
  }).end();
}

function controlSum(data) {
  data = {
    version: '3.0',
    key: publicKey,
    ...data,
  };

  const sum = Object.keys(data).sort().reduce((sum, key) => sum + data[key], '') + privateKey;

  return crypto.createHash('md5').update(sum).digest('hex');
}
