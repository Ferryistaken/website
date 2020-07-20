---
layout: post
title: Set Up A Mobile Webdev Environment On An Ipad For Free
date: “2020-07-18 12:22:34 -0400”
tags: [blog, mobile, webdev, git, ide, coding, ipad]
description: In this article I will tell you how to set up a fully working IDE for web development on any mobile device for free
---
This article is about how you can turn your boring IPad(or any mobile device), into an *amazing*, fully functional, [git](https://git-scm.com/) intergrated, IDE for web development and light coding, ***completely for free.***

# Why?
Sometimes you have(or want) to work in places where space is extremely limited, or maybe you just don't want to carry an heavy laptop around all the time. <br>
>*My personal reason is that I bought a massive gaming laptop and I really don't want to carry 5+ pounds of plastic and silicon everywhere I go. Kids, for the love of god, buy small and light laptops.*

# Requirements
1. **A mobile device** <br>
This guide is targeted for IOs but the steps should basically be the same for android. I am using and recommend an IPad because of the bigger screen, but it really doesn't change anything. <br>
2. **A bluetooth Keyboard** <br>
This technically isn't *needed*, but realistically you aren't going to be able to do any work with the virtual keyboard covering up most of the screen. I am using the [Anne Pro 2](https://annepro2.com/products/kailh-box-switchobins-anne-pro-2-60-nkro-bluetooth-4-0-type-c-rgb-mechanical-gaming-keyboard?variant=28863929057357) but any bluetooth keyboard will do.

## The IDE
1. Option 1: [Repl.it](https://repl.it/) <br>
If you have an internet connection, the best IDE has to be repl. It supports basically any language and, even though it's cloud based, it's quite fast. It has syntax highlighting, git integration, code execution, and you can even see changes to the source code in real time(just like google docs). If you choose this option you will also be able to execute your code inside of the IDE, which is pretty useful. This all sounds great, and it is, but the main reason why you would want to use an IPad to code is to able to use it virtually anywhere, often in situations where laptops would occupy too much space, for example in planes where you *don't* have an internet connection. Because of this repl doesn't really fit in a truly mobile setup, because the absence of the internet would stop you from writing any code, *and we don't want that* <br>
2. Option 2: [Working Copy](https://workingcopyapp.com/) <br>
If you don't want to depend on having an internet connection, Working Copy is the best IDE, because it has a free version, it has seamless git integration, syntax highlighting and most importantly, you can continue to edit your files without a connection. <br>
If you want to push the changes to the remote branch you will need the paid version to Working Copy, *and I promised a **free** way of coding on an ipad, but then again, in the last post I promised only rust widgets, what did you expect?*. Because of this in order to push the changes I just go on the github page and push them "manually". <br>
The main flaw with Working Copy is that you cannot execute any code, so we need to use another app to do that. The best one that I found so far is [LibTerm](https://libterm.app/), which can be used to execute pyton code, and even *compile c code*. It also gives you a "shell", but of course it's limited to the application container. <br>
To actually deploy the changes that you made you have to set up some sort of [CI/CD](https://en.wikipedia.org/wiki/CI/CD) system, so that as soon as you push you code your website updates. <br>

## My configuration
![my setup](/assets/posts/set-up-a-mobile-webdev-envirnomet-on-an-ipad-for-free/setup.jpg)
### Hardware
As I said before I am using a 2017 IPad, paired with the [Anne Pro 2](https://annepro2.com/products/kailh-box-switchobins-anne-pro-2-60-nkro-bluetooth-4-0-type-c-rgb-mechanical-gaming-keyboard?variant=28863929057357). A lot of people have reported issues with the bluetooth but I found that if the device that it's paired with is only a couple of inches away(like in our case) it works perfectly. I have the one with brown switches, because I think that they are the best "mainstream" ones. The fact that the keyboard is a 60% really helps with the portability of the whole setup. <br>

### Software
I use Working Copy as my IDE because of the perfect git integration(it is more of a git client with an IDE built around of it than an IDE with some git features). The syntax highilighting works very well and it supports a lot of file formats. <br>
In order to deploy my articles as soon as I push them I set up [Netlify](https://www.netlify.com/) so that it builds my [Jekyll](https://jekyllrb.com/) site every time that the master branch is updated, which basically means that as soon as I change my code, the site gets updated in a matter of seconds, so that I can publish new articles even without the use of a pc. <br>
The main flaw of this setup is that I cannot push entire directories, so the folder structure that I usually keep of */_posts/post-name/post.markdown* gets messed up, which is a major inconvenience, because I then have to create new directories for any new post that I created without my pc, as soon as I get back to my pc.
<br>

This is what I have been using for a few months now, ***and what this article is being written on***. Of course, this doesn't replace a *real* computer, but it surely helps with mobile development. I find this setup extremely useful on planes or in trips where I would bring my IPad(to watch movies) anyways.


[jekyll-docs]: https://jekyllrb.com/docs/home
[jekyll-gh]:   https://github.com/jekyll/jekyll
[jekyll-talk]: https://talk.jekyllrb.com
