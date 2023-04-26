# Kabanchik new tasks notifier

### Requirements
- Node.js >= 10

### Setup
1. Clone repository:
    ```bash
    git clone git@github.com:vanchelo/kabanchik.git
    ```
1. Create a config:
    ```bash
    cp config.example.json config.json
    ```
   Open `config.json` to edit in your favorite editor.
1. Add **authCookie** and **sessionCookie**. The value of cookie that the Kabanchik sets after successful authorization. You can find it in `Dev Tools → Storage → Cookies → "auth" and "session"`.
1. Set up SMS notifications. Go to the account `https://atomic.center/settings/` → `API`. Copy and add public and private keys to `config.json`.
```
"sms": {
  "sender": "allservice", <<< Sender name
  "phone": "",            <<< What number to send notifications to
  "publicKey": "",        <<< Public key
  "privateKey": ""        <<< Private key
}
```
1. Set up Telegram notifications.
```
"telegram": {
  "token": "", <<< Token of the Telegram Bot
  "chatId": "" <<< The channel ID, must have a "-" at the beginning. For example, -12345
}
```

By default, both SMS and Telegram notifications channels are enabled. To disable a channel, set `false` in `config.json` to the corresponding channel
```
"channels": {
  "sms": false <<< Disabling SMS notifications
}
```

### Usage
```bash
node index.js category
```

### Settings
- **category** - The identifier of the watched category.
    Can be found in `Dev Tools → Network` by opening the desired category. Search for `all-tasks`.
    ```
    https://kiev.kabanchik.ua/cabinet/all-tasks?page=1&category=212
                                                                ^^^
    ```
### Usage example
```bash
node index.js 212
```

### Additional info

Categories:
- 212 - Installation and replacement of water filters
- 1121 - Plumbing services

## License and Copyright

This software released under the terms of the [MIT license](./LICENSE).
