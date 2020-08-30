const http = require('https');
const { stringify } = require('querystring');
const { telegram: { token, chatId } } = require('./config.json');

module.exports = { sendMessage, getUpdates };

function sendMessage({ text }) {
  if (!token || !chatId) {
    return;
  }

  const options = {
    method: 'post',
    host: 'api.telegram.org',
    path: `/bot${token}/sendMessage?chat_id=${chatId}&${stringify({ text })}`,
  };

  http.request(options, function (res) {
    let response = '';
    res.on('data', function (chunk) {
      response += chunk;
    });

    res.on('end', function () {
      if (res.statusCode !== 200) {
        const { description } = JSON.parse(response);

        console.log('[telegram]', description);
      }
    });
  }).end();
}

function getUpdates() {
  const options = {
    method: 'get',
    host: 'api.telegram.org',
    path: `/bot${token}/getUpdates?chat_id=${chatId}`,
  };

  return new Promise((resolve, reject) => {
    http
      .request(options, function (res) {
        let response = '';
        res.on('data', function (chunk) {
          response += chunk;
        });

        res.on('end', function () {
          if (res.statusCode !== 200) {
            reject({ res, body: JSON.parse(response) });
          } else {
            resolve({ res, body: JSON.parse(response) });
          }
        });
      })
      .on('error', ({ code } = { code: 'EUNKNOWN' }) => {
        if (code === 'ENOTFOUND') {
          console.log('[telegram] Нет интернет соединения.');
        } else {
          console.log('[telegram] Неизвестная ошибка: ', code);
        }

        resolve(null);
      })
      .end();
  });
}
