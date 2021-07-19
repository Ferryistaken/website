---
layout: post
title: "🦠Modeling the Covid-19 Pandemic using R and Jupyter"
tags: [data, coding, ai]
date: 2021-07-19 14:54 +0000
---

# Data science for epidemic investigation and modeling

I recently grew an interest in data science and artificial intelligence, and *we are still in a pandemic* (although hopefully at the end, fingers crossed for the [Delta Variant](https://www.yalemedicine.org/news/5-things-to-know-delta-variant-covid)), so I chose to test out some models to work with data from Covid-19.

## Tools used

Here are the tools that I used:

- **R:** R is a programming language used for statistical computing and graphics. The industry standard in the [FLOSS](https://www.gnu.org/philosophy/floss-and-foss.en.html) scene.
- **covid19.analytics:** [This](https://cran.r-project.org/web/packages/covid19.analytics/index.html) is an R package to pull data from the [John Hopkins Center for System Science and Engineering (CSSE)](https://github.com/CSSEGISandData/COVID-19). This source publishes data with a delay of **just one day**. Although they changed the structure of the data [a few times](https://github.com/CSSEGISandData/COVID-19/issues/3464), it's very usable and mostly reliable.
- **dygraphs:** [This](https://dygraphs.com/) is another R package that is worth mentioning if you are doing anything in Jupyter (or even in RStudio). Instead of outputting graphs as images, **it generates html and javascript graphs.**
- **Jupyterlab:** JupyterLab is a "web-based interactive development environment for Jupyter notebooks, code, and data."[^1]

## My setup

By using those tools I can come up with a setup like this:

[![Jupyterlab Setup](/assets/posts/model-covid19-epidemic/jupyterlab-setup.png)](/assets/posts/model-covid19-epidemic/jupyterlab-setup.png)
> I generally use the light theme for visibility of the graphs, here I used the dark theme because it looks better in screenshots

Dynamic graphs with `dygraph`:
[![DyGraph Showcase](/assets/posts/model-covid19-epidemic/dyraph-showcase.webm)](/assets/posts/model-covid19-epidemic/dyraph-showcase.webm)

[![Dygraph showcase](/assets/posts/model-covid19-epidemic/dygraph-showcase.webm)](/assets/posts/model-covid19-epidemic/dygraph-showcase.webm) <br>

[^1]: From their website: https://jupyter.org/