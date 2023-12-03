---
layout: post
title: "Create a minimize menu in bspwm"
date: "2021-02-21 17:54:59 -0500"
tags: [linux, ricing, os, unix, software]
description: Writeup to create a way to minimize windows in bspwm
---

# Introduction

In this guide I will show you how to create a basic minimize menu in bspwm.

This is my bspwmrc:

```bash
#! /bin/sh

#### MONITORS ####

bspc monitor -d 1 2 3 4 5 6 7 8 9 10 11

#### UTILITIES AUTOSTART ####

# keybinds
killall -q sxhkd; sxhkd &

# polybar
if ! [ "$DESKTOP_SESSION" = "plasma-bspwm" ];
then
	bash $HOME/.config/polybar/launchBSPWM.sh &
fi

# picom
if ! [ "$DESKTOP_SESSION" = "plasma-bspwm" ];
then
	killall -q picom; picom --config $HOME/.config/picom/picom.conf &
fi

# music visualizer
if ! [ "$DESKTOP_SESSION" = "plasma-bspwm" ];
then
	killall -q glava; glava --desktop --force-mod=$(shuf -n 1 ~/.config/glava/modes.txt)&
fi


# automatic screen lock
if ! [ "$DESKTOP_SESSION" = "plasma-bspwm" ];
then
	pkill -f "watch -n 120 /home/ferry/Documents/scripts/lockScreenInactive.sh"; watch -n 120 $HOME/Documents/scripts/lockScreenInactive.sh&
fi

# this makes them not steal focus
bspc config ignore_ewmh_focus true

#### COMMANDS ####

bspc config border_width         3
bspc config window_gap           15
bspc config top_padding          0
bspc config pointer_motion_interval 7

bspc config split_ratio          0.5
bspc config borderless_monocle   true
bspc config gapless_monocle      true

# focus on hover
bspc config focus_follows_pointer true


#### Window Rules ####

bspc rule -a Pavucontrol state=floating
bspc rule -a Enpass state=floating
bspc rule -a Alacritty:floatterm state=floating
bspc rule -a Pcmanfm state=floating
bspc rule -a File-roller state=floating

bspc rule -a galculator state=floating

# Desktop 6
bspc rule -a java-lang-Thread desktop=6 focus=off follow=off

# Desktop 8
bspc rule -a Discord desktop=8 focus=off follow=off

# Desktop 9
bspc rule -a Spotify desktop=9 focus=off follow=off

# Desktop 10
bspc rule -a Transmission-gtk desktop=10 focus=off follow=off
bspc rule -a Mailspring follow=off focus=off desktop=10
bspc rule -a Enpass follow=off focus=off desktop=10

# For a floating terminal
bspc rule -a Alacritty:coolEqualizer state=floating
bspc rule -a Alacritty:coolEqualizer --flag sticky=on
bspc rule -a Alacritty:coolEqualizer focus=off


bspc rule -a mplayer2 state=floating
bspc rule -a jetbrains-toolbox state=floating
bspc rule -a Kupfer.py focus=on
bspc rule -a Screenkey manage=off
bspc rule -a Emacs state=tiled


# this is for java applications
wmname LG3D

# source the colors.
. "${HOME}/.cache/wal/colors.sh"

# Set the border colors.
bspc config normal_border_color "$color1"
bspc config active_border_color "$color2"
bspc config focused_border_color "$color15"
bspc config presel_feedback_color "$color1"

#### APP AUTOSTART ####
# mail and return focus
mailspring&
thinkorswim&
enpass&
sleep 10 && bspc config ignore_ewmh_focus false
```

As you can see, other than starting some programs and choosing their desktop, I didn't change a lot. This is because the best way to customize bspwm is to use its socket architecture, and calling `bspc` interactively.

The only feature that I missed in bspwm was a way to minimize my windows, as I don't want to keep an "everything" desktop to throw all my other windows to.

# Solution: create your own minimize menu

To overcome this problem and to facilitate my workflow, I decided to implement the "Minimize" feature myself, since `bspwm` already has a "hide window" feature.  

## Feature List:
This is what features I needed:
1. The minimized windows shouldn't be shown on the screen (pretty obvious).
2. I should be able to choose which window to show again at any time.
3. Everything should be cross-desktop, so that if I minimize something in desktop 1, I should be able to maximize it in desktop 6.

### How I did it
First of all, I needed a way to minimize (or "hide") windows. Fortunately bspwm has a simple way to do this: I just enable the `hidden` flag for the specific window that I wanted to hide. This can be done by running `bspc node $1 --flag hidden=on` while having a window focused. I also wanted to enable the `sticky` flag, so that the window would follow me between desktops, and I could maximize it at any time. Since i already used `sxhkd` for hotkeys, implementing this commands was as easy as creating a new entry in my `sxhkdrc`.
```bash
super + d
	bspc node $1 --flag sticky=on; bspc node $1 --flag hidden=on
```
I chose `d` as the modifier to hide a window because it's easy to reach and `h`(for hide) or `m`(for minimize) were already taken.  

The minimize part was done, now I only needed a way to maximize the windows to bring them back.  

Finding a way to maximize windows was a bit harder, since I had to find a way to query all hidden windows and choose one to maximize. In order to make it interactive I chose to use [rofi](https://github.com/davatorium/rofi) as a menu to choose which window to maximize. Since I wasn't good enough to self code a bash script to do this, I asked for help on [bspwm's reddit](https://reddit.com/r/bspwm), and [/u/torreemanuele6](https://www.reddit.com/user/torreemanuele6) helped me write [this script](https://github.com/Ferryistaken/myScripts/blob/master/showHidden.sh), which by default uses `rofi` in `dmenu` mode, but can be adjusted to use any dmenu clone.  

I just added this script as a bind in my `sxhkdrc` like this:
```bash
super + shift + d
	$HOME/.scripts/showHidden.sh
```
And now I have a fully functioning minimize/maximize menu in bspwm!

#### Polybar integration
In order to see at all times how many windows I had open I designed a small polybar module, which I called `hiddenWindows`. This module prints the number of currently hidden windows. Here it is:
```bash
[module/hiddenWindows]
type = custom/script
exec = bspc query -N -n .hidden.window | wc -l
;format-prefix = 🔽
format-prefix-foreground = ${colors.color4}
interval = 2
```
