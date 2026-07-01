+++
title = "How to maintain an AUR package"
date = 2017-06-19
draft = false
aliases = ["/blog/maintaining-aur-packages/"]

[taxonomies]
tags = ["Linux"]

[extra]
source = "my_website"
+++
## Generating an SSH key pair

```bash
ssh-keygen -t ecdsa -C "$(whoami)@$(hostname)-$(date -I)"
```

During the process, it's highly recommended to specify a file name for this ssh key, 
for you may have more keys (for *GitHub*, etc) in the future. Also you should remember the passphrase.

## Authentication

Suppose my key pair is named as `aur_ecdsa` and `aur_ecdsa.pub`. 
Go to the [index page](https://aur.archlinux.org) of *AUR* and choose "My account", 
then enter the content of `aur_ecdsa.pub`.

Edit the configuration file: `vim ~/.ssh/config`, then add lines below. 
```text
Host aur.archlinux.org
  IdentityFile ~/.ssh/aur_ecdsa
  User aur
```

> [!NOTE]
> The value of the `User` should always be `aur` but not others. 


Save it!

## Modify the package

In order to maintaining the *Git* repository for an existing package, 
simply `git clone` the remote repository with the corresponding name:

```bash
git clone git+ssh://aur@aur.archlinux.org/package_name.git
```

Use `vim PKGBUILD` to modify the content of `PKGBUILD` file. 
Then try`makepkg --printsrcinfo > .SRCINFO` to create metadata file of the source. Finally, `stage -> commit -> push`:

```bash
git add PKGBUILD .SRCINFO
git commit -m "useful commit message"
git push origin master
```
