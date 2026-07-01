+++
title = "Teamviewer命令行"
date = 2018-08-12
draft = false

[taxonomies]
tags = ["Linux"]

[extra]
source = "my_website"
+++
新安装了服务器的操作系统，然后不想爬上爬下接个显示器（实验室的服务器放在月亮之上），要怎么样才能完全从命令行配置好teamviewer？

先安装：`aurman -S teamviewer`。

然后，参照[之前的日记](@/blog/working-on-linux/index.en.md)中记载的做法，将teamviewer的daemon设置好。

为了显示teamviewer的ID，先得有个密码。否则出于安全考虑，是不会显示ID的：

```shell
sudo teamviewer --passwd yourpasswd
```

这样再`sudo teamviewer --info`就能看到ID了。

拿到了ID和密码，就能直接连接啦~

好了，接下来，我又吃精地发现一个问题，连接持续了几秒钟而已，挂了；再连接，连不上...我滚去一台局域网内的电脑在终端内尝试`teamviewer`，发现：

```text
Init...
CheckCPU: SSE2 support: yes
Checking setup...
Launching TeamViewer ...
Launching TeamViewer GUI ...
Aborted (core dumped)
```

折腾了很久，终于找到了一个解决办法：

`sudo nano /opt/teamviewer/config/global.conf`加上以下两行配置：

```text
[int32] EulaAccepted = 1
[int32] EulaAcceptedRevision = 6
```

再重启daemon服务，可以了！
