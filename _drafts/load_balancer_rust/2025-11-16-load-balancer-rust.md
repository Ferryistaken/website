---
layout: post
title: "Writing a Load Balancer in Rust"
date: "2025-11-16 10:50:10 +0600"
tags: [linux, os, hardware, project]
---

# Introduction

After seeing [this post](https://bogdanthegeek.github.io/blog/projects/vapeserver/) on X, I was really motivated to replicate and expand on this project by hosting a load balancer on a disposable vape and having it route traffic to multiple http servers. Two issues are:

- We all know that *If you wish to make an apple pie from scratch you must first invent the universe*.
- I don't vape, so the hardware is limited to my friend's scraps.


<style>
.embed-center { 
display: flex;
         justify-content: center; 
}

.embed-center .twitter-tweet,
.embed-center iframe.twitter-tweet,
.embed-center iframe[src*="twitter.com"] {
  display: block !important;
  margin-left: auto !important;
  margin-right: auto !important;
  max-width: 700px !important; /* responsive */
  width: 90% !important;
transform: scale(0.9);        /* scale to 90% size */
           transform-origin: top center;
}
</style>

<div class="embed-center">
  <blockquote class="twitter-tweet">
  <blockquote class="twitter-tweet"><p lang="en" dir="ltr">It&#39;s possible to run a web server on a disposable vape...<a href="https://t.co/j2DRWVK2EP">https://t.co/j2DRWVK2EP</a><br><br>It may seem crazy, but some disposable vapes feature a 24MHz Puya PY32 Arm Cortex-M0+ microcontroller with 3KB SRAM and 24KB flash. <br><br>This has been leveraged to run a lightweight web server over… <a href="https://t.co/7Esnd1JdNV">pic.twitter.com/7Esnd1JdNV</a></p>&mdash; CNX Software (@cnxsoft) <a href="https://twitter.com/cnxsoft/status/1967891989288063031?ref_src=twsrc%5Etfw">September 16, 2025</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
  </blockquote>
</div>
<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

Because of the two reasons above, the first step of this project was designing a non-locking load balancer in Rust using the `hyper` crate that could be compiled to an esp32 target.

# Load Balancer
## Design

## Performance

# Code

Code available [on github](https://github.com/Ferryistaken/lb).
