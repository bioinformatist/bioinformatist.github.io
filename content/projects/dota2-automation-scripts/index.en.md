+++
title = "Dota2 Automation Scripts"
date = 2016-05-21
description = "Two Dota2 automation scripts from 2016: lumbering challenge auto-clicking and Source 2 auto-spectating."
weight = 3
template = "info-page.html"

[taxonomies]
tags = ["Dota2", "Python", "Shell", "script archive"]

[extra]
source = "py3_scripts + bash_shell_scripts + img"
source_files = [
    "py3_scripts:dota2_lumbering_challenge.py",
    "bash_shell_scripts:auto_spectate.sh",
    "img:chopping.gif",
    "img:chopping_result.png",
]
+++

These are two Dota2 automation scripts from 2016, preserved as they were rather than presented as maintained tools.

## Contents

- [Dota2 lumbering challenge auto-clicker](https://github.com/bioinformatist/bioinformatist.github.io/blob/main/static/archives/legacy-dota2-automation/dota2_lumbering_challenge.py): a Windows / Python script that listens for `Ctrl+C` and randomly clicks inside a fixed screen area for `60` seconds.
- [Dota2 Source 2 auto-spectating script](https://github.com/bioinformatist/bioinformatist.github.io/blob/main/static/archives/legacy-dota2-automation/auto_spectate.sh): a Linux / X11 script that uses `xdotool` to activate the Dota2 window and periodically click the spectating entry point.

## Lumbering Challenge

![Auto-clicking demo](chopping.gif)

The idea was simple: trigger from the keyboard, then simulate mouse clicks in the game area.

![Lumbering result](chopping_result.png)
