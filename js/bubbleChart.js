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
        // Calculate inner chart size. Margin specifies the space around the actual chart.
        vis.innerWidth = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.innerHeight = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;
        vis.chart = vis.chartArea.append("g");
        vis.Yaxis = vis.chart.append("g");
        vis.Xaxis = vis.chart.append("g").attr("transform", `translate(0,${vis.innerHeight})`);
        vis.xScale = d3.scaleLinear().range([0, vis.innerWidth]);
        vis.yScale = d3.scaleLinear().range([vis.innerHeight, 0]);
        vis.radiusScale = d3.scaleSqrt().range([5, 50]);
        vis.updateVis();

    }

    updateVis(){
        let vis = this;
        vis.xScale.domain(d3.extent(vis.data, d => d.marketcap));
        vis.yScale.domain(d3.extent(vis.data, d => d.perChange));
        vis.radiusScale.domain(d3.extent(vis.data, d => d.marketcap));
        const yAxisFormat = number => d3.format(".0%")(number);
        vis.Yaxis.call(d3.axisLeft(vis.yScale).tickSize(-vis.innerWidth).tickPadding(10).ticks(6).tickFormat(yAxisFormat));
        vis.Xaxis.call(d3.axisBottom(vis.xScale).tickSize(-vis.innerHeight).tickPadding(10).ticks(10)
            .tickFormat(d => d/10**9 +'B'));
        //remove domain
        vis.Yaxis.select(".domain").remove();
        vis.Xaxis.select(".domain").remove();
        vis.add_legend()
        vis.renderVis();
    }

    renderVis(){
        let vis = this;
        const circle = vis.chart.selectAll("circle").data(vis.data).join("circle");
        circle
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