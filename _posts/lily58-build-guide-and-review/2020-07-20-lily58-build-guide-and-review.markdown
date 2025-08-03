---
layout: post
title: "⌨️ Lily58 Pro build log and review"
date: "2020-07-20 18:36:13 -0400"
tags: [hardware, keyboard, soldering]
description: This is a build log of the lily58 Pro split ergo keyboard
image: "/assets/posts/lily58-build-guide-and-review/final.jpg"
my_image_links:
- https://i.imgur.com/nv2TF8t.jpg
- https://i.imgur.com/LipQM3V.jpg
- https://i.imgur.com/FxuaMra.jpg
- https://i.imgur.com/CKK73Lg.jpg
- https://i.imgur.com/tFvaoSu.jpg
- https://i.imgur.com/QGPR1Iz.jpg
- https://i.imgur.com/KMLCmku.jpg
- https://i.imgur.com/oN4zikB.jpg
---


{% include lazyload.html image_src="/assets/posts/lily58-build-guide-and-review/final.jpg" image_alt="Lily58 Pro Final Product" image_title="Lily58 Pro" %}


## Before: The Anne Pro 2
My first "nice" keyboard was the Anne Pro 2. I think it's a very good keyboard. I used it on Mobile, Windows, and even Linux, and apart from some bluetooth problems [here and there](https://www.reddit.com/r/AnnePro/search?q=bluetooth%20issues&restrict_sr=1), it worked flawlessly. <br>
The software is also pretty good, the led customization is ok, but not great, and the macro system allows you to program your keyboard to do anything. The guys at obins even tried to mimic some QMK features, such as [tap](https://beta.docs.qmk.fm/using-qmk/advanced-keycodes/mod_tap).<br>
My only complaint is that on linux the keyboard goes in "sleep mode" every 15 minutes or so, and to wake it up I have to unplug it and plug it back in, which is a major hassle. A quick fix for this is leaving the software open on the "Layout" tab. <br>

## The Lily58 Pro
{% include lazyload.html image_src="https://i.imgur.com/LipQM3V.jpg" image_alt="Lily58 Pro Final Product" image_title="Lily58 Pro" %}
Just a month later buying the AP2 I decided that I was going to build my own keyboard. And it was going to be the [Lily58 Pro](https://github.com/kata0510/Lily58). <br>
I came across this keyboard while browsing through the [Awesome Split Keyboard List](https://github.com/diimdeep/awesome-split-keyboards) on github. <br>
I chose the lily58 pro over "normal" keyboards or other more popular splits like the [Corne](https://github.com/foostan/crkbd) because of this features:
* It's split
* It has led support (although I didn't end up using any LEDs)
* It supports [Hot swappable sockets](https://kono.store/blogs/keyboards/what-is-keyboard-hotswap). This ended up being more of a hassle than anything else.
* It has ***screens***
* It's vertically [ortholinear](https://blog.roastpotatoes.co/review/2015/09/20/ortholinear-experience-atomic/#what-is-an-ortholinear-keyboard)
* It runs QMK

After choosing the keyboard I searched for a kit online. I found one on [LittleKeyboards](https://www.littlekeyboards.com/) and decided to go with that.

##### Hotswap Sockets
I ordered the [pcb](https://www.littlekeyboards.com/collections/lily58/products/lily58-pro-pcb-kit), which came with [kailh hot swap sockets](https://www.kailhswitch.com/info/kailh-switch-pcb-hot-swapping-socket-33463528.html). <br>
Using hot swap sockets means that I can change the [switches](https://www.tomsguide.com/us/mechanical-keyboard-switches,review-4154.html) on the fly, without having to desolder anything. <br>
Normally using hotswap sockets would have no drawbacks, but my keyboard case had a loose fit, which would be fine if the switches were soldered to the board, but since mine are held "just" by the hotswap sockets, they feel a bit loose. Still, I don't regret at all going with hotswap sockets, but I think that from now on I won't be getting any more hotswap boards.

#### The switches
I didn't really have that much experience with switches since before buying this keyboard. I had only tried [Gateron Browns](https://mechanicalkeyboards.com/shop/index.php?l=product_detail&p=1271) and [Romer G Tactiles](https://www.logitechg.com/en-us/innovation/mechanical-switches.html). I really like the browns because even if they are very light, they have a pretty good tactile bump. I didn't like the Romer Gs that much because they feel like a mushy Blue switch. <br>
For this build I wanted something which was way heavier that browns, and that gave me a bigger tactile bump, while having a deeper sound. I went with the [NovelKeys x Kailh BOX Heavy Burnt Orange](https://novelkeys.xyz/products/novelkeys-x-kailh-box-heavy-switches?variant=3747939975208). <br>

{% include lazyload.html image_src="https://i.imgur.com/oN4zikB.jpg" image_alt="Lily58 Pro Final Product" image_title="Lily58 Pro" %}
*Burnt orange switches*

#### The Keycaps
When you think about building a keyboard, you'd probably think that the electronics or the switches are the most expensive part, because they are by far the most complex. So did I. I had no idea that I would be spending more than $20 for the keycaps. When you think about it, they are just colored pieces of plastic, how expensive could they be? ***Turns out that they are the most expensive part of the keyboard, and by far.*** <br>
 In my case the keycaps where more than 4x the cost of the second most expensive part of the build, which where the switches. And my keyboard doesn't even have that many keys. <br>
I decided to go for the [DSA "Beyond"](https://pimpmykeyboard.com/dsa-beyond-keyset-sublimated/) ortholinear keycap set, which has a simple typeface, and is pretty colorful. <br>
{% include lazyload.html image_src="https://i.imgur.com/tFvaoSu.jpg" image_alt="Lily58 Pro Final Product" image_title="Lily58 Pro" %}
{% include lazyload.html image_src="https://i.imgur.com/FxuaMra.jpg" image_alt="Lily58 Pro Final Product" image_title="Lily58 Pro" %}
*DSA Beyond Keycap set*

## Building the keyboard
Soldering and screwing everything together took me about 6 hours total, which I think is pretty good given the result, and that it was my first "big" project that involved soldering.
{% include lazyload.html image_src="https://i.imgur.com/4DN1X8J.mp4" image_alt="Build timelapse" image_title="Lily58 Pro Build Timelapse" %}
*Soldering Timelapse w/ dad*
This timelapse *only* shows soldering the [diodes](https://en.wikipedia.org/wiki/Diode) on 1 side.

## Final product

{% include image-gallery-links.html image_links=page.my_image_links %}


[jekyll-docs]: https://jekyllrb.com/docs/home
[jekyll-gh]:   https://github.com/jekyll/jekyll
[jekyll-talk]: https://talk.jekyllrb.com
