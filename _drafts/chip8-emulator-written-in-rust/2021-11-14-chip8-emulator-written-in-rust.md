---
layout: post
title: "🎮 Building a CHIP-8 Emulator in Rust"
tags: [coding, rust, software, opensource]
date: 2021-11-14 18:53 -0400
usemathjax: true
---

# 🚧 WIP 🚧 Come back soon.

In this brief writeup, I'll show you how I wrote my first emulator--an emulator to the CHIP-8 programming language--in Rust.

# Table of Contents
1. [Introduction]({% post_url chip8-emulator-written-in-rust/2021-11-14-chip8-emulator-written-in-rust %}#Introduction)
1. [What are you talking about?]({% post_url chip8-emulator-written-in-rust/2021-11-14-chip8-emulator-written-in-rust %}#what-are-you-talking-about)
	- [My Setup]({% post_url model-covid19-epidemic/2021-07-19-model-covid19-epidemic %}#my-setup)
	- [The editor]({% post_url model-covid19-epidemic/2021-07-19-model-covid19-epidemic %}#the-editor)
	- [Dygraph]({% post_url model-covid19-epidemic/2021-07-19-model-covid19-epidemic %}#dynamic-graphs-with-dygraph)
1. [Data]({% post_url model-covid19-epidemic/2021-07-19-model-covid19-epidemic %}#data)
	- [Data Manipulation]({% post_url model-covid19-epidemic/2021-07-19-model-covid19-epidemic %}#data-manipulation)
1. [Analysis]({% post_url model-covid19-epidemic/2021-07-19-model-covid19-epidemic %}#analysis)
	- [Used Models]({% post_url model-covid19-epidemic/2021-07-19-model-covid19-epidemic %}#used-models)
		- [SIR Model]({% post_url model-covid19-epidemic/2021-07-19-model-covid19-epidemic %}#sir-model)
		- [SEIR Model]({% post_url model-covid19-epidemic/2021-07-19-model-covid19-epidemic %}#seir-model)

# Introduction

This post isn't supposed to be a step-to-step guide, it may be treated as such, but you will probably find some better guides on the internet. I wrote this emulator a while ago and am just now(~1.5 years later) writing this post, so don't lynch me for my errors--or better yet; fix them on [github](https://github.com/Ferryistaken/CHIP8-rs/issues).

## What are you talking about?
