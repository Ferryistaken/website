---
layout: post
title: "🧠Using Neural Networks to Predict Stock Prices📈"
date: "2021-07-15 13:53:13 +0200"
tags: [ai, finance, coding, stocks]
description: My ideals
---

##### - 🔨 Code (my mirror): [github](https://github.com/Ferryistaken/Capstone-mirror)
##### - 🐳 Docker: [dockerhub](https://hub.docker.com/r/u3ebmgske4udqutxkw8rkn/capstone-project)

# Using machine learning to predict stock market prices

I recently took part in the Columbia [summer course](https://precollege.sps.columbia.edu/highschool/online/courses/3-week/big-data-machine-learning-and-their-real-world-applications): "Big Data, Machine Learning, and their real world applications", in which I learned about various machine learning models and how to apply them to analyze data and solve real life problems.

As our final project, me and other 3 people from my course chose to create various machine learning models in order to try and predict the direction and price of stocks on a day-to-day basis. Here's how it went:

_**Side note:** if you'd just like to test the model without the description and explanation, go here: [instructions]({{ site.baseurl }}{% link _posts/machine-learning-stock-market/2021-07-15-machine-learning-stock-market.md %}#how-to-use-the-model)_

> First rule of Quantitative Finance:
> "Everybody is a genius in a bull market."

## The project

### Description (AKA Copying the github README):

<div align="center">
	<img alt="GitHub Workflow Status" src="https://img.shields.io/github/workflow/status/RB3572/Capstone/lint-project">
	<img alt="Lines of code" src="https://img.shields.io/tokei/lines/github/RB3572/Capstone">
	<img alt="GitHub" src="https://img.shields.io/github/license/RB3572/Capstone">
	<img alt="GitHub repo file count" src="https://img.shields.io/github/directory-file-count/RB3572/Capstone">
	<img alt="GitHub code size in bytes" src="https://img.shields.io/github/languages/code-size/RB3572/Capstone">
	<img alt="GitHub repo size" src="https://img.shields.io/github/repo-size/RB3572/Capstone">
	<img alt="GitHub last commit" src="https://img.shields.io/github/last-commit/RB3572/Capstone">
	<img alt="GitHub contributors" src="https://img.shields.io/github/contributors/RB3572/Capstone">
	<img alt="Docker Automated build" src="https://img.shields.io/docker/automated/u3ebmgske4udqutxkw8rkn/capstone-project">
	<img alt="Docker Pulls" src="https://img.shields.io/docker/pulls/u3ebmgske4udqutxkw8rkn/capstone-project">
	<img alt="Docker Image Size (latest by date)" src="https://img.shields.io/docker/image-size/u3ebmgske4udqutxkw8rkn/capstone-project">
</div>

#### Machine Learning Stock Predictions
Rakshit Kaushik, Alessandro Ferrari, Sergio Papa Estefano, Rishi Bhargava

##### Data
Past stock data will be obtained using the quantmod package. Quantmod stands for quantitative financial modeling framework, and it is used to "specify, build, trade, and analyse quantitative financial trading strategies."[(cran.r-project.org)](https://cran.r-project.org/web/packages/quantmod/quantmod.pdf) Opening, high, low, closing, and the adjusted closing prices of a stock can be obtained using the ``` getSymbols() ``` function. It provides data for every day from January 3, 2007 to the current date. 

[![AMZN Price Graph](https://i.ibb.co/DfHkKGf/ef221867-8547-4e7b-8a9c-8455011de2bb.png)](https://i.ibb.co/DfHkKGf/ef221867-8547-4e7b-8a9c-8455011de2bb.png)

##### Importance of data: 
- Stock Market Data(opening prices, closing prices, high/low prices) => technology: train an AI model using historical data to predict stock prices => if successful, we can deploy this application as a private option for our group to use when investing => less helpful (comparing with the next example)
- Stock Market Data(opening prices, closing prices, high/low prices) => technology: train an AI model using historical data to predict stock prices => if successful, we can deploy this application as an open source package for individuals to use when investing => more helpful (community impact)
#### Benchmark 
Existing projects include:
- [MCMC Simulation/MCTS](https://github.com/yiqiao-yin/Introduction-to-Machine-Learning-Big-Data-and-Application/blob/main/scripts/R/2021Summer/day_3.R)
	- MCMC randomly calculates paths that stock price could follow
	- MCTS uses past data to tune the parameters used in the MCMC simulation
		- parameters: mean, standard deviation
	- Simulated data will accurately describe historical data => can be used to make predictions
- [Sentiment Analysis of Newspapers](https://github.com/dineshdaultani/StockPredictions)
	- Uses past stock data and newspaper articles
	- Sentiment of articles analyzed using Natural Language Toolkit package (NLTK)
	- Stock prices and sentiment used as explanatory variables for neural network, stock prediction is the response variable
- [Brownian Motion](https://github.com/yiqiao-yin/Introduction-to-Machine-Learning-Big-Data-and-Application/blob/main/scripts/R/2021Summer/day_4.R)
	- Uses the knowledge that plots of simulated particle movement match plots of stock returns (gif credit: [yiqiao-yin](https://github.com/yiqiao-yin/Introduction-to-Machine-Learning-Big-Data-and-Application/blob/main/docs/big-data-machine-learning/notes/Day3.md))
	- Parameters for brownian motion can be tuned using past data to predict future stock trends

[![Brownian Motion](https://raw.githubusercontent.com/yiqiao-yin/Introduction-to-Machine-Learning-Big-Data-and-Application/main/pics/brownian-motion.gif)](https://raw.githubusercontent.com/yiqiao-yin/Introduction-to-Machine-Learning-Big-Data-and-Application/main/pics/brownian-motion.gif)

[![Stock Market Returns](https://raw.githubusercontent.com/yiqiao-yin/Introduction-to-Machine-Learning-Big-Data-and-Application/main/pics/cross-section-stock-returns.gif)](https://raw.githubusercontent.com/yiqiao-yin/Introduction-to-Machine-Learning-Big-Data-and-Application/main/pics/cross-section-stock-returns.gif)

### Proposed Model/Algorithm: 
1) **Linear Regression**: y=⍺+βx+ε | x = time, y = stock price, ⍺ = y intercept, ε = error. Linear regression is used to find a linear relationship between two variables, or in our case, time and stock price. While linear regression can reveal a trend in stock data, it's not optimal for predicting stocks, as any sudden change in price can cause a user to lose money.

[![Linear Regression](https://i.ibb.co/XjS5Cqp/91cf0ec1-0a0e-4c28-9dff-ad554150d080.png)](https://raw.githubusercontent.com/yiqiao-yin/Introduction-to-Machine-Learning-Big-Data-and-Application/main/pics/cross-section-stock-returns.gif)


2) **Recurrent Neural Network using stock returns**: RNNs are designed for sequence prediction problems, making them ideal for predicting stock data. The neural network will use stock returns as both the explanatory and response variables. Another option for data would be to use the closing price. A recurrent neural network could learn from past stock prices and attempt to predict the future. But stock price trends vary from year to year, so training an AI to predict next year's stock closing prices using last year's closing price data is un-ideal. Stock returns don't have as much variation and are better suited for making predictions with an RNN. 


[![Price Return AAPL](https://i.ibb.co/fVWkHCZ/aapl-returns.png)](https://i.ibb.co/fVWkHCZ/aapl-returns.png)

	
3) **Recurrent Neural Network using golden crosses**: A golden cross occurs when the plotted line of a stock's long term average crosses the line of its short term average. If the short term average starts below the long term average and crosses above it, the pattern is called a golden cross. Otherwise, it's called a death cross. A golden cross is a signifier of a bull market. Our model attempts to predict the stock price outcome after a golden cross. Instead of stock returns, our explanatory variable is closing price data as well as the difference between short and long term averages. The response variable is closing prices after the golden cross.  When the two lines cross, the difference of their values is 0 which was represented in our data. 

[![Golden Cross](https://i.ibb.co/rGDzzCW/Screen-Shot-2021-07-05-at-2-06-25-PM.png)](https://i.ibb.co/rGDzzCW/Screen-Shot-2021-07-05-at-2-06-25-PM.png)
 
 4) **Recurrent Neural Network using closing prices**: Mentioned above is how stock price data isn't great for making a accurate predictions with an RNN. To test this theory, we decided to try using closing prices for both explanatory and response variables in our RNN. 

[![Real Price Prediction](https://i.ibb.co/qY0B1kP/aapl-price.png)](https://i.ibb.co/qY0B1kP/aapl-price.png)
	
### How to use the model
	
To run our webapp, simply install a container engine for your operating system (such as [Docker](https://www.docker.com/) or [Podman](https://podman.io/)), and pull our container by running:

```bash
docker pull u3ebmgske4udqutxkw8rkn/capstone-project
```

If this doesn't work, just clone this repository, navigate into the 'Docker' directory, and run the `create-docker.sh` script (only tested on Unix-like operating systems). This will create a docker image called `capstone-project`, which can then be used by running:

```bash
docker run --rm -p 3838:3838 localhost/capstone-project:latest
```

This will start the shiny server on `http://127.0.0.1:3838`


[jekyll-docs]: https://jekyllrb.com/docs/home
[jekyll-gh]:   https://github.com/jekyll/jekyll
[jekyll-talk]: https://talk.jekyllrb.com