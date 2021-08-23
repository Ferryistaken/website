---
layout: post
title: "Host a Blog/Website with custom domain for free"
date: "2020-09-21 12:39:13 +0200"
tags: [blog, unix, webdev, ide, coding, git]
description: How to host a website, with a custom domain completely for free
---
# Host any website with a *custom* domain completely for free
Today I'm going to tell you how I found and exploited a loophole to host [my blog]({{ site.url }}) completely for free.  
*Yes, this blog, which you are browsing in this very moment.* Take a look at your browser's top bar, that spanking new domain was obtained without spending 1$ dollar.  
On top of that, the hosting is handled by a third party, so I don't have to worry about servers which are open to the internet, and, *of course*, **completely for free**.  
If that wasn't enough, I don't even have to worry about deploys, since **every time I push my site to github, it gets automatically updated and published to the internet**, _almost_ in real time.  
I chose to host a blog on it, but you could **host any html page** on it, and here is how:

# General Steps:
+ Build a website
    + The first thing you need to host a website, _is a website_. You could code it completely yourself, or use a [SSG](https://www.netguru.com/blog/what-are-static-site-generators), like [Jekyll](https://jekyllrb.com/) - _which is what I use._  
    + _A static site generator turns some type of markup language(like markdown) into valid html pages_
    Any valid html will do
+ Put the website on github(or any other major VCS platform). This part is crucial: **your website needs to be open source**, or else you will not be able to publish your website.
    + I put mine on github since I'm a normie(and it's supported very well on our deployment platform)
+ Set up a [Netlify](https://netlify.com/) account, and connect it to your Github(or other vcs) repository containing your website.
    + You will need to setup build settings in order to publish your website on every git push.
+ Now you have 2 choices:
    + **1** You already have a registered domain
        + If you already have a registered domain just setup your netlify deploy to use that as a domain
    + **2** You don't already have a registered domain
        + Go on [Freenom](https://www.freenom.com/en/index.html?lang=en) and search for a domain that you like, then "buy" it, and register that domain on netlify

# Walkthrough
### Now I'm going to describe how to create, host and deploy your own blog for free

## Prerequisites
1. Know a bit of markdown (it really isn't that hard, and it can always be useful)
2. Know how to use github (on a basic level)

## Tools needed
1. Install [Jekyll](https://jekyllrb.com/), you could use any other SSG, in this guide I'm going to use jekyll
2. Install [Git](https://gitforwindows.org/), if you are following this guide you should already be familiar with it
3. Your favorite text editor. <s>Use <a href="https://github.com/vim/vim">vim</a> or get out</s> I'm gonna start allowing the use of open source IDEs with vim plugins, so if you use VScodium with a vim plugin, I'm cool with that, _but you're on damn thin ice_.

## 1. Create your website
<img src="https://jekyllrb.com/img/logo-2x.png" alt="jekyll logo" width="200" style="text-align: center">  You could create your own site from scratch using html, but it honestly isn't a viable choice if you are looking to create a blog, because it's going to get harder the more content you have.  
In this tutorial we are going to use Jekyll, a static site generator.
So if you don't already have it, go ahead and [download Jekyll](https://jekyllrb.com/docs/installation/).  
Follow the [Quick Start Guide](https://jekyllrb.com/docs/) to create your first blog, for now just do a bare post to test your blog. In short once you finished installing jekyll run this in a command prompt:
```bash
$ bundle install jekyll # installing jekyll in your machine
$ jekyll new my-site && cd my-site # create new jekyll project
```

Once you've done with creating your placeholder post, run
```bash
$ bundle exec jekyll serve --host 0.0.0.0
```
In the same directory of the blog. This way you will have hot reload for each change, and by adding `--host 0.0.0.0` you can test your site even on other devices on the same network.


> If you actually want to use this blog you might want to take a look at [Jekyll Themes](https://jekyllrb.com/docs/themes/) instead of going for the default one.

## 2. Push this site to Github
Go to [Github](https://github.com) and create an account/log in, then from [your dashboard](https://github.com) click on `New` to create a new repo. Go back to your blog's directory and type this in a command line:
```bash
$ git init # initializing project folder
$ git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git # change UPPERCASE with your own!
$ git add -A && git commit -m "Initialize" && git push -u origin master # push code to github
```

## 3. Create a Netlify account 
<img src="https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fcommons%2Fthumb%2Fb%2Fb8%2FNetlify_logo.svg%2F220px-Netlify_logo.svg.png&f=1&nofb=1" alt="netlify logo" style="text-align: center">
Go to [netlify.com](https://netlify.com) and, if you don't already have an account, register, then connect netlify to your Github/Gitlab/BitBucker account.
After you do this go to [netlify](https://netlify.com) dashboard, and following this step.

1. Click `new site from git`, then choose `Github` or whatever else you chose as your VCS.
2. Choose the repo which contains your newly created blog.
3. Netlify is smart enough to configure everything automatically, so we don't really need to configure the build settings.
4. Click `Deploy site`

Your site should now be live, but the domain is a random mess of words, _and we don't like that_.

## 4. Get your free domain
Go to [Freenom](https://www.freenom.com/en/index.html?lang=en) and find a domain that you like. Technically you could get more than 1, but please don't do that as that site can only exist if the userbase is able to regulate themselves. As you can probably see I chose `ferry.ml`(unless I changed it since writing this post).

## 5. Set up your domain with Netlify
Now all you need to do is go on your project dashboard on [Netlify](https://app.netlify.com), click on `Domain Settings`, then `Add Custom Domain`, and follow the simple process to register your newly acquired domain as a valid one for netlify.

# Caveats
- You probably won't find any `.com`, `.org`, `.xyz`, or any other "popular" domain.
- You can have it for free for "only" one year, then you will have to renew your subscription.
- You have to pay if you want to see analytics on netlify


[jekyll-docs]: https://jekyllrb.com/docs/home
[jekyll-gh]:   https://github.com/jekyll/jekyll
[jekyll-talk]: https://talk.k.com
