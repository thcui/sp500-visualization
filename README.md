# 436v-project Group 6
preprocess.js:
-
- csv data is converted into json object for better performance and faster data lookup
- Derive stock index for each sector and store data as json object


main.js:
-
- define global variable such as color scale and time interval
- load data and initialize views
- handle search submission and update line chart view
- getbubbleChartData() function computes stock price percentage change for bubble chart base on the given interval
- filterSector() filter bubble chart data points based on the selected sector in tree map

treeMap.js
- 
- referred to treemap examples in https://www.d3-graph-gallery.com/treemap\
- render treemap and show tooltips on a hover
- implemented filter interaction on a sector selection

lineChart.js
-
-
bubbleChart.js
-
-