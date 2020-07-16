---
layout: post
title: "My custom polybar widgets"
date: "2020-07-16 15:43:51 -0400"
tags: [blog, ricing, unix, rust, coding]
description: Most of the polybar modules that I use on my personal setup are written in perfect, memory safe, fast, Rust. Here is how!
---

In order to practice [Rust](https://www.rust-lang.org/) development, and to [rice](https://www.reddit.com/r/unixporn/wiki/themeing/dictionary#wiki_rice) my [desktop](https://imgur.com/gallery/Xp52JgU) to infinity, I decided to write some custom [polybar](https://github.com/polybar/polybar) modules in Rust.

# Context:
Polybar is one of the most popular(and expandable) status bars for unix desktops. It is often used with a window manager, because desktop environments tend to have their own status bar. *See: [difference between WM and DE](https://askubuntu.com/questions/18078/what-is-the-difference-between-a-desktop-environment-and-a-window-manager).* <br>
Because it's so popular you'd think that there are plenty of modules(a module is basically a widget, for example the clock or the current playing song) freely available. Well, you'd be wrong. I managed to find surprisingly few modules on the internet, and I think that it is because making one is super simple. <br>
Here is my current bar(you have to click on it and ***ZOOM*** if you want to see anything, having a 21:9 monitor is *hard* ok): [![my bar](/assets/posts/my-custom-polybar-widgets/fullBar.png)](/assets/posts/my-custom-polybar-widgets/fullBar.png)

# What does it take to make a Polybar module?
Short answer: any program that outputs text to [stdout](https://en.wikipedia.org/wiki/Standard_streams#Standard_output_(stdout)). Or, in simpler terms: any program that would normally output text to the terminal.
Polybar simply takes that text and formats it nicely, then it displays it in your bar. Because of this, you could write a polybar module that is very specific to your configuration. For instance, I have a module which tells me when my kitchen door is open(since I *always* leave it open). I achieved this with a WIFI enabled MCU. <br>
With a [simple bash script](https://github.com/Ferryistaken/myScripts/blob/master/portaBagno.sh) I managed to get this string to pop up in my bar whenever the door is open for more than 1 minute: <br> [![doorWidget](/assets/posts/my-custom-polybar-widgets/doorWidget.png)](/assets/posts/my-custom-polybar-widgets/doorWidget.png) <br>
***NOTE:***
*The white lines are an artifact of my screenshotting software, [scrot](https://github.com/dreamer/scrot) I don't actually see them in the bar.* <br>
When I close the door it simply goes away. <br>
Another cool one that I wrote uses a [python script](https://github.com/Ferryistaken/myScripts/blob/master/batPrice.py) to display the current value of the [BAT](https://basicattentiontoken.org/) token, a relatively new cryptocurrency, so that when it will crash, and I'll lose all my money, I can instantly cry. Here is what this one looks like: <br> [![bat price script](/assets/posts/my-custom-polybar-widgets/batWidget.png)](/assets/posts/my-custom-polybar-widgets/batWidget.png) <br>
Although this scripts are extremely useful, a skilled programmer could spot a major flaw in them in a split second: they aren't written in pure, sacred Rust.

# My custom polybar modules, written in Rust
Now, here is some eye candy to recover from those cursed, interpreted, slow scripts.
1. [mocPolyWidget](https://github.com/Ferryistaken/mocPolyWidgetRust) - Music on Console Polybar Widget <br>
This is a [~102LoC](https://github.com/Ferryistaken/mocPolyWidgetRust/blob/master/src/main.rs) program which gives me information about the currently playing song in [MOC](https://github.com/jonsafari/mocp), a terminal-based music player, which I used to use before fully switching to spotify(more on that on a future post). The code isn't that bad considering that it's pure String manipulation in rust, which is comparable to having to paint a portrait using a toothbrush and a bit of toothpaste. You can find the installation instructions and more pictures on the [github page](https://github.com/Ferryistaken/mocPolyWidgetRust). <br>
Here is what it looks like: <br>
[![moc widget](/assets/posts/my-custom-polybar-widgets/mocWidget.jpg)](/assets/posts/my-custom-polybar-widgets/mocWidget.jpg) <br>
As you can see it displays some useful info, such as the name of the artis, the name of the track, if it's playing or not, and even has a little graphic which tells me where I am in the song <br>
2. [nmPolyWidget](https://github.com/Ferryistaken/nmPolyWidget) - Network Manager Polybar Widget <br>
This is a [~140LoC](https://github.com/Ferryistaken/nmPolyWidget/blob/master/src/main.rs) program which tells me the network status(using [NetworkManager](https://wiki.archlinux.org/index.php/NetworkManager)), and my internal IP Address. <br>
The [code](https://github.com/Ferryistaken/nmPolyWidget/blob/master/src/main.rs) is *waaaay* cleaner than the other program, I *even* have a custom IP address struct. <br>
Here is what this one looks like: <br>
[![nm widget](/assets/posts/my-custom-polybar-widgets/nmWidget.jpg)](/assets/posts/my-custom-polybar-widgets/nmWidget.jpg) <br>
Here it's telling me the name of the WiFi network that I'm connected to (ORBI80), the signal strenght, and my internal IP address <br>

# Other modules which are not written in rust, but still useful
I know that I promised you only perfect, memory safe, rust code, but you might want to take a look at this other modules aswell.
1. Uptime module <br>
This module tells me for how much time my pc has been on without a restart, which is useful for when I get angry at my pc for using 2 gbs of ram more than usual, but then I find out that it's been on for 3 days in a row. <br>
Here is what it looks like: <br>
[![uptime widget](/assets/posts/my-custom-polybar-widgets/uptimeWidget.png)](/assets/posts/my-custom-polybar-widgets/uptimeWidget.png) <br>
Getting this up and running is *extremely* simple, all you have to do is put this lines of code inside of your polybar config file: <br>
```
[module/uptime]
type = custom/script
exec = awk '{printf("%dd : %02dh : %02dm\n",($1/60/60/24),($1/60/60%24),($1/60%60),($1%60))}' /proc/uptime
format-underline = ${colors.alert}
interval = 60
```
This will update the time every minute, and print it in a fancy format <br>
2. Current Kernel Version <br>
This is completely useless, and is purely for looks, because *even on archlinux*, I change kernel version usually once every 2 weeks, but even if it changed daily, knowing your kernel version itself isn't that useful. <br>
*But hey, it looks cool.* <br>
[![kernel widget](/assets/posts/my-custom-polybar-widgets/kernelWidget.png)](/assets/posts/my-custom-polybar-widgets/kernelWidget.png) <br>
To achieve it put this in you config:
```
[module/kernel]
type = custom/script
exec = "uname -r"
format-underline = #c47d83
interval = 18000
```
3. Ram used <br>
This displays the memory used in megabytes, out of all the ram on your system, and then also the percentage. <br>
Here it is: <br>
[![ram widget](/assets/posts/my-custom-polybar-widgets/ramWidget.png)](/assets/posts/my-custom-polybar-widgets/ramWidget.png) <br>
I don't even remember writing this, it's very ugly, please don't bully me:
```
[module/myMemory]
type = custom/script
exec = "vmstat -s | sed -n '2p' | sed 's/[[:space:]]//g' | sed 's/K*//' | sed -E 's/(Kusedmemory)+$//' | cut -c 1-4"
format-underline = #4bffdc
interval = 2
```

##### Hope you liked the modules, feel free to use them, they are [free software](https://en.wikipedia.org/wiki/The_Free_Software_Definition).


[jekyll-docs]: https://jekyllrb.com/docs/home
[jekyll-gh]:   https://github.com/jekyll/jekyll
[jekyll-talk]: https://talk.jekyllrb.com
