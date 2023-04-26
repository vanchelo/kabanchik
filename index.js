const fs = require('fs');
const http = require('https');
const { authCookie, sessionCookie, channels, checkInterval } = require('./config.json');
const { sendMessage: sms } = require('./sms');
const { sendMessage: telegram } = require('./telegram');
const category = +process.argv[2];

// On the first run, we collect new tasks without sending notifications
let isFirstCheck = true;

//
// Example of usage
//
const cmdExample = `
Usage:
  node index.js category

Settings:
  category - The identifier of the watched category.
             https://kiev.kabanchik.ua/ua/cabinet/all-tasks?page=1&category=212
                                                                            ^^^
Example:
  node index.js 212
`;

if (!authCookie) {
  console.log('The "authCookie" cookie is not set!');
  console.log(cmdExample);

  process.exit();
}

if (!sessionCookie) {
  console.log('The "sessionCookie" cookie is not set!');
  console.log(cmdExample);

  process.exit();
}

if (!category) {
  console.log('The "category" is not set!');
  console.log(cmdExample);

  process.exit();
}

if (!fs.existsSync(`./tasks-${category}.json`)) {
  writeCheckedTasks();
}

//
// Starting the process of checking for new tasks
//
check();

function checkForNewTasks({ authCookie, sessionCookie, category }) {
  let checkedTasks = readCheckedTasks();

  const options = {
    type: 'get',
    host: 'kiev.kabanchik.ua',
    path: `/ua/cabinet/all-tasks?page=1&category=${category}`,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv : 112.0) Gecko/20100101 Firefox/112.0',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'ru,en-US;q=0.9,en;q=0.8,uk;q=0.7',
      'X-Requested-With': 'XMLHttpRequest',
      'DNT': '1',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'Sec-GPS': '1',
      'Referrer': 'https://kiev.kabanchik.ua/ua/cabinet/category/santehnik',
      'Cookie': `session=${sessionCookie}; auth=${authCookie}`,
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'TE': 'trailers',
    },
  };

  return new Promise(function (resolve) {
    http
      .request(options, function (res) {
        let response = '';
        res.on('data', function (chunk) {
          response += chunk;
        });

        res
          .on('end', function () {
            let result;
            try {
              result = JSON.parse(response);
            } catch (e) {
              console.log('You need to update the "auth" cookie!');

              process.exit();
            }

            const notArchivedTasks = result
              .items
              .filter(({ archived }) => !archived);
            const newTasks = notArchivedTasks
              .filter(({ id }) => !checkedTasks.has(id));

            checkedTasks = new Set([...checkedTasks, ...newTasks.map(({ id }) => id)]);

            writeCheckedTasks(checkedTasks);

            resolve(newTasks);
          });
      })
      .on('error', ({ code } = { code: 'EUNKNOWN' }) => {
        if (code === 'ENOTFOUND') {
          console.log(new Date().toISOString(), 'No internet connection.');
        } else {
          console.log(new Date().toISOString(), 'Unknown error: ', code);
        }

        resolve(null);
      })
      .end();
  });
}

function check() {
  checkForNewTasks({ authCookie, sessionCookie, category })
    .then((tasks) => {
      if (tasks == null) {
        return;
      }

      if (tasks.length > 0) {
        if (!isFirstCheck) {
          notify(tasks);
        }
      }

      isFirstCheck = false;
    })
    .catch((e) => {
      console.log(new Date().toISOString(), 'Unknown error: ', e);
    })
    .finally(() => {
      setTimeout(function () {
        check();

        // Check for new tasks every n minutes.
        // Random value from "checkInterval.min" to "checkInterval.max".
        // The default value is between 2 and 5 minutes.
      }, rand(checkInterval.min, checkInterval.max) * 60 * 1000);
    });
}

function notify(tasks) {
  if (channels.console) {
    console.log(new Date().toISOString());
    console.log(tasks.map((task) => task.url).join('\n'));
  }

  //
  // Sending notifications to Telegram
  //
  if (channels.telegram) {
    const text = tasks.map((task) => task.url).join('\n');

    telegram({ text });
  }

  //
  // Sending an SMS notifications
  //
  if (channels.sms) {
    const text = tasks.map(task => task.url).join('\n');

    sms({ text });
  }
}

function writeCheckedTasks(tasks = []) {
  return fs.writeFileSync(`./tasks-${category}.json`, JSON.stringify([...tasks], null, 2), 'utf8');
}

function readCheckedTasks() {
  try {
    return new Set(JSON.parse(fs.readFileSync(`./tasks-${category}.json`, 'utf8')));
  } catch (e) {
    return new Set();
  }
}

function rand(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);

  return Math.floor(Math.random() * (max - min + 1)) + min;
}
