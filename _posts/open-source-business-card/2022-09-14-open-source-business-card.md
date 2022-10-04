---
layout: post
title: "📞 How to create your own \"smart\" business card (mostly) for free"
date: 2022-09-14 20:54 +0000
tags: [webdev, blog, software]
---

👋 The other day I had a captivating convesation with another Tech student about work ethic, our plans for the future, and [The 4 Hour Work Week](https://fourhourworkweek.com/) by Tim Ferriss.

⏰ 30 Minutes into our conversation, we both had to run to our classes, and before we left he pulled out a **metal card** from his wallet, tapped it against my phone, and a prompt appeared asking me to save his contact.

I kept thinking about it for the **rest of the day**.

- It was a *swift* and *smooth* action.
- I had never seen a digital or smart business card before
- 🍒 It was the cherry on top of a wonderful conversation with someone with a similar mindset to myself.

Even if you think that the "smart" "digital" business card is a gimmick, that gimmick will make people think about you for the rest of the day. It's a good conversation started, and a great hook for people to reach out to you after you talk.

### Ideal Email
---

**From**: \<Person that you want to network with\>:
<br>
<br>
*Hey \<Insert your name\>,*
<br>
<br>
*It was wonderful to talk to you this Wednesday, I was very impressed with your smart business card. I had never seen that before and I find it an excellent way to modernize the boring paper business card.*
<br>
<br>
*Hope to hear from you soon!*

---

At the end of that day, I recognized the power of the **catchyness** of that gadget, and researched how to build my own.

That same day, I also chose that I wouldn't spend upwards of $70 on a metal card with an NFC chip on, and would instead find a way to get the same effect for free.

My smart card needed to be:

- 🆓 Free, preferably *open source.*
- Modular.
- 📈 Expandable.



In this post, I will show you how to achieve 90% of the effect of a service like [dotcards](https://dotcards.net/) for free.

## ShowCase

At the end of this guide, your new business card will look like this:

| The Website | The Native Contact Card |
| ----------- | ----------------------- |
| ![smart busienss card ss 1](/assets/posts/open-source-business-card/safari-ss.jpg) | ![smart busienss card ss 2](/assets/posts/open-source-business-card/native-contact-ss-obfuscated.jpg) |

## Tutorial

There are 3 parts to this project:

- A way to display your business card.
- 🌐 A way to host the previously created business card on the internet.
- A way to share the business card in a *smooth*, catchy way.

And this is how we will hit every check on our list.

- 🪪 We will use [enbizcard](https://enbizcard.vishnuraghav.com/) to create our business card.
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