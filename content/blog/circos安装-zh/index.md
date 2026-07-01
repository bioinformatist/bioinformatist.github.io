+++
title = "Circos安装很痛苦？教你两句命令解决所有依赖"
date = 2018-09-01
draft = false

[taxonomies]
tags = ["Linux", "数据可视化"]

[extra]
source = "my_website"
+++
之前听很多人吐槽说安装Circos费劲，各种Perl库装不上，装上了又找不到，今天让我来为大家介绍正确的体位：

下载/解压Circos，并将其主程序添加到`$PATH`之后，是可以使用`circos -modules`来自动检查其perl依赖是否满足的，其输出大概为这样：

```text
ok       1.50 Carp
ok       0.39 Clone
missing            Config::General
ok       3.74 Cwd
ok      2.170 Data::Dumper
... (此处省略65536字hhhhh)
```

好的！不要慌！先`su`一下切到管理员账户下，然后`echo 'yes' | cpan App::cpanminus`把cpanm装上。什么？你不是管理员？那你喊狗管理帮你装Circos不就好了...

然后`exit`回到自己的用户下，`circos -modules | perl -anE'print qq{$F[1] } if /^miss/ }{ say' | cpanm`，然后去泡个茶。

回来你会吃了一精，所有缺少的模块都装好了。再运行`circos -modules`看看...嗯？还是都是miss？没关系，是@INC缓存没更新的缘故。去一个新的tty试一下，一切正常。

好，这样成功解决了Circos的棘手的安装问题。祝各位生活性福美满。
