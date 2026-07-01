+++
title = "如何克服开启中大代理后访问外网资源失败的问题"
date = 2018-12-22
draft = false

[taxonomies]
tags = ["计算机网络", "Linux"]

[extra]
source = "my_website"
toc = true
+++
中大的睿智代理，一直有这个**用了代理就没办法访问任何校外互联网资源**的奇奇怪怪的毛病。对于一个经常需要在家工作的计算狗而言，这实在太不友好了。这里详细记录一下使用超低系统资源（<50MB RAM， CPU占用≈0%）解决这个问题。

## 致谢

- 感谢德华君提供这个野路子以及过程中的指导
- 感谢Nick湿胸借用上网账号

## 大致思路

不清楚是NAT啊，还是DNS服务更改的问题，总之这个代理只要使用了，再想使用互联网的资源就崩了，因此克服这个问题的唯一办法就是，**在访问外网的时候关掉代理**。但是Windows下通过IE浏览器登录代理，使用的是EasyConnect客户端，断了似乎就是断了，网页再认证还需要**输入验证码**。

所以需要曲线救国，即**访问外网资源的时候不走代理直接连接**。咦？这和我们科学上网的需求好相似！你总不想打开国内页面的时候也绕路走你的国外VPS吧！那么为什么不用shadowsocks解决这个问题呢？

因此最后解决问题的路线就是：

1. 虚拟机内开启学校代理并开启服务
2. 虚拟机上架设shadowsocks server端并开启服务
3. 本机使用shadowsocks client
4. 本地使用校内代理的两种情况：
    - 对于网页（比如RStudio server）使用Chrome浏览器的SwitchyOmega插件
    - SSH和SFTP连接直接使用配置了代理的Xshell和Xftp

## 安装虚拟机

先下载一个虚拟机程序，建议用VM Virtualbox，虽然据说VMware的硬件兼容好点，但是我的目的简单，只是在后台run一个Linux用来使用代理而已，因此这个轻量级的软件比较适合。操作系统使用Ubuntu Server 18.04：

- 我们不需要图形界面
- Ubuntu的LTS是最稳定的Server操作系统之一

虚拟机的配置上，RAM可以随便给个100M+（不会真的用完的，host消耗很小），硬盘就用那个vdi文件动态分配就好，那么大小也就无所谓了（理论上动态分配会稍微影响点IO性能，但是和我们的主题无关）。

命令行安装操作系统可能有点蛋疼，但是基本上也是一路选下一步就可以的。

## 虚拟机Linux配置

这个时候，还是先装好Xshell吧，不要头铁：没有SSH，你就这样在终端里面，你**连一个普通命令的`--help`返回内容都浏览不全**；想复制个URL却发现**没得复制粘贴**，浑身难受。Ubuntu Server默认是开了22端口的，也开启了sshd服务，所以`ifconfig`查到IP直接就可以连了。虚拟机的网络设置可以有以下两种策略：

1. 桥接模式：和host在一个网段
2. NAT模式：需要端口映射，在本例中，你至少需要映射22端口用作ssh，再映射一个shadowsocks用的端口。

搞定了之后，就陆陆续续安装一下必要工具：

```shell
sudo apt-get update
sudo apt-get dist-upgrade
sudo apt install openconnect
sudo apt-get install python-pip
sudo pip install shadowsocks
```

