+++
title = "如何高效批量下载一整个BioProject/Study的数据？"
date = 2018-12-21
draft = false

[taxonomies]
tags = ["Linux", "测序"]

[extra]
source = "my_website"
+++
以*DRA005150*这个accession为例：

先按[ENA下载说明](https://ena-docs.readthedocs.io/en/latest/retrieval/file-download.html)打开ENA Browser，search这个字段（右上角），在出现的结果右侧选*Study*，点进去，下方*Download*字样这行最右侧有一个*TEXT*，将此文件下载后上传到服务器某目录下，然后执行：

```shell
# 这里下载到的文件名为PRJDB5190.txt
# aria2是多线程下载工具，会自动使用适量CPU核心占满带宽或IO
# cut为了从数据metadata切割出URL
# tr将其分割为按行的记录
# sed为每行URL添加上FTP协议（否则aria2不识别）
# tail去掉header
# aria2c接受一个文件作为批量下载列表，这里使用标准输入
cut -f10 PRJDB5190.txt | tr ';' '\n' | sed -e 's#^#ftp://#' | tail -n +2 | aria2c -i -
```
