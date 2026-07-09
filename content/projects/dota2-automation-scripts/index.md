+++
title = "Dota2 自动化脚本"
date = 2016-05-21
description = "2016 年留下的两个 Dota2 自动化小脚本：伐木挑战自动点击和 Source 2 自动观战。"
weight = 3
template = "info-page.html"

[taxonomies]
tags = ["Dota2", "Python", "Shell", "脚本归档"]

[extra]
source = "py3_scripts + bash_shell_scripts + img"
source_files = [
    "py3_scripts:dota2_lumbering_challenge.py",
    "bash_shell_scripts:auto_spectate.sh",
    "img:chopping.gif",
    "img:chopping_result.png",
]
+++

这是 2016 年留下的两个 Dota2 自动化小脚本，按当时状态保留，不作为当前维护的工具。

## 项目内容

- [Dota2 伐木挑战自动点击脚本](https://github.com/bioinformatist/bioinformatist.github.io/blob/main/static/archives/legacy-dota2-automation/dota2_lumbering_challenge.py)：Windows / Python 脚本，监听 `Ctrl+C` 后在固定屏幕区域随机点击 `60` 秒。
- [Dota2 Source 2 自动观战脚本](https://github.com/bioinformatist/bioinformatist.github.io/blob/main/static/archives/legacy-dota2-automation/auto_spectate.sh)：Linux / X11 脚本，通过 `xdotool` 激活 Dota2 窗口并定时点击观战入口。

## 伐木挑战

![自动砍树演示](chopping.gif)

核心思路很直接：键盘触发之后，在游戏区域内模拟鼠标点击。

![砍树结果](chopping_result.png)
