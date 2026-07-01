+++
title = "如何优雅地在Linux操作系统下用CPU挖矿"
date = 2018-05-31
draft = false

[taxonomies]
tags = ["区块链", "Linux"]

[extra]
source = "my_website"
+++
这是一篇“散文”，记录一下最近用CPU挖矿的曲折的折腾过程。

首先先来BB一下动机：手里是有一台PC的，没错，你没看错，一台普通台式机，其实无法通过这件事为我带来任何收益，但是出于对区块链的浓厚兴趣，我出手了。

我瞄准的币种是[Karbo](https://karbo.io/)（卡博币），那么为什么选这个呢，因为很多币（比如比特币）用CPU已然挖不动了。随着全网算力的提升，一些热门币种陆陆续续被大量计算出来，现如今计算的难度越来越大，对应的挖矿设备已经经历了CPU -> GPU -> 专用矿机这个历程。我不是专门的挖矿大户，顶多算是兴趣爱好者，当然能从中获利我也很开心。这个币现在很贱，之前更贱。坦白讲，最近几个月的一些涨幅才让我对其升值有了一定的信心。虚拟货币现在很多，这里面存在一个矛盾：如果玩的人少，市场不活跃，币就没有价值；如果玩的人太多，矿工会大量涌入，之后就重复了比特币的历程，又是一般玩家玩不起的了（不信可以去试试，个体户买一台矿机，挖几年能挖出一枚比特币哦）。我认为Karbo刚刚处在这样一个合适的阶段，所以选择了它。

挖矿，首先要有一个钱包。钱包很容易弄，懒得写了。

然后就是一个很有趣的问题，挖矿，其实本质上就是算hash值。那么这个计算的程序，也就是挖矿程序用什么好呢？我搜索了一圈，似乎[xmr-stak](https://github.com/fireice-uk/xmr-stak)还是比较科学的，支持CPU/A卡/N卡，支持Windows/Linux/macOS，支持的币种多，口碑也不错，算是挖矿程序里的佼佼者了。

很遗憾，截至我书写这篇日记的时候，软件的docker镜像并不可用，否则应该是很方便的。编译安装比较中规中矩，作者在文档里给出了常见的Linux distribution的对应命令，也不想多说了。重点谈一个坑：

国际惯例，挖矿工具的作者，是会从计算过程中“抽水”的。一般来讲，默认会抽2%，xmr-stak也是采用了这个值。这个2%，其实就是每计算100分钟，其中有两分钟是为作者的钱包计算/提交hash值，可以理解为是一种持续捐献、鼓励和支持作者继续开发的团结友爱的行为。作者在此处体现出了充分的人道主义精神，指出了源码中控制捐献比例的变量的位置，允许用户在编译程序之前自行修改：

[xmrstak/donate-level.hpp](https://github.com/fireice-uk/xmr-stak/blob/c0ab1734332d6472225d8ac7394f6fcba71aabc9/xmrstak/donate-level.hpp):
```cpp
constexpr double fDevDonationLevel = 2.0 / 100.0;
```

一个中规中矩的double类型常量，看起来没什么不妥。可是这个时候我的好奇心膨胀了，我很关心作者是如何实现这个捐献的逻辑的。另外也有一个疑问：对于完全不捐献的人，会怎样处理，真的颗粒无收吗？假如人人都在编译之前手动修改了源码中这个常量的值为0.0，那么程序岂不是白写了...

于是我搜索了整个代码仓库内含有`fDevDonationLevel`常量的代码，发现了一些端倪。先看这一部分：

[xmrstak/misc/executor.hpp](https://github.com/fireice-uk/xmr-stak/blob/26a5d65f12b2f19a0a3ece39a2bc64718796367b/xmrstak/misc/executor.hpp):
```cpp
// Dev donation time period in seconds. 100 minutes by default.
// We will divide up this period according to the config setting
constexpr static size_t iDevDonatePeriod = 100 * 60;

inline bool is_dev_time()
{
    //Add 2 seconds to compensate for connect
    constexpr size_t dev_portion = static_cast<size_t>(double(iDevDonatePeriod) * fDevDonationLevel + 2.);

    if(dev_portion < 12) //No point in bothering with less than 10s
        return false;

    return (get_timestamp() - dev_timestamp) % iDevDonatePeriod >= (iDevDonatePeriod - dev_portion);
};
```

`is_dev_time()`是一个返回值为bool类型的函数。作者将每100分钟看作一份，然后从中抽出以百分比计数的若干分钟来作为捐献。这里计算了一个`dev_portion`变量：`iDevDonatePeriod`常量将这一百分钟换算为秒，之后将其与`fDevDonationLevel`（用户决定的捐献比例）相乘，再加2（姑且可以认为这是为了方便计算，小数点是为了方便double类型相加）。然后我留意到下面有一个`if`分支，对于这个值小于12（每100分钟，也就是6000秒内，捐献给作者的计算时间低于10，因为之前加了2），函数将直接返回一个`false`。那么这个`false`的返回值又有什么用呢？我继续搜索了调用函数`is_dev_time()`的代码，发现了这样[一处](https://github.com/fireice-uk/xmr-stak/blob/c0ab1734332d6472225d8ac7394f6fcba71aabc9/xmrstak/misc/executor.cpp)，看完作者复杂的矿池切换逻辑，瞬间觉得后背一凉，想了下还是保留一点“良知”，适当调低了捐献比例（我是觉得2%有点高），编译，通过。

运行的时候，开始遇到了错误：

```text
MEMORY ALLOC FAILED: mmap failed
```

这个好说，只要`sudo sysctl -w vm.nr_hugepages=128`就解决了。

万事俱备，只欠开挖。开挖之前，是想把进程做点手脚的。理由很简单，被人发现在挖矿就不好了，就变成了挖社会主义墙脚，薅社会主义羊毛。想隐藏进程，首先就要深刻理解常见进程查看工具，比如`top`、`ps`和`lsof`这些的原理。这里要用到一个超强的系统挖掘工具，叫做`sysdig`，它不仅仅在监控细节上更“深入”，甚至还能对容器（比如docker）等进行监控。使用`sysdig`监控`ps`时可以看到`ps`的大概工作原理：

用一些底层的函数，比如`openat()`和`getdents()`去解析`/proc`目录的内容。比如在终端内运行`ls /proc`，可以看到如下输出：

![/proc目录内容](/legacy-assets/my-website/img/post_img/proc目录的内容.png)

这些数字就是对应每个进程的PID。每个进程在创建伊始，都会在`/proc`下生成这样的一个目录，里面保存了很多信息。如果你是一只生信狗，看这篇日记的时候就应该想到，当你提交了一条任务，跑了很久都没跑完，以至于你都不记得当初把它提交时用的命令行参数了，怎么办？别担心，只要`cat /proc/PID/cmdline`就可以看到万恶♂之源（误）：

![cmdline的内容](/legacy-assets/my-website/img/post_img/cmdline的内容.png)

看来这里52329这个进程，就是一个sftp服务。除此之外，还可以查看进程状态、一些统计信息等等。

然鹅，虽然知道了`ps`这些程序是这样的工作原理，但是其实`openat()`和`getdents()`也不是根源，它们也要调用更为底层的C标准库（`libc`），里面提供了两个函数：`opendir()`和`readdir()`。到目前为止，把进程藏起来大概可以有这样几个思路：

1. 对类似SELinux这样的子系统做手脚。但是并不推荐，首先不好改，其次，服务器管理员可能一早就睿智地把它关了。
2. 把`top`、`ps`和`lsof`这些程序的二进制可执行文件改了。这个切实可行，但是你就要去改源码。有几个类似的工具，就改几次，它更新，你再去改...再编译。有点蠢。
3. 改掉`libc`。既然大家都在用`libc`的`readdir()`，不如就一次性把这里改掉，让它查看不到某些进程在`/proc`里面的内容就好了。
4. 直接修改内核对诸如`getdents()`函数的调用方式。

这里利用一下Linux的预加载动态链接库的特性。捣鼓一个假的`readdir()`函数出来，加入操作系统的预加载列表内。之后再调用系统的`readdir()`函数的时候，由于函数签名相同，早就已经被覆盖掉，是一个假的`readdir()`了。逻辑也很简单，发现进程名称和设定的一致，就[跳过](https://github.com/gianlucaborello/libprocesshider/blob/890e3cf3f8cf3d2edf214c7ac1275b7c3ced15a9/processhider.c)。这里借用一下人家的轮子：

```shell
# 先克隆下来
git clone git@github.com:gianlucaborello/libprocesshider.git
cd libprocesshider
# 编译
make
# 把编译好的动态链接库放好
sudo mv libprocesshider.so /usr/local/lib/
# 加入预加载列表
# 这一行要用root账户添加
echo /usr/local/lib/libprocesshider.so >> /etc/ld.so.preload
```

自此，随便挖，别人根本不知道电费流向了哪里。

本来昨天写到这是结束了的，然鹅我意识到一个蛋疼的问题。老子自己都查不到这个进程的PID，kill不掉啊！
只能用睿智的sysdig去解决了！于是`aurman -S sysdig`尝试安装，发现：

```text
(1/2) Install DKMS modules
==> Unable to install module sysdig/0.21.0 for kernel 4.14.48-2-MANJARO: Missing kernel headers.
```

这个其实不影响...但是也确实可以`aurman -S linux414-headers`修复一下。
然后使用sysdig查看CPU占用最多的进程：

```shell
sudo sysdig -c topprocs_cpu
```

```text
CPU%                Process             PID
--------------------------------------------------------------------------------
100.03%             <NA>                10212
100.03%             <NA>                10197
100.03%             <NA>                10203
100.03%             <NA>                10204
100.03%             <NA>                10185
100.03%             <NA>                10189
100.03%             <NA>                10214
100.03%             <NA>                10196
100.03%             <NA>                10216
100.03%             <NA>                10206
```

这里是比较迂回了...因为PID确实被隐藏了...但是也不用担心，kill掉一个就全死了...大刀一挥死一片鬼子啊...
舒服了舒服了...
