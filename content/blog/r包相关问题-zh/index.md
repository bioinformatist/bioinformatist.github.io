+++
title = "R包安装和更新等相关问题"
date = 2018-07-03
draft = false

[taxonomies]
tags = ["R"]

[extra]
source = "my_website"
toc = true
+++
R的生态环境近几年越来越好，但是包管理系统始终...反正我自己是遇到好多坑。又没有Maven那种，很难受。就在这里记录一下大坑们和解决办法吧...

## 更新相关

### R更新之后出现：Error: package * was installed by an R version with different internals; it needs to be reinstalled for use with this R version
R大版本更新（3.4.3 -> 3.5）之后好多R包不能用了，报错信息如上。重装了一个，又会发现还有其他的包也有这种提示，子子孙孙无穷尽也...

解决方案：运行`update.packages(checkBuilt=TRUE, ask=FALSE)`将有必要更新的一股脑更新了去。

## 安装相关

### 使用`devtools::install_github()`报错：error setting certificate verify locations

详细如下：

```text
Installation failed: error setting certificate verify locations:
  CAfile: microsoft-r-cacert.pem
  CApath: none
```

解决方案：`install.packages(c("curl", "httr"))`，期间如果需要重启RSession会出提示。

### 使用`devtools::install_github()`报错BiocInstaller安装不上

详细如下：

```text
Downloading GitHub repo bioinformatist/LncPipeReporter@master
from URL https://api.github.com/repos/bioinformatist/LncPipeReporter/zipball/master
Installing LncPipeReporter
'BiocInstaller' must be installed to install Bioconductor packages.
Would you like to install it? This will source <https://bioconductor.org/biocLite.R>.

1: Yes
2: No
```

这个时候玩家一般会天真的选1，然后就发现：

```text
Installation failed: cannot open the connection to 'https://bioconductor.org/biocLite.R'
Warning message:
In file(filename, "r", encoding = encoding) :
  URL 'https://bioconductor.org/biocLite.R': status was 'Problem with the SSL CA cert (path? access rights?)'
```

先提供一个简单的解法，只要`source('http://bioconductor.org/biocLite.R')`之后重新运行`devtools::install_github()`安装包就无痛了。

注意到我只是**把https改成了http**，究竟影响了什么？

这就要提到一个历史遗留问题了：

devtools包历来都是用Linux自带的curl作为下载工具的，这点我有提过[issue](https://github.com/r-lib/devtools/issues/1641)，希望换成别的更高效的工具。但是从祖师爷Handley的回复看来，应该用curl也只是权宜之计，将来会有基于R的这样一个工具出来，那我就释怀了。

curl去访问下载https链接，是需要[证书](https://curl.haxx.se/docs/caextract.html)的！

我很奇怪，按说应该是有的呀，所以`curl-config --ca`了一下，发现在`/opt/anaconda/ssl/cacert.pem`。啊啊啊？

这个时候我想起来，服务器上装过Anaconda，之后为了方便大家使用conda等安装常用的生物信息分析工具，我就把`/opt/anaconda/bin`加入`PATH`了。然后其也带有一个低版本（真的是很旧）的curl，将操作系统本身的curl覆盖了。

> [!NOTE]
> Anaconda官方是非常不建议将`bin`目录加入`PATH`的，因为会有大量系统工具被覆盖（文件没有被替换，只是默认调用的都是Anaconda提供的版本）。Anaconda提供的这些binary文件也通常不会是最新的，因为它的哲学是“提供稳定可用的发行版”。但是这一“稳定”也许会和操作系统的使用相冲突。


意识到这个问题，我先短暂地将`/opt/anaconda/bin`从`PATH`中移除了。然后再去尝试安装，发现还是同样的报错。这个时候我就有一定程度的不适了。
我服务器上使用的R是MRO，MRO其实是提供了证书的（比如我的在`/usr/lib/R/lib/microsoft-r-cacert.pem`），我以为是MRO的bug，它调用curl的时候找不到这个证书，于是我天真地`Sys.setenv(CURL_CA_BUNDLE = "/usr/lib/R/lib/microsoft-r-cacert.pem")`指定了一下这个位置，结果发现还是不行。

这个时候我忽然想到，我的操作系统是Manjaro，更新太快导致curl和MRO内提供的证书版本不符。

看来还是用回Anaconda的旧版本curl+旧版本证书吧。

所以再把它写回`PATH`里面，然后`Sys.setenv(CURL_CA_BUNDLE = "/opt/anaconda/ssl/cacert.pem")`。终于能用了！

最后，如果是国内玩家，一直出现下述字样的话，还是改成http吧...

```text
Installation failed: cannot open the connection to 'https://bioconductor.org/biocLite.R'
Warning message:
In file(filename, "r", encoding = encoding) :
  URL 'https://bioconductor.org/biocLite.R': status was 'Timeout was reached'
```

### rJava各种不舒服

还是要先确认一下Java有妥善安装（`java --version`），然后`sudo R CMD javareconf`一下，记住里面的版本信息；

然后加载使用到rJava的包还是有可能报出以下异常的：`libjvm.so: cannot open shared object file: No such file or directory`。

这个时候想到可能是编译安装的时候，`ld`没做好，程序找不到动态链接库了。然后先`sudo find /usr -name libjvm.so`找一下，比如我这里是这样的结果：

```text
/usr/lib/jvm/java-8-openjdk/jre/lib/amd64/server/libjvm.so
```

那就把这个路径（不包括`.so`文件名），加入`/etc/ld.so.conf`里面去（当然有的用户的server上可能搞了n多个版本的java，那就要依靠版本号啊路径啊这些信息对应上了），然后`sudo /sbin/ldconfig`一下，解决~

### igraph报错：At optimal_modularity.c:85 : GLPK is not available, Unimplemented function call

先尝试`install.packages("Rglpk")`，然后发现又出现了`/bin/sh: line 0: cd: GLPK: No such file or directory`这种奇奇怪怪的错误，我用的是Arch Linux，就直接`aurman -S glpk`解决掉了。其他distribution应该也是对应补上相应工具就好。

### RStudio初始化一直崩溃：R encountered a fatal error.: Unexpected exception: Mutex creation failed

重启deamon进程也无效。仔细阅读了异常信息之后，发现还[是官方库later的锅](https://github.com/r-lib/later/issues/45)。在别的distribution中也许不会暴露出来，但是由于Arch是滚动更新的，emmmm...

尝试`install.packages('later')`重装一下，果然还是不行（废话当然不行了）：

```text
sh: line 1: 13260 Aborted                 (core dumped) '/usr/lib/R/bin/R' --no-save --slave 2>&1 < '/tmp/RtmpWwYeNo/file339a4cc056e4'
terminate called after throwing an instance of 'std::runtime_error'
  what():  Mutex creation failed
ERROR: loading failed
* removing ‘/home/ysun/R/x86_64-pc-linux-gnu-library/3.5/later’
* restoring previous ‘/home/ysun/R/x86_64-pc-linux-gnu-library/3.5/later’

The downloaded source packages are in
        ‘/tmp/Rtmpr0Mde8/downloaded_packages’
Warning message:
In install.packages("later") :
  installation of package ‘later’ had non-zero exit status
```

这个时候，官方跳出来补救了，在开发版本中更新了，那么`devtools::install_github("r-lib/later")`就修复了。

只能说用Arch的都是奉献家...

### install.packages()的时候报错：curl: (60) SSL certificate problem: certificate has expired

折腾了半天，最终发现不是本地的问题，直接`chooseCRANmirror()`换个镜像就好了。
