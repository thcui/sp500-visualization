class BubbleChart {
    constructor(_config, _data) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: 1200,
            containerHeight: 500,
            margin: {top: 50, right: 50, bottom: 50, left: 50},
        };
        this.data = _data
        this.initVis();
    }
    initVis(){
        let vis = this;

        // Calculate inner chart size. Margin specifies the space around the actual chart.
        vis.innerWidth = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.innerHeight = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        // Define size of SVG drawing area
        vis.svg = d3
            .select(vis.config.parentElement)
            .attr("width", vis.config.containerWidth)
            .attr("height", vis.config.containerHeight);

        // Append group element that will contain our actual chart
        // and position it according to the given margin config
        vis.chartArea = vis.svg
            .append("g")
            .attr("transform", `translate(${vis.config.margin.left},${vis.config.margin.top})`);

        // Initialize clipping mask that covers the whole chart
        vis.chartArea.append('defs')
            .append('clipPath')
            .attr('id', 'chart-mask')
            .append('rect')
            .attr('width', vis.innerWidth)
            .attr('y', 0)
            .attr('height', vis.innerHeight);

        // Initialize the axis and scale
        vis.color = d3.scaleOrdinal()
            .domain(["Industrials", "Health Care", "Information Technology", "Communication Services",
                "Consumer Discretionary", "Utilities", "Financials", "Materials", "Real Estate",
                "Consumer Staples", "Energy"])
            .range(["#ED8936", "#2F855A", "#3182CE", "#702459", "#805AD5", "#FC8181", "#C53030",
                "#C4C4C4", "#81E6D9", "#B7791F", "#E0CE61"]);
        vis.YaxisG = vis.chartArea.append("g");
        vis.XaxisG = vis.chartArea.append("g").attr("transform", `translate(0,${vis.innerHeight})`);

        // Apply clipping mask to 'vis.chart' to clip leader started before 1950
        vis.chart = vis.chartArea.append('g')
            .attr('clip-path', 'url(#chart-mask)');
        
        vis.xScale = d3.scaleLinear().range([0, vis.innerWidth-55]);
        vis.yScale = d3.scaleLinear().range([vis.innerHeight-55, 55]);
        vis.radiusScale = d3.scaleSqrt().range([5, 50]);
        vis.Yaxis = d3.axisLeft(vis.yScale)
                    .tickSize(-vis.innerWidth)
                    .tickPadding(10)
                    .ticks(6)
                    .tickFormat(number => d3.format(".2%")(number))
        vis.Xaxis = d3.axisBottom(vis.xScale)
                    .tickSize(-vis.innerHeight)
                    .tickPadding(10)
                    .ticks(10)
                    .tickFormat(d => d/10**9 +'B');

        // zoom and pan
        vis.zoom = d3.zoom()
            .scaleExtent([1, 40])
            .translateExtent([[-100,-100],[vis.config.containerWidth+100,vis.config.containerHeight+100]])
            .on("zoom", function (event) {
                vis.zoomed(event,vis);
            });

        vis.updateVis();

    }

    updateVis(){
        let vis = this;
        vis.xScale.domain(d3.extent(vis.data, d => d.marketcap));
        vis.yScale.domain(d3.extent(vis.data, d => d.perChange));
        vis.radiusScale.domain(d3.extent(vis.data, d => d.marketcap));
        vis.YaxisG.call(vis.Yaxis);
        vis.XaxisG.call(vis.Xaxis);
        //remove domain
        vis.YaxisG.select(".domain").remove();
        vis.XaxisG.select(".domain").remove();

        // vis.add_legend()
        vis.renderVis();
    }

    renderVis(){
        let vis = this;
        vis.circle = vis.chart.selectAll("circle").data(vis.data).join("circle");
        vis.circle
            .attr("cx", (d) => vis.xScale(d.marketcap))
            .attr("cy", (d) => vis.yScale(d.perChange))
            .attr("r", (d) => vis.radiusScale(d.marketcap))
            .attr("fill", (d) => vis.color(d.industry))
            .attr("opacity", 0.7)
            .attr("class", (d) => `${d.industry} ${d.symbol} ${
                selected_stock_symbol.includes(d.symbol) ? 'selected' : ''
            }`)
            .on("mouseover",this.showToolTip)
            .on("mouseout",this.hideToolTip)
            .on('click', function (event, d) {
                const isSelected = (selected_stock_symbol.includes(d.symbol));
                d3.select(this).classed("selected", !isSelected);
                if(isSelected){
                    selected_stock_symbol=selected_stock_symbol.filter(v=>{return (v!==d.symbol)})
                }else{
                    selected_stock_symbol.push(d.symbol)
                }
                updateLineChart();
            })

        // vis.circle.each(function (d) {
        //     if(selected_stock_symbol.includes(d.symbol)){
        //         d3.select(this).classed("selected", true);
        //     }
        // });

        // append zoom to svg
        vis.svg.call(vis.zoom);

        // reset button
        d3.select("#bubbleChart-reset-button")
            .on("click", function () {
                vis.resetZoom();
                vis.resetSelectedStockSymbol();
            });

        vis.initialZoom();

    }

    showToolTip(e,d){
        const formatMarketCap = number => d3.format('.3s')(number).replace('G','Billions').replace('T','Trillions')
        let num = formatMarketCap(d.marketcap);
        d3.select('#tooltip')
            .style("display", "block")
            .style("top", e.pageY +20+ "px")
            .style("left", e.pageX + 20+"px")
            .html(`<strong>${d.symbol}</strong>
              <div><strong>${d.name}</strong></div>
              <div><i>Amount of Market Capitalization:</i></div>
              <div> ${num}  USD</div>
               `);

    }

    hideToolTip() {
        d3.select("#tooltip").style("display", "none");
    }

    zoomed(e) {
        let vis = this;
        vis.radiusScale.range([5/e.transform.k,50/e.transform.k]);
        vis.circle.attr("transform", e.transform)
            .attr("r", (d) => vis.radiusScale(d.marketcap));

        vis.XaxisG.call(vis.Xaxis.scale(e.transform.rescaleX(vis.xScale)));
        vis.YaxisG.call(vis.Yaxis.scale(e.transform.rescaleY(vis.yScale)));
        vis.YaxisG.select(".domain").remove();
        vis.XaxisG.select(".domain").remove();
    }

    resetZoom() {
        let vis = this;
        vis.svg.transition()
            .duration(500)
            .call(vis.zoom.transform, d3.zoomIdentity);
    }

    resetSelectedStockSymbol() {
        d3.selectAll("circle").classed("selected", false);
        selected_stock_symbol = [];
        updateLineChart();
    }

    initialZoom() {
        let vis = this;
        // initial zoom
        let initialTransform = d3.zoomIdentity.translate(vis.innerWidth/2, vis.innerHeight/2)
            .scale(5).translate(-vis.innerWidth/5,-vis.innerHeight/1.3);
        vis.svg.call(vis.zoom.transform, initialTransform);
        // go back to normal
        vis.svg
            .transition()
            .delay(100)
            .duration(1000)
            .ease(d3.easeQuadInOut)
            .call(vis.zoom.transform, d3.zoomIdentity)
    }

    add_legend(){
        let vis=this

        // append the svg object to the body of the page

        // The scale you use for bubble size
        vis.size = d3.scaleSqrt()
            .domain(vis.radiusScale.domain())  // What's in the data, let's say it is percentage
            .range([5,50])  // Size in pixel

        // Add legend: circles
        let valuesToShow = [5000000000000,1000000000000,100000000000]
        vis.xCircle = 230
        vis.xLabel = 380
        vis.yCircle = 330

        vis.lengend= vis.svg.append('g').attr("transform", `translate(700,-150)`);

        vis.lengend
            .selectAll("legend")
            .data(valuesToShow)
            .enter()
            .append("circle")
            .attr("cx", vis.xCircle)
            .attr("cy", function(d){ return vis.yCircle - vis.size(d) } )
            .attr("r", function(d){ return vis.size(d) })
            .style("fill", "green")
            .attr("stroke", "black")

        // Add legend: segments
        vis.lengend
            .selectAll("legend")
            .data(valuesToShow)
            .enter()
            .append("line")
            .attr('x1', function(d){ return vis.xCircle + vis.size(d) } )
            .attr('x2', vis.xLabel)
            .attr('y1', function(d){ return vis.yCircle - vis.size(d) } )
            .attr('y2', function(d){ return vis.yCircle - vis.size(d) } )
            .attr('stroke', 'white')
            .style('stroke-dasharray', ('2,2'))

        // Add legend: labels
        vis.lengend
            .selectAll("legend")
            .data(valuesToShow)
            .enter()
            .append("text")
            .attr('x', vis.xLabel)
            .attr('y', function(d){ return vis.yCircle - vis.size(d) } )
            .text( function(d){ return d } )
            .style("font-size", 10)
            .attr('stroke', 'white')
            .attr('alignment-baseline', 'middle')
    }
}