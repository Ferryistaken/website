---
layout: work_detail
title: Biocentis
location: Milan, Italy
role: Software Engineer - Bioinformatics
duration: May 2023 - August 2023
logo: /assets/img/work_experiences/biocentis.png
---

At Biocentis, an **agrotech** firm specializing in **vector pest control** through **genetic engineering**, I worked on a **GPU Agent-Based Model** which simulated everything from the genotype to the swarm flight patterns of the _Drosophila Suzukii_.

During my time, I brought the Agent Based Simulator's execution time **from 8 hours** in the Python simulator **to just over 3 minutes** with the C++ algorithm.

I did this in many ways:
- The biggest change was going from a Python program that ran on the CPU to a C++ Real-Time GPU-native program (FLAMEGPU RTC).
- Implementing **chunking** in data transfer from the GPU's memory to the system's memory also brought simulation time down, because data transfer and simulation could happen at the same time.
- Developing a resource-saving data structure to store simulation state information to minimize the amount of data transfered (and saved) between CPU and GPU.
- Employing pre-processing strategies to minimize the amount of trigonometric calculations done during simulation times.

I also worked on a web-based visualizer for the simulation data in plotly (which for testing purposes was centered on Rome, my hometown), shown below:

{% include auto-image-gallery.html folder="/assets/img/work_experiences/biocentis-images/" %}