使用openconnect需要一个厉害的配置文件vpnc-script，可以用`wget`从[这里](https://gitlab.com/openconnect/vpnc-scripts/-/raw/master/vpnc-script)下载。你应该到现在为止没有切换过当前tty的工作目录，那漂亮啊，就下载到这吧，用起来也方便...

然后开启openconnect服务：

```shell
sudo openconnect -b --no-dtls --script ~/vpnc-script https://ocvpn.sysu.edu.cn --servercert sha256:a0cc6612c7310494b31ad62e76255373f056ac128c8489ac58562f6fe57ae8e9
```

`--servercert`参数值是双鸭山大学提供的证书。你可以不加上这个参数，但是它会逼着你加上。

输入用户名和密码，程序会返回一个PID之后在后台运行。

接下来开启shadowsocks服务：

```shell
sudo ssserver -p 2333 -k 930829 -m rc4-md5 -d start
```

我比较懒，就直接这样开启SS服务而不是写配置文件了：`-p`是端口；`-k`是密码我用了自己生日，你们可以随意；`-m`是加密方法，我X我和我虚拟机连接我丝毫不虚，选个复杂度低的速度快点负荷小点；`-d`如果替换成stop就是停止服务。

在Ubuntu Server 18.04上，你可能会遇到这样一个错误：

```text
# 此处省略99999行
AttributeError: /usr/lib/x86_64-linux-gnu/libcrypto.so.1.1: undefined symbol: EVP_CIPHER_CTX_cleanup
```

这是由于在openssl 1.1.0中废弃了 `EVP_CIPHER_CTX_cleanup()` 函数而引入了 `EVE_CIPHER_CTX_reset()` 函数所导致的。

解决方式也是简单，直接找到使用的openssl.py文件（**我省略的那部分异常信息里就有它的位置**），把里面的所有cleanup字样全部替换为reset，就舒服了。直接`vim`里面批量替换，别问我怎么操作，问就是不告诉你。

## 我要怎么使用虚拟机里面的代理呢

首先，你需要[shadowsocks client](https://github.com/shadowsocks/shadowsocks-windows)来把代理服务器的shadowsocks协议转发为socks5协议。你可能需要在两个不同的目录运行两个独立的shadowsocks进程（端口各自不同），以方便同时使用科学上网和虚拟机中架设的中大代理。

### 访问网页

比如RStudio server，比如hugo的预览，都是要访问内网网页的。使用Chrome浏览器的SwitchyOmega插件，可以妥善解决这个问题。记得在auto switch里面，将使用中大代理的情景模式的触发条件**用带有通配符的IP设置为同一网段**。

### 使用SSH连接

在Xshell的连接属性里面设置好使用代理（注意端口）。

至此，科学上网/直连/中大代理可以和睦相处了。

## 补充

### 我需要一个service

理想状态下，应该是虚拟机开机自动运行这个openconnect命令的，然后如果崩溃可以自动恢复，所以要把它做成一个service的形式比较好。Ubuntu的这些service一般在`/lib/systemd/system/`，所以在这里面操作吧：

```shell
cd /lib/systemd/system/
sudo touch sysu-proxy.service
```

然后填内容进去：

```text
[Unit]
Description=sysu-proxy
After=network.target
StartLimitIntervalSec=0
StartLimitAction=reboot
[Service]
Type=simple
Restart=always
RestartSec=1
User=ysun
ExecStart=/bin/echo 'passwd' | /usr/sbin/openconnect --no-dtls --script ~/vpnc-script https://ocvpn.sysu.edu.cn --servercert sha256:a0cc6612c7310494b31ad62e76255373f056ac128c8489ac58562f6fe57ae8e9 -u username

[Install]
WantedBy=multi-user.target
```

这里面要解释一下的：
- `Restart=always`可以保证进程挂了就自动重新运行
- `RestartSec=1`一旦挂了，它就会不断尝试重新运行，那么为了防止某些特定情况下一直重新运行增加服务器负载，还是间隔设置久一点好点（间隔为1秒）
- `ExecStart=...`对于需要交互式输入密码的，可以用这个技巧，通过管道将特定字符传过去
- `StartLimitIntervalSec=0`是防止放弃重新运行的。理论上是这样：还有一个参数值，比如`StartLimitBurst=5`，同时再有`StartLimitIntervalSec=10`的话呢，那么就如果在10秒内失败了5次，就放弃运行了（何弃疗！）防止这个情况发生就可以这样设置为0
- 其实`[Unit]`还可以加上`StartLimitAction=reboot`如果上面设置不是0，崩了，还是可以通过这个方式重启操作系统

好了，接下来就很舒服了：

```shell
sudo systemctl enable sysu-proxy.service
sudo systemctl daemon-reload
sudo systemctl restart sysu-proxy.service
```
