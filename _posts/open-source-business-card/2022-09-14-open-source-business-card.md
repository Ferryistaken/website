---
layout: post
title: "How to create your own \"smart\" business card for free"
date: 2022-09-14 20:54 +0000
tags: [webdev, blog, software]
---

# Introduction

In this post, I will show you how to achieve 90% of the effect of a service like [dotcards](https://dotcards.net/) for free.

## ShowCase

At the end of this guide, your new business card will look like this:

| The Website | The Native Contact Card |
| ----------- | ----------------------- |
| ![smart business card ss 1](/assets/posts/open-source-business-card/safari-ss.webp) | ![smart business card ss 2](/assets/posts/open-source-business-card/native-contact-ss-obfuscated.webp) |

## Tutorial

There are 3 parts to this project:

- A way to display your business card.
- A way to host the previously created business card on the internet.
- A way to share the business card in a *smooth*, catchy way.

And this is how we will hit every check on our list.

- We will use [enbizcard](https://enbizcard.vishnuraghav.com/) to create our business card.
- The hosting service is up to the reader's choice, I use [Netlify](https://www.netlify.com/).
- A basic way to share this is to use a QR code, but we can do better.

### Step 1: Fill out your details on enbizcard

The first step is to go on the [enbizcard editor](https://enbizcard.vishnuraghav.com/) and fill out your details. You can even add things like [your resume](https://contact.alessandroferrari.live#Resume).

You should also **add your business card to a public [Github](https://Github.com) repository**.

### Step 2: Create an account on Netlify and publish your business card to the internet

I have an [in depth guide on how to publish a website to Netlify]({% post_url host-a-blog-with-custom-domain-for-free/2020-09-21-host-a-blog-for-free %}#2-push-this-site-to-github).

Once your business card is published, you might choose to [change your domain](https://docs.netlify.com/domains-https/custom-domains/) as the default randomized domain isn't well suited for a sleek introduction.

### Step 3: Share the QR code with anyone

Enbizcard should have generated a custom QR code that points to your contact card. All you need to do now is tell people to scan the QR code, and they will see your business card on their phones.

This isn't as sleek as tapping a metal card however, so I added an optional fourth step to make the exchange of contact information *smoother*.

#### (Optional) Step 4: Get creative

There are multiple ways to catch the attention of the person that you're trying to network with, using a **metal card** is just one of them.

You could:

- 🖨️ 3D Print a QR code using a service like [qrcode2stl](https://printer.tools/qrcode2stl/).
- CNC a metal card with a qr code on top, or order one from [Rockdesign](https://www.rockdesign.com/business-card-templates/simple-black-metal-business-cards-sophia-do).
- Buy an NFC card and write your website link onto it.

Bottom line is: now you have a link pointing to your personal smart business card--find an innovative way to share that link, and it will be easier for people to remember you because of your creativity.

Since the business card is free and open source, you could even edit the HTML to expand it, adding new sections and functionality.

You can check out my business card [here](https://contact.alessandroferrari.live)
