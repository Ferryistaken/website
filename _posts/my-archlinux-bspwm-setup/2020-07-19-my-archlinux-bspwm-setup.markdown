---
layout: post
title: "My Archlinux-Bspwm setup"
date: "2020-07-19 19:51:55 -0400"
tags: [linux, ricing, unix, os]
description: This is a description of my current arch linux setup that I've been using everyday for the past 6 months
---
About a year ago, when I still didn't even know about the existence of [Rust](https://www.rust-lang.org/) (I know, *dark times*), I was browsing reddit, when I laid my eyes on a comment under a screenshot of an [OpenBSD](https://www.openbsd.org/) desktop. <br>
The content of that comment isn't that important, all I remember is that the commenter was saying that [OP](https://www.lifewire.com/what-does-o-p-stand-for-2483372) should post his screenshot on another [subreddit](https://www.reddit.com/r/help/comments/37shum/what_is_a_subreddit/): [r/unixporn](https://www.reddit.com/r/unixporn/). <br>
I was intrigued by the name, so I decided to take a look at it. ***My life hasn't been the same since***. <br>
> *If you have no idea what that sub is about, click on [this link](https://www.reddit.com/r/unixporn/top/?t=all), trust me, you will not regret it.*   <br>

[Unixporn](https://reddit.com/r/unixporn), *as the name suggests*, is a subreddit about the customization, and ricing of \*nix operating systems. *(Linux, Unix, Bsd, MacOS, and everything [Unix-like](https://en.wikipedia.org/wiki/Unix-like))*. <br>
Some of them are [awesome](https://www.reddit.com/r/unixporn/comments/hpakeu/awesome_afternoon_in_a_perfect_world/), *pun intended*, some of them will burn your eyes, [*but are different, so they still get 3k+ upvotes*](https://www.reddit.com/r/unixporn/comments/cskb33/oc_i_wrote_a_script_that_periodically_sets_your/). <br>
Of course, the customization [doesn't stop on the desktop](https://www.reddit.com/r/unixporn/comments/hgba3b/i3_razer_blade_stealth_highlighting_shortcuts_and/), and sometimes people share [entirely new tools that they coded themselves](https://www.reddit.com/r/unixporn/comments/ha9q9q/oc_audio_visualizer_that_pulses_the_background_of/). <br> <br>
[![unixporn](/assets/posts/my-archlinux-bspwm-setup/unixporn.png)](/assets/posts/my-archlinux-bspwm-setup/unixporn.png) <br> <br>
After spending all night watching other people's rices, I decided to nuke my *lame* [Manjaro-KDE](https://manjaro.org/download/#kde-plasma) setup, and install *glorious **[ArchLinux](https://www.archlinux.org/)***. I started by installing [I3WM](https://i3wm.org/), like some *normie*. After about a month of being an [i3 scrub](https://www.youtube.com/watch?v=B5r47Q1cn_o), I decided to switch to [bspwm](https://github.com/baskerville/bspwm), because it's based on a [binary tree](https://en.wikipedia.org/wiki/Binary_tree)(which makes it more rational then i3, which is based on a normal tree), and because the keybinds are completely handled by another program, [sxhkd](https://github.com/baskerville/sxhkd), which I was already using because it's *waaaay* better than the default i3 keybinds. <br>
I also made a [post](https://www.reddit.com/r/unixporn/comments/hrb43z/bspwm_pywal_pywal_apps_that_support_custom_css/) on unixporn myself, *but I didn't get reddit famous.*

# My current setup
[![screenshot1](/assets/posts/my-archlinux-bspwm-setup/screenshot1.png)](/assets/posts/my-archlinux-bspwm-setup/screenshot1.png)

[![screenshot2](/assets/posts/my-archlinux-bspwm-setup/screenshot2.png)](/assets/posts/my-archlinux-bspwm-setup/screenshot2.png)

[![screenshot3](/assets/posts/my-archlinux-bspwm-setup/screenshot3.png)](/assets/posts/my-archlinux-bspwm-setup/screenshot3.png)

[![screenshot4](/assets/posts/my-archlinux-bspwm-setup/screenshot4.png)](/assets/posts/my-archlinux-bspwm-setup/screenshot4.png)
<br> <br>
After looking at these pristine screenshots you might be wondering how fun I am at parties, *but don't worry*, keep reading and your desktop will soon look just like mine, so you will be able to answer that question by yourself. <br>

## The operating system
The first thing of is the [OS](https://en.wikipedia.org/wiki/Operating_system), as you could probably tell by those [neofetch](https://github.com/dylanaraps/neofetch) screenshots(and by the title), I am using [Arch Linux](https://www.archlinux.org/). I chose this distro because it is a [rolling release](https://en.wikipedia.org/wiki/Rolling_release), and it's extremely lightweight, without being too hard to setup, *I am looking at you [Gentoo](https://duckduckgo.com/?q=gentoo&t=brave&ia=web&iai=r1-0&page=1&adx=sltb&sexp=%7B%22v7exp%22%3A%22a%22%2C%22sltexp%22%3A%22b%22%7D)*. <br>
Of course this tools will work on any unix-like OS.

## The window manager
I use bspwm, a [tiling window manager](https://en.wikipedia.org/wiki/Tiling_window_manager), which means that I don't have to drag and resize windows around, they just place themselves in an organized grid. Here is what I mean *(sorry for the bad quality, as I said in a [previous article](https://www.ferry.ml/my-custom-polybar-widgets/#context) having a 21:9 3440x1440 monitor is hard)*: <br>
[![window manager showcase](/assets/posts/my-archlinux-bspwm-setup/tilingShowCase.gif)](/assets/posts/my-archlinux-bspwm-setup/tilingShowCase.gif) <br>

I use sxhkd to manage keybinds. It works very well and it's highly configurable. It was created by the same creator of bspwm, [baskerville](https://github.com/baskerville), and he recommends to use it with bspwm. <br>

## The bar
I use [polybar](https://polybar.github.io/) as my bar, it's highly configurable and very lightweight. I have a whole [article](https://www.ferry.ml/my-custom-polybar-widgets/) on some of my *custom* polybar widgets. <br>
[![myBar](/assets/posts/my-archlinux-bspwm-setup/bar1.png)](/assets/posts/my-archlinux-bspwm-setup/bar1.png)
[![myBar](/assets/posts/my-archlinux-bspwm-setup/bar2.png)](/assets/posts/my-archlinux-bspwm-setup/bar2.png)
<br>
This is what my bar looks like right now. I chose to break it in half because it was too big, *did I mention that it's hard to have a big monitor?*.

## Colorschemes and Pywal
As you may have noticed from the screenshots, my colorschemes are always based on the colors of my wallpaper. I achieved this by using [pywal](https://github.com/dylanaraps/pywal), a tool written in python to generate colorschemes based on a given image. Pywal changes your [Xresources](https://wiki.archlinux.org/index.php/X_resources), which means that every application that uses Xresources(Like your [terminal](https://en.wikipedia.org/wiki/Terminal_emulator)), gets updated automatically. <br>
In order to change the colorscheme of other applications you have to follow the instructions for the particular application in the [pywal wiki](https://github.com/dylanaraps/pywal/wiki). <br>
On top of that people wrote some external tools to convert pywal generated colorschemes to colorschemes that are compatible with apps such as [Discord](https://discord.com/new), and [Spotify](https://www.spotify.com/us/). <br>
In order to turn my desktop into a rice field, I couldn't stop to generated colorschemes for bspwm, polybar, and every single terminal application, I *had to* go beyond that. <br>

### Betterdiscord and Spicetify
After spending a couple more days restlessly scrolling through r/unixporn I came across this [post](https://www.reddit.com/r/unixporn/comments/fkoi8q/i3gaps_using_pywal_to_change_discord_spotify/). I had finally found the final tools that would make everything on my system color coordinated. And it's all *open source*. <br>
I instantly download [Betterdiscord](https://betterdiscord.net/home/) and [Spicetify](https://github.com/khanhas/spicetify-cli), which are needed in order to use custom css for Discord and Spotify. I then used [pywal-discord](https://github.com/FilipLitwora/pywal-discord) to generate colorschemes for discord, and [this spicetify theme](https://github.com/Ferryistaken/dots/tree/master/spicetify/Themes/wal) for spotify. <br>
The setup was tedious and the tools are not very well documented but I finally figured it out, thus making every application that I use on a daily basis use the same colorscheme. <br>
Here is my Spotify: <br>
[![spicetify](/assets/posts/my-archlinux-bspwm-setup/spicetify.png)](/assets/posts/my-archlinux-bspwm-setup/spicetify.png)
And here is my Discord: <br>
[![discord](/assets/posts/my-archlinux-bspwm-setup/discord.png)](/assets/posts/my-archlinux-bspwm-setup/discord.png)
As you can see they use the same base colors.

## My Terminal
I use [termite](https://github.com/thestinger/termite/) as my terminal because it has extremely good [unicode](https://en.wikipedia.org/wiki/Unicode) support and it's very lightweight. I would really like to switch to [alacritty](https://github.com/alacritty/alacritty) because it's written in ***pure rust***, but it doesn't support unicode nearly as well, and as much as I like Rust, functionality comes before pristine code and memory safe applications. <br>
It also supports tabs and a ["visual mode"](https://wiki.archlinux.org/index.php/Termite#Usage), which are cool features to have. <br>
### Shell
I use [ZSh](https://www.zsh.org/) as my shell, because of the awesome plugins, such as [zsh-syntax-highlighting](https://github.com/zsh-users/zsh-syntax-highlighting) and [autosuggestions](https://github.com/zsh-users/zsh-autosuggestions). <br>
I also have this: <br>
```bash
# vi mode
bindkey -v
export KEYTIMEOUT=1

# Use vim keys in tab complete menu:
bindkey -M menuselect 'h' vi-backward-char
bindkey -M menuselect 'k' vi-up-line-or-history
bindkey -M menuselect 'l' vi-forward-char
bindkey -M menuselect 'j' vi-down-line-or-history
bindkey -v '^?' backward-delete-char
```
In my config, to have vim keybinds in my shell too, such as `Shift + i` to go to the start of the line, `dd` to delete line, etc. <br>
I also put `pfetch` and `fortune` in my zsh, so that I get cool graphics every time that I launch a new terminal it looks like this: <br>
[![terminalsetup](/assets/posts/my-archlinux-bspwm-setup/terminal.png)](/assets/posts/my-archlinux-bspwm-setup/terminal.png) <br>


## My text editor
As you may have grasped by my obsession to have vim keybinds everywhere that I can, I am a [Vim](https://www.vim.org/) user(actually [NeoVim](https://neovim.io/), but they are basically the same thing). Simply because, if you are willing to learn the keybinds, it's the **best text editor**, without exceptions. I tried [Emacs](https://www.gnu.org/software/emacs/), but it's too slow and bloated. When I need to edit some text, I don't want to wait a minute for my text editor to start up. And if I really need to spin up a full IDE, I'll just start VSCode <br>
I will be making another article only on my NeoVim setup, because it really revolutionized the way that I code. <br>
Here is what it looks like now: <br>
[![vimsetup](/assets/posts/my-archlinux-bspwm-setup/vimSetup.png)](/assets/posts/my-archlinux-bspwm-setup/vimSetup.png) <br>

## My dotfiles
[This](https://github.com/Ferryistaken/dots) are my dotfiles, I don't update them very often, but when I update them it's because I found something new that needs to be backed up. Feel free to use them, but don't try to sell them as yours!

[jekyll-docs]: https://jekyllrb.com/docs/home
[jekyll-gh]:   https://github.com/jekyll/jekyll
[jekyll-talk]: https://talk.jekyllrb.com
