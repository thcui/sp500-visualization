# 436v-project Group 6
css/style.css:
-
- style the visualization.

data/436_preprocess.ipynb:
-
- preprocess, merge and trim csv data. Detailed steps are documented in M2 writeup and inside the Jupyter Notebook.

js/preprocess.js:
-
- csv data is converted into json object for better performance and faster data lookup
- Derive stock index for each sector and store data as json object


js/main.js:
-
- define global variable such as color scale and time interval
- load data and initialize views
- handle search submission and update line chart view
- getbubbleChartData() function computes stock price percentage change for bubble chart base on the given interval
- filterSector() filter bubble chart data points based on the selected sector in tree map

js/treeMap.js
- 
- referred to treemap examples in https://www.d3-graph-gallery.com/treemap\
- render treemap and show tooltips on a hover
- implemented filter interaction on a sector selection

js/lineChart.js
-
-
js/bubbleChart.js
-
- initialize the bubblechart based on https://codesandbox.io/s/github/UBC-InfoVis/2021-436V-examples/tree/master/d3-interactive-scatter-plot
- user can click to select/unselect bubble for detailed trend on linechart via `clickBubble()`.
- hover over each bubble, the app will display detailed tooltips for each company. Implementation are in `showTooltip()` and `hideToolTip()`.
- d3 zoom referred to https://www.freecodecamp.org/news/get-ready-to-zoom-and-pan-like-a-pro-after-reading-this-in-depth-tutorial-5d963b0a153e/
- `initialZoom()` provides the functionality of a initial zooming + panning transition when the page is loaded up, to advise the user of the functionality of zooming.
- after the data finished loading, `vis.zoom` is bound to the svg element, for user to perform interaction.
- double click, scroll using mouse, pan using mouse will zoom and pan the chart. 
- when user click on button `Reset Stocks Selection`, or click on a block of treemap, `autoZoomed()` is used to update the transition of the axis and scale.
- resize/drag the brush, click on button `Reset Stocks Selection`, and click on a block of treemap will trigger transition of circles bound in `renderVis()`.
- `Reset Stocks Selection` is bound to a click event on `vis.resetZoom()` and `vis.resetSelectedStockSymbol()`. Click on `Reset Stocks Selection` will reset the selections and viewpoint.
## TODO: drag for bubbles