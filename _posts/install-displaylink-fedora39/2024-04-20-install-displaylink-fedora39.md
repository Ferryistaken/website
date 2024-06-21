---
layout: post
title: "How to install the Displaylink drivers on Fedora 40"
date: "2024-04-20 11:59:13 +0200"
tags: [linux, os, hardware]
---

# Setup

First off, make sure to remove previously install `displaylink` and `evdi` packages.

```
sudo dnf remove displaylink 'evdi-*'
```

And install tools to build packages from source.

```
sudo dnf groupinstall 'Development Tools'
```

# Building evdi

Now build and install the evdi modules.

```
git clone https://github.com/DisplayLink/evdi
cd evdi
export CPLUS_INCLUDE_PATH="/usr/include/python3.12:$CPLUS_INCLUDE_PATH"
make
sudo make install
```

# Installing displaylink

Now, download the right displaylink RPM version from [the displaylink github](https://github.com/displaylink-rpm/displaylink-rpm/releases).

Both the built and src rpm should work, but this guide is going to use the `x86_64` version.

```
sudo dnf install '/path/to/rpm/fedora-40-displaylink-1.14.4-1.github_evdi.x86_64.rpm
```

Finally reboot. Now displaylink should work. This guide works for Fedora 38, 39, and possibly any new version, given that you pull the latest evdi version, and download the correct displaylink driver rpm.
