+++
title = "因为硬盘Block不够，导致操作系统不能更新是要有多蛋疼？"
date = 2018-07-18
draft = false

[taxonomies]
tags = ["Linux"]

[extra]
source = "my_website"
+++
喏，众所周知，ArchLinux那是要每天睡醒了就`aur -Syu`一轮压压惊的，然后齐胖胖的服务器已经两周多（至少）没更新过，我感觉药丸，赶紧更新去，然后我就傻眼了：

```text
error: Partition / too full: 225715 blocks needed, 130394 blocks free
error: failed to commit transaction (not enough free disk space)
Errors occurred, no packages were upgraded.
```

啊？

关于什么是blocks，就不多解释了，鸟哥里面写的很清楚。基本上发生这样的问题，可能有两种原因：

1. 硬盘格式化的时候，block设置得过大了。一般来说是4KB，使用者在对硬盘格式化的时候应该根据服务器的用途设计好block的大小。比如如果是邮件服务器等文件普遍比较小的，那么用较大的block势必导致硬盘空间的浪费；
2. 出现了一堆特别特别小的文件。也许是日志文件或者其他？这就不得而知了。

我们的服务器是一般用途，所以格式化用的也是默认参数（当然是做了4K对齐的），因此应该不会出现第一条问题。所以切到root之后，看了一下究竟是哪里比较大：

```shell
cd /
du -hsx * | sort -rh | head -10
```

输出是这样的：

```text
du: cannot access 'proc/39956/task/39956/fd/4': No such file or directory
du: cannot access 'proc/39956/task/39956/fdinfo/4': No such file or directory
du: cannot access 'proc/39956/fd/4': No such file or directory
du: cannot access 'proc/39956/fdinfo/4': No such file or directory
2.8T    backup
2.6T    data
2.5T    data2
15G     home
7.5G    var
7.1G    usr
3.4G    opt
52M     boot
14M     etc
13M     tmp
```

那些什么cannot access的就不管了，是内存中的进程缓存并非完全实时的缘故。
至于下面的内容，就很奇怪了。前三个是挂载在其他硬盘上的，`/home`的大小也还算正常（此前我单独检查过用户目录），那么最可疑的就是`/var`和`/usr`两个了。

就这样一层一层检查下去，发现`/var/cache`里的缓存也挺多的（感谢齐胖胖提醒），然后就用`pacman -Sc`做个清理了。

然后就可以了。
