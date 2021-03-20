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

        vis.color = d3.scaleOrdinal()
            .domain(["Industrials", "Health Care", "Information Technology", "Communication Services",
                "Consumer Discretionary", "Utilities", "Financials", "Materials", "Real Estate",
                "Consumer Staples", "Energy"])
            .range(["#ED8936", "#2F855A", "#3182CE", "#702459", "#805AD5", "#FC8181", "#C53030",
                "#C4C4C4", "#81E6D9", "#B7791F", "#E0CE61"]);

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

        // Apply clipping mask to 'vis.chart' to clip leader started before 1950
        vis.chart = vis.chartArea.append('g')
            .attr('clip-path', 'url(#chart-mask)');

        // Initialize the axis and scale
        vis.YaxisG = vis.chartArea.append("g");
        vis.XaxisG = vis.chartArea.append("g").attr("transform", `translate(0,${vis.innerHeight})`);
        vis.xScale = d3.scaleLinear().range([0, vis.innerWidth]);
        vis.yScale = d3.scaleLinear().range([vis.innerHeight, 0]);
        vis.radiusScale = d3.scaleSqrt().range([5, 50]);
        vis.Yaxis = d3.axisLeft(vis.yScale)
                    .tickSize(-vis.innerWidth)
                    .tickPadding(10)
                    .ticks(6)
                    .tickFormat(number => d3.format(".0%")(number))

        vis.Xaxis = d3.axisBottom(vis.xScale)
                    .tickSize(-vis.innerHeight)
                    .tickPadding(10)
                    .ticks(10)
                    .tickFormat(d => d/10**9 +'B');

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
            .attr("class", (d) => `${d.industry} ${d.symbol}`)
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
        // zoom and pan
        const zoom = d3.zoom()
                .scaleExtent([1, 40])
                .translateExtent([[-100,-100],[vis.config.containerWidth+100,vis.config.containerHeight+100]])
                .on("zoom", function (event) {
                    vis.zoomed(event,vis);
                });
        // append zoom to svg
        vis.svg.call(zoom);
    }
    showToolTip(e,d){
        const formatMarketCap = number => d3.format('.3s')(number).replace('G','Billions').replace('T','Trillions')
        let num = formatMarketCap(d.marketcap);
        d3.select('#tooltip')
            .style("display", "block")
            .style("top", e.pageY +20+ "px")
            .style("left", e.pageX + 20+"px")
            .html(`<strong>${d.name}</strong>
              <div><i>Amount of Market Capitalization:</i></div>
              <div> ${num}  USD</div>
               `);

    }

    hideToolTip() {
        d3.select("#tooltip").style("display", "none");
    }

    zoomed(e,vis) {
        vis.radiusScale.range([5/e.transform.k,50/e.transform.k]);
        vis.circle.attr("transform", e.transform)
            .attr("r", (d) => vis.radiusScale(d.marketcap));

        vis.XaxisG.call(vis.Xaxis.scale(e.transform.rescaleX(vis.xScale)));
        vis.YaxisG.call(vis.Yaxis.scale(e.transform.rescaleY(vis.yScale)));
        vis.YaxisG.select(".domain").remove();
        vis.XaxisG.select(".domain").remove();

    }
}