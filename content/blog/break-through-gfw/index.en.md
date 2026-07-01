+++
title = "Break through GFW blockade with shadowsocks (built on Digital Ocean or AWS)"
date = 2017-02-15
description = "Guide to break through Chinese government's GFW"
draft = false
aliases = ["/blog/break-through-gfw/"]

[taxonomies]
tags = ["Network"]

[extra]
source = "my_website"
toc = true
+++
## On *Digital Ocean*

1. If you're a student, try apply for a [student pack](https://education.github.com/pack/) on *GitHub*.
2. Use code of *Digital Ocean* in student pack to register a **new account** and buy a droplet at *San Fransico* (both node 1 & 2 is OK, maybe 2 is better).
3. Install *Fedora 25 (64 bit)* on your VPS then do as below:

Install shadowsocks:

```shell
sudo dnf install m2crypto python-setuptools
easy_install pip
pip install shadowsocks
```

Shadowsocks use a json file as configuration. For all users, this file can be placed in `/etc`.
Use `vi  /etc/shadowsocks.json` to edit the file and fill in contents below:

```json
{
    "server":"0.0.0.0",
    "server_port":"port",
    "local_address": "127.0.0.1",
    "local_port":1080,
    "password":"passwd",
    "timeout":300,
    "method":"rc4-md5",
    "fast_open": false,
    "workers": 1
}
```

To keep shadowsocks running in background after you cut off SSH connection, you may use `supervisor`.

```shell
sudo dnf install supervisor
echo_supervisord_conf > /etc/supervisord.conf
```

Execute `vi /etc/supervisord.conf` to configure it:

```text
[program:shadowsocks]
command=ssserver -c /etc/shadowsocks.json
autostart=true
autorestart=true
user=nobody
```

Finally, `supervisord` or `supervisord -c /etc/supervisord.conf` to start shadowsocks server and visit [the project's homepage](https://github.com/shadowsocks) on GitHub for a client.
For Windows user, try https://github.com/shadowsocks/shadowsocks-windows/releases.
For Linux user, [shadowsocks-qt5](https://github.com/shadowsocks/shadowsocks-qt5/releases) is a good choice.
There're also [shadowsocks for Android](https://github.com/shadowsocks/shadowsocks-android/releases) and [shadowsocks for iOS](https://github.com/shadowsocks/shadowsocks-iOS/releases).

### Appendix

`supervisorctl status` for checking all processes' status controlled by *supervisor*.

`supervisorctl stop ssserver` for kill a process.

`supervisorctl start ssserver` for start a process.

`supervisorctl shutdown` for killing all processes controlled by *supervisor*.

### Known issue

Sometimes shadowsocks works fine in *Windows*,
but your browser can not visit pages in *Arch Linux*, 
it is because that too frequently updating `libQtShadowsocks` brings conflict.

To [solve this problem](https://github.com/shadowsocks/shadowsocks-qt5/issues/550),
you can downgrade `libQtShadowsocks` or change the encryption method from `AES-256-CFB` to `AES-256-CTR`.

## On *AWS*

1. Creat an *EC2* (choose *Ubuntu* here) instance, and be sure to keep in mind that the key pair should be generated during the process, then download your private key (.pem) file.
2. Change your private key's priviledge to 400: `chmod 400 /path/my-key-pair.pem`.
3. Log-in your instance with such command: `ssh -i /path/my-key-pair.pem ubuntu@ec2-13-124-234-100.ap-northeast-2.compute.amazonaws.com`.
4. Upgrade OS:

    ```shell
    sudo apt-get update
    sudo apt-get dist-upgrade
    ```
5. Install Shadowsocks:

    ```shell
    sudo apt-get install python-pip
    sudo pip install shadowsocks
    ```
> [!NOTE]
> You may see this error during installation of Shadowsocks:
>
> ```text
> Traceback (most recent call last):
> File "/usr/bin/pip", line 11, in <module>
>     sys.exit(main())
> File "/usr/lib/python2.7/dist-packages/pip/__init__.py", line 215, in main
>     locale.setlocale(locale.LC_ALL, '')
> File "/usr/lib/python2.7/locale.py", line 581, in setlocale
>     return _setlocale(category, locale)
> locale.Error: unsupported locale setting
> ```
>
> It is caused by wrong language settings. Fix it by `export LC_ALL=C` (only works in **current** tty), then try again.
    
6. Start Shadowsocks server by: `sudo ssserver -p 2333 -k password -m rc4-md5 -d start` (use `2333` as port and `password` as password, change `start` to `stop` if you wanna stop the process).

> [!NOTE]
> You should use `AES-256-CTR` as encryption method at ArchLinux to avoid problems brought by over-updated `libqtshadowsocks`.
    

### Optimization

#### Break though limit of file open number

1. Edit `limits.conf`: `sudo vi /etc/security/limits.conf`.
2. Add those two lines:

    ```text
    * soft nofile 51200
    * hard nofile 51200
    ```
3. Restart the OS.

#### Improve system performance

1. Edit `sysctl.conf`: `sudo vi /etc/sysctl.conf`.
2. Add these lines:

    ```text
    fs.file-max = 51200
    net.core.rmem_max = 67108864
    net.core.wmem_max = 67108864
    net.core.netdev_max_backlog = 250000
    net.core.somaxconn = 4096
    net.ipv4.tcp_syncookies = 1
    net.ipv4.tcp_tw_reuse = 1
    net.ipv4.tcp_tw_recycle = 0
    net.ipv4.tcp_fin_timeout = 30
    net.ipv4.tcp_keepalive_time = 1200
    net.ipv4.ip_local_port_range = 10000 65000
    net.ipv4.tcp_max_syn_backlog = 8192
    net.ipv4.tcp_max_tw_buckets = 5000
    net.ipv4.tcp_fastopen = 3
    net.ipv4.tcp_rmem = 4096 87380 67108864
    net.ipv4.tcp_wmem = 4096 65536 67108864
    net.ipv4.tcp_mtu_probing = 1
    net.ipv4.tcp_congestion_control = hybla
    ```
3. Run `sudo sysctl -p` to reload settings.

#### ServerSpeeder

ServerSpeeder cannot be used on Ubuntu 16.04 now.

#### net-speeder

net-speeder will double the network traffic. Not recommended.
