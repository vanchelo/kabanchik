# Kabanchik new tasks notifier

### Requirements
- Node.js >= 10

### Setup
1. Clone repository:
    ```bash
    git clone git@github.com:vanchelo/kabanchik.git
    ```
1. Create config:
    ```bash
    cp config.example.json config.json
    ```
   Открываем файл `config.json` на редактирование в любимом редакторе.
1. Добавляем **authCookie**. Значение куки которую устанавливает Кабанчик после успешной авторизации. Можно найти в `Dev Tools → Storage → Cookies → "auth"`.
1. Настраиваем отправку SMS. Заходим в аккаунт `https://atomic.center/settings/` → `API`. Копируем и добавляем в конфиг публичный и приватный ключи.
```
"sms": {
  "sender": "allservice", <<< Имя отправителя
  "phone": "",            <<< На какой номер отправлять уведомления
  "publicKey": "",        <<< Публичный ключ
  "privateKey": ""        <<< Приватый ключ
}
```
1. Настраиваем отправку в Telegram.
```
"telegram": {
  "token": "", <<< Токен телеграм бота
  "chatId": "" <<< ID канала, должен быть со знаком "-" в начале. Например, -12345
}
```

По умолчанию включены оба канала для отправки уведомлений SMS и Telegram. Для отключения какого-то канала нужно в `config.json` установить соответствующему каналу `false`
```
"channels": {
  "sms": false <<< Отключаем отправку SMS
}
```

### Usage
```bash
node index.js category
```

### Settings
- **category** - Идентификатор отслеживаемой категории.
    Можно найти в `Dev Tools → Network` открыв нужную категорию. Искать в запросе `all-tasks`.
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
- 212 - Установка и замена фильтров для воды
- 1121 - Сантехнические услуги

## License and Copyright

This software released under the terms of the [MIT license](./LICENSE).
