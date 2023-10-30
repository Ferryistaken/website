---
layout: post
title: "🧬How to Quality Control RNA from ArchR objects"
date: "2023-09-25 10:20:17 +0200"
tags: [bioinformatics, single-cell, scRNA, scATAC, archr, seurat, genomics]
description: Guide on how to do RNA quality control an ArchR object.
toc: true
---

# Introduction

When doing single cell multiome analysis (ATAC + RNA) in R using packages like [Seurat](https://satijalab.org/seurat/) or [ArchR](https://www.archrproject.com/), it is useful to load both the scRNA-seq and scATAC-seq datasets in the same object under the same framework.

This however brings some problems, as ArchR doesn't have built-in functions or tutorials on how to filter out bad RNA reads from the ArchR object, and vice versa from the Seurat object.

This is an easy problem to fix, however I haven't found any easy resources online that explain the very simple process, and chose to write my own.

# Loading the data

For this tutorial, I'm going to use ArchR as the main framework. I first load in the data like this:

```r
inputFiles <- "data/<your-file-name>"

ArrowFiles <- createArrowFiles(
  inputFiles = inputFiles,
  minTSS = 0,
  minFrags = 500, 
  addTileMat = TRUE,
  addGeneScoreMat = TRUE
)

proj <- ArchRProject(ArrowFiles)

seRNA <- import10xFeatureMatrix(
  input = c("data/pbmc_unsorted_10k_filtered_feature_bc_matrix.h5"),
  names = c("PBMC_10k")
)

proj <- addGeneExpressionMatrix(input = proj, seRNA = seRNA, force = TRUE)

# Filter out NA Reads
proj <- proj[!is.na(proj$Gex_nGenes) & 
               !is.na(proj$Gex_MitoRatio)]
```

## Quality Control

Then, I start my quality control pipeline. In this case, I want to set the *minTSS* to 12, *minFrags* to 1200, *minFeatures* to 600, *maxFeatures* to 4000 and *maxMT* to 0.019.


```r
minTSS <- 12
minFrags <- 1200

minFeatures <- 600
maxFeatures <- 4000
maxMT <- 0.019
```

## ATAC Quality Control

In order to filter out ATAC cells that don't pass these thresholds, I can index into the ArchR object like so:

```r
proj <- proj[proj$TSSEnrichment > minTSS & proj$nFrags > minFrags]
```

## RNA Quality Control

I can then repeat the same process for the RNA data.

```r
proj <- proj[proj$Gex_nGenes > minFeatures
             & proj$Gex_nGenes < maxFeatures
             & proj$Gex_MitoRatio < maxMT]
```

# Conclusions

This might be obvious for a lot of people, and it is after getting some experience with bioinformatics. I just wanted to make this short post to make the knowledge more accessible, as I don't think that anyone should lose 30 minutes trying to figure this out, like I did.

[jekyll-docs]: https://jekyllrb.com/docs/home
[jekyll-gh]: https://github.com/jekyll/jekyll
[jekyll-talk]: https://talk.jekyllrb.com
