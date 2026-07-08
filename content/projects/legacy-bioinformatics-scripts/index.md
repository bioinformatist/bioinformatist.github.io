+++
title = "早期生信脚本归档"
description = "早年生物信息分析工作中积累的 Python / Perl 脚本归档，按历史状态保留。"
weight = 2
template = "info-page.html"

[taxonomies]
tags = ["生物信息", "脚本归档"]
+++

这些脚本是我早年进行生物信息分析时积累的工作片段，按历史状态归档。

它们反映的是当时的分析场景、数据格式和工程习惯，不代表当前推荐的实现方式；这里也不把它们包装成仍在维护的软件项目。

## 源码归档

- [Python scripts](https://github.com/bioinformatist/bioinformatist.github.io/tree/main/static/archives/legacy-bioinformatics-scripts/python)
    - [PacBio 处理工具](https://github.com/bioinformatist/bioinformatist.github.io/tree/main/static/archives/legacy-bioinformatics-scripts/python/pb_tools)：围绕 PacBio / SMRT 数据整理、读取和 XML 文件处理的早期脚本。
    - [GTF 注释统计](https://github.com/bioinformatist/bioinformatist.github.io/tree/main/static/archives/legacy-bioinformatics-scripts/python/GTF_statistics)
    - [BLAST 表格 span 过滤](https://github.com/bioinformatist/bioinformatist.github.io/blob/main/static/archives/legacy-bioinformatics-scripts/python/blastTableSubjectSpanFilter.py)：根据 subject 坐标跨度过滤 BLAST tabular 输出。
    - [杂项脚本](https://github.com/bioinformatist/bioinformatist.github.io/tree/main/static/archives/legacy-bioinformatics-scripts/python)：包括代码收集、爬虫 demo 和 Dota2 自动砍树小脚本等。
- [Perl scripts](https://github.com/bioinformatist/bioinformatist.github.io/tree/main/static/archives/legacy-bioinformatics-scripts/perl)
    - [SAM / mpileup 过滤脚本](https://github.com/bioinformatist/bioinformatist.github.io/tree/main/static/archives/legacy-bioinformatics-scripts/perl)：包含 mpileup、SAM 和 PacBio reads 相关处理。
    - [PacBio reads 提取与 adapter 处理](https://github.com/bioinformatist/bioinformatist.github.io/tree/main/static/archives/legacy-bioinformatics-scripts/perl)：包括 CCS、subreads、特定 reads 和 adapter 相关脚本。
    - [duplexes 相关脚本](https://github.com/bioinformatist/bioinformatist.github.io/tree/main/static/archives/legacy-bioinformatics-scripts/perl)：用于早期小 RNA / reads 配对分析流程。
