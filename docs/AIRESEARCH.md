# MC Server AI Research Config

На сервере

в репо/agents есть 4 папки

config/

обновляется с гита автоматически

plugins/

нужно вручную кинуть нужные .jar файлы плагинов

worlds/

сюда нужно кинуть миры, которые вы хотите использовать на сервере

data/

тут сервак будет хранить всю последнюю инфу всего, можно менять тут всё и оно поменяется в сервере

## Bluemap

25610 порт веб сервера Bluemap
В конфиге плагинов надо указать:
Папка для карт: /data/bluemap/web/maps

Поставил аддон для регионов WG

https://bluemap.bluecolored.de/3rdPartySupport.html

ставятся как обычные плагины, настраиваются через конфиги плагинов

BlueBridge поддерживает wordguard

## Geyzer

Поставил geyzer и floodgate для поддержки bedrock, pe
Настройка у него необычная:
на каждый сервак ставишь floodgate
geyzer только на прокси - велосити
и порт надо пробросить для бедрока 19132

ещё есть pem ключ в floodgate конфигах, поставил везде один пока что


## ViaVersion

Все 3 viaVersion, ViaBackwards, ViaRewind поставлены на прокси - velocity
Из остальных серверов тогда нужно их убрать везде

## LuckPerms

TODO, не доделано, надо смотреть по настройке более подробно
пока просто закинул server: в конфиги серваков
и также поставил креды постгри

## IP Forward

Сервер видит всех игроков на IP шлюза WSL или Windows (если поставить network-mode: "host" в композ то он будет видеть 0.0.0.0, а если нет, то 172.0.0.что-то там, но это локальный для WSL ип)

Гемини Советует сделать так

Результат 0.0.0.0 подтверждает, что режим mirrored в WSL2 пока работает нестабильно в связке с Docker Desktop, особенно для входящих подключений. Он "схлопывает" сетевые уровни, и Velocity перестает понимать, откуда пришел пакет.
Совет: Удалите настройки из .wslconfig (или верните как было), этот путь тупиковый.
Единственное рабочее решение для Windows
Раз мы не можем заставить Windows передать пакет "как есть" (из-за архитектуры Docker/WSL), нам нужно обмануть Velocity.
Мы сделаем так:
Запустим на Windows (вне Docker) легкий прокси (Nginx), который увидит реальный IP.
Этот прокси завернет соединение в специальный пакет (PROXY Protocol) с информацией о реальном IP.
Velocity внутри Docker примет этот пакет, развернет его и "подумает", что игрок подключился с реального IP.
Вот пошаговая инструкция, как это сделать за 5 минут:
Шаг 1. Настройка Velocity
В файле velocity/velocity.toml включите поддержку протокола HAProxy:
code
Toml
haproxy-protocol = true
Важно: После этого к Velocity нельзя будет подключиться напрямую клиентом игры без прокси, поэтому не пугайтесь, если пока не сможете зайти.
Шаг 2. Изменение портов в Docker Compose
Освободим порт 25565 на Windows, чтобы его занял Nginx, а Velocity спрячем на другом порту (например, 25500).
В вашем docker-compose.yml:
code
Yaml
velocity:
    # ...
    ports:
      - "25500:25565"  # <-- Сменили внешний порт на 25500
      # Остальные порты можно оставить как есть или убрать, если они UDP (Nginx stream нужен для TCP)
Перезапустите контейнеры: docker-compose up -d velocity.
Шаг 3. Установка Nginx для Windows
Нам нужен Nginx, запущенный нативно на Windows, а не в Docker.
Скачайте nginx/Windows с официального сайта (zip-архив).
Распакуйте в любую папку (например, C:\nginx).
Откройте файл conf/nginx.conf.
Сотрите всё содержимое и вставьте этот конфиг:
code
Nginx
worker_processes  1;

events {
    worker_connections  1024;
}

stream {
    server {
        listen 25565; # Слушаем стандартный порт Minecraft на Windows
        
        # Пересылаем трафик на локальный Docker (порт, который мы открыли в Шаге 2)
        proxy_pass 127.0.0.1:25500;
        
        # Самая важная строка: добавляем заголовок с реальным IP
        proxy_protocol on;
    }
}
Шаг 4. Запуск
Запустите nginx.exe. (Окошко может мигнуть и исчезнуть — это нормально, он работает в фоне).
Проверьте в диспетчере задач, что процесс nginx висит.
Как это теперь работает
Игрок (IP: 123.45.67.89) подключается к вашему Windows-компу на порт 25565.
Nginx (Windows) принимает соединение. Так как он не в Docker, он видит реальный IP 123.45.67.89.
Nginx добавляет к данным приписку: "Эй, это соединение от 123.45.67.89" (это и есть proxy_protocol on).
Nginx отправляет это на 127.0.0.1:25500.
Docker перехватывает трафик на порту 25500 и отдает его Velocity.
Velocity видит настройку haproxy-protocol = true, читает приписку от Nginx и устанавливает игроку его реальный IP.
Это единственный надежный способ иметь реальные IP на Windows.

ПРОБРОС IP ЧЕРЕЗ NGINX

Скачать nginx для винды, кинуть куда-нибудь

conf/nginx.conf

    ```nginx
    worker_processes  1;

    events {
        worker_connections  1024;
    }

    stream {
        server {
            listen 25565; # Слушаем стандартный порт Minecraft на Windows
            
            # Пересылаем трафик на локальный Docker (порт, который мы открыли в Шаге 2)
            proxy_pass 127.0.0.1:25500;
            
            # Самая важная строка: добавляем заголовок с реальным IP
            proxy_protocol on;
        }
    }
    ```

Установка как сервис

C:\Users\Server>choco install nssm
Chocolatey v2.5.1
3 validations performed. 2 success(es), 1 warning(s), and 0 error(s).

Validation Warnings:
Do you want to run the script?([Y]es/[A]ll scripts/[N]o/[P]rint): Y

C:\Users\Server>nssm install nginx

открылось окно, выбрал путь nginx.exe в path

Service "nginx" installed successfully!

C:\Users\Server>nssm start nginx
nginx: START: Операция успешно завершена.


Это фигня. По итогу делаем через gobetween т.к. nginx не поддерживает udp на windows.

Скачал haproxy, кинул в папку D:/Repos.

D:\Repos\gobetween>nssm install haproxy
Service "haproxy" installed successfully!

Путь указал gobetween.exe

Аргументы запуска указал -c D:/Repos/NetTyanMC/gobetween.toml

D:\Repos\gobetween>nssm start haproxy
haproxy: START: Операция успешно завершена.
