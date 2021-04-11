# CPSC436V-Project Group 6: S&P 500 Visualization

### Name: Tianhang Cui
#### Student Number:32968299
#### CSID: y7r1b
  
### Name: Yuchen Liu
#### Student Number: 19279158
#### CSID: d6h0b
  
### Name: Emily Lian
#### Student Number: 36054062
#### CSID: l6q1b

# I. External Sources Used:
### (The change from the cited resources is included in the next part)
#### Overall
- https://github.com/d3/d3/blob/master/API.md
#### LineChart Animation:
- https://observablehq.com/@jurestabuc/animated-line-chart
#### Dragging:
- https://observablehq.com/@d3/circle-dragging-i
#### Brush for the line chart
- https://codesandbox.io/s/github/UBC-InfoVis/2021-436V-examples/tree/master/d3-brushing-linking?file=/js/focusContextVis.js
#### Treemap
- https://www.d3-graph-gallery.com/treemap
#### BubbleChart
- https://codesandbox.io/s/github/UBC-InfoVis/2021-436V-examples/tree/master/d3-interactive-scatter-plot
#### Zoom
- https://www.freecodecamp.org/news/get-ready-to-zoom-and-pan-like-a-pro-after-reading-this-in-depth-tutorial-5d963b0a153e/
- https://bl.ocks.org/puzzler10/63c0eff1756ca7cb62213932f9ef6825
- https://observablehq.com/@d3/programmatic-zoom
#### Data
- [data/marketcap.csv](https://datahub.io/core/s-and-p-500-companies)
- [data/data/*.csv](https://www.kaggle.com/zc1111/sp-500-daily-data-till-20210130)
- [data/SP500HistoricalData.csv](https://www.investing.com/indices/us-spx-500-historical-data)
- GoogleFinance API
- YahooFinance API

# II. High-level Process/Changes Made:
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
- filterDateRange() filter bubble chart data points based on the selected date range in the line chart
- the jquery search bar function selects the stock symbol in interest, call `bubbleChart.focusZoom()`, and move the viewpoint to the bubble in interest.
- `getOverview(comp)` get company overview data using Wikipedia API

js/treeMap.js
- 
- referred to treemap examples in https://www.d3-graph-gallery.com/treemap
- render rectangle size base on market capitalization
- hover over each rectangle will display detailed tooltips for each sector. Implementation are in `showTooltip()` and `hideToolTip()`.
- user can select/deselect a sector to filter elements on bubble chart using selectSector(e,d), this function will further call filterSector() in main.js
- when a sector is selected, filterSector() also calls updateVis() for lineChart to show the derived value of combined stock price of the given sector

js/lineChart.js
- 
#### For the initVis():
- I first updated both y-scale and x-axis to be scaleLinear() since the both of them are quantitative.   
- I formatted the tick marks to be long enough so that it can be used the see the position.
- I set and update all my scales, making sure to update my scales in updateVis in case any data has changed
- I added the vertical and horizontal axis for displaying the date and the stock price. I put the axes into their corresponding group.
- I added the legend to indicate the meaning of color and dash lines: vis.add_legend()
- I initialized the brush so that we can modify it later

#### For the updateVis():
- There are some variable component in the title that need to be updated here based on the data.
- I mainly set the domain of the axes as they depend on the input data.
- Based the selection, vis.import_data() will select only the data needed and put them into vis.selected_stock_data
- As the title and the axis name will sometimes change based on the selection(i.e sp500 index, sector price or company price), I update them here by vis.update_Title_and_AxisName()
####  For the renderVis():
- It first draws the line in the overview line chart as it is simple and static.
- Then it updated the function of hovering mouse on the chart.
- It then will set the brush to a pre-specified place, as it set the position of the brush, the line on the detailed chart will be drawn as the 
function vis.brushed will be called, and it then calls renderline() to draw the line.

js/bubbleChart.js
-
- initialize the bubble chart based on https://codesandbox.io/s/github/UBC-InfoVis/2021-436V-examples/tree/master/d3-interactive-scatter-plot and Programming Assignment 2.
- user can click to select/unselect bubble for detailed trend on line chart via `clickBubble()`.
- hover over each bubble, the app will display detailed tooltips for each company. Implementation are in `showTooltip()` and `hideToolTip()`.
- d3 zoom referred to https://www.freecodecamp.org/news/get-ready-to-zoom-and-pan-like-a-pro-after-reading-this-in-depth-tutorial-5d963b0a153e/
- `initialZoom()` provides the functionality of a initial zooming + panning transition when the page is loaded up, to advise the user of the functionality of zooming.
- after the data finished loading, `vis.zoom` is bound to `vis.svgG` element, for user to perform interaction.
- double click, scroll using mouse, pan using mouse will zoom and pan the chart. 
- when user click on button `Reset View`, or click on a block of treemap, `vis.resetZoom()` is used to update the transition of the axis and scale, reset the zoom to `d3.zoomIdentity`.
- resize/drag the brush, bubbles will update their position through animation, without changing the zoom scale.
- when user click on button `Clear All Selections`, the system will deselect all previous selections made on each view by purging values in `selected_stock_symbol` except for Baskets.
- when user, click on button `Clear Selections On Current View`, the system will deselect previous selections made on current view by calling `vis.resetSelectedStockSymbolCurrView()`.
- For each bubble, we added the support for drag by `.call(d3.drag().…………………`,   
  - When the drag is started: It will create a new circle with clip-path on it, so that it will look like a check mark, we will call it the "new shape". The position will be the current position of the mouse pointer.
  - When the drag is moving: The new shape will adjust the position based on the mouse pointer: `clone.attr("cx", event.x+vis.config.margin.left).attr("cy", event.y+vis.config.margin.top)`  
  - When the drag is end: The function dragend() will be called, and it performs different action based on the final position of the drag:
    1. If it is in the area of one of the rectangle for the 'basket', we will put the symbol of this stock into the `custom_data` or `custom_data2`, and then update the line chart based on it. Also, we will let the “new shape” can be dragged so that the user can remove it from the basket.  
    2. If it is not in the area of 'basket', we will treat it as the user want to cancel the drag and nothing will happen(the "new shape" will be removed).