+++
title = "aurman在操作系统更新之后不能用了？"
date = 2018-08-08
draft = false

[taxonomies]
tags = ["Linux"]

[extra]
source = "my_website"
+++
2018年8月7日，星期二，天气晴（广州有哪天是不下一阵雨的？）

早上睡醒一如既往地挂代理，开终端，`aurman -Syu`，然后忽然想装一个pbzip2，我就吃精地发现，aurman不能用了？WTF！

异常信息大概长这样：

```text
Traceback (most recent call last):
  File "/usr/bin/aurman", line 6, in <module>
    from pkg_resources import load_entry_point
  File "/usr/lib/python3.6/site-packages/pkg_resources/__init__.py", line 3095, in <module>
    @_call_aside
  File "/usr/lib/python3.6/site-packages/pkg_resources/__init__.py", line 3079, in _call_aside
    f(*args, **kwargs)
  File "/usr/lib/python3.6/site-packages/pkg_resources/__init__.py", line 3108, in _initialize_master_working_set
    working_set = WorkingSet._build_master()
  File "/usr/lib/python3.6/site-packages/pkg_resources/__init__.py", line 570, in _build_master
    ws.require(__requires__)
  File "/usr/lib/python3.6/site-packages/pkg_resources/__init__.py", line 888, in require
    needed = self.resolve(parse_requirements(requirements))
  File "/usr/lib/python3.6/site-packages/pkg_resources/__init__.py", line 774, in resolve
    raise DistributionNotFound(req, requirers)
pkg_resources.DistributionNotFound: The 'aurman==2.17.1' distribution was not found and is required by the application
```

好了，看到这个我就明白了，一定是Python做了大版本更新，aurman作为一个纯python的包管理器，躺枪！

（喜欢滚动更新？啪！）

赶紧去社区兜了一圈，发现aurman的作者已经火速更新了源码（其实还不是就改个数字嘛摔），然后更新了AUR上的snapshot，我们只要重装一下aurman就什么问题都没有了。

所以去AUR下载了snapshot文件，解压缩拿到PKGBUILD，正当我`makepkg -sci`的时候，又凉凉了！

```text
==> Verifying source file signatures with gpg...
    aurman_sources git repo ... FAILED (unknown public key 465022E743D71E39)
==> ERROR: One or more PGP signatures could not be verified!
```

好嘛好嘛。签名问题。既然我确定我的PKGBUILD是正规途径下载搞到的，那无所谓咯，我`gpg --recv-key 465022E743D71E39`添进来就是:

```text
gpg: keyserver receive failed: Server indicated a failure
```

作为一个国内玩家，我已经看了不下1000000000000000000000次这种异常信息了（误）

然后再`makepkg -sci`，完成package build之后，会自动调用pacman -U去替换当前版本。然后aurman就可以正常使用了。

再回去看看，[aurman的作者已经不胜其扰了](https://github.com/polygamma/aurman/issues/178)，我真同情你...为什么你不多找点我这样的用户...
