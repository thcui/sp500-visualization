class TreeMap {
    constructor(_config, _data) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: 646,
            containerHeight: 410,
            margin: {top: 30, right: 10, bottom: 15, left: 15},
        };
        this.data = _data
        this.initVis();
    }

    initVis() {
        let vis = this;


        vis.svg = d3
            .select(vis.config.parentElement)
            .attr("width", vis.config.containerWidth)
            .attr("height", vis.config.containerHeight)

        //append title
        vis.svg.append('text')
            .attr('id', '#bubbleChart_title')
            .attr("x", 300)
            .attr("y", 20)
            .attr('fill', 'white')
            .attr("text-anchor", "middle")
            .attr('font-size', '18px')
            .attr('font-weight', 'bold')
            .text("Market Capitalization Distribution By Sectors")
        // append annotation
        vis.svg
            .append("text")
            .attr("x", 20)
            .attr("y", 403)
            .style("font-size", 11)
            .attr('fill', 'white')
            .text("Size of rectangle encodes the amount of market capitalization in the given sector, each color represents a sector");


        // Append group element that will contain our actual chart
        // and position it according to the given margin config
        vis.innerWidth = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.innerHeight = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;
        vis.chartArea = vis.svg
            .append("g")
            .attr("transform", `translate(${vis.config.margin.left},${vis.config.margin.top})`);
        vis.renderVis()

    }


    updateVis() {
    }

    renderVis() {
        let vis = this;
        // stratify the data: reformatting for d3.js
        let data = vis.data;
        var root = d3.stratify()
            .id(function (d) {
                return d.sector;
            })
            .parentId(function (d) {
                return d.parent;
            })
            (data);
        root.sum(function (d) {
            return +d.marketcap
        })   // Compute the numeric value for each entity

        // Then d3.treemap computes the position of each element of the hierarchy
        // The coordinates are added to the root object above
        d3.treemap()
            .size([vis.innerWidth, vis.innerHeight])
            .padding(4)
            (root)
        vis.chartArea
            .selectAll("rect")
            .data(root.leaves())
            .enter()
            .append("rect")
            .attr("class", "treeBlock")
            .attr('x', function (d) {
                return d.x0;
            })
            .attr('y', function (d) {
                return d.y0;
            })
            .attr('width', function (d) {
                return d.x1 - d.x0;
            })
            .attr('height', function (d) {
                return d.y1 - d.y0;
            })
            .style("fill", function (d) {
                return colorScheme(d.data.sector)
            })
            .on("mouseover", this.showToolTip)
            .on("mouseout", this.hideToolTip)
            .on("click", this.selectSector);

        // append the text labels for sectors
        vis.chartArea
            .selectAll("text")
            .data(root.leaves())
            .enter()
            .append("text")
            .attr("x", function (d) {
                return d.x0 + 10
            })    // +10 to adjust position (more right)
            .attr("y", function (d) {
                return d.y0 + 20
            })    // +20 to adjust position (lower)
            .text(function (d) {
                return d.data.sector
            })
            .attr("font-size", "12px")
            .attr("fill", "white")

    }

    //show tooltip function that displays market capitalization
    showToolTip(e, d) {
        const formatMarketCap = number => d3.format('.3s')(number).replace('G', 'Billions').replace('T', 'Trillions')
        let num = formatMarketCap(d.data.marketcap);
        d3.select('#tooltip')
            .style("display", "block")
            .style("top", e.pageY + 20 + "px")
            .style("left", e.pageX + 20 + "px")
            .html(`<strong>${d.data.sector}</strong>
              <div><i>Amount of Market Capitalization:</i></div>
              <div> ${num}  USD</div>
               `);
    }

    hideToolTip() {
        d3.select("#tooltip").style("display", "none");
    }

    // apply filter for selected sector
    selectSector(e, d) {
        if (sectorFilter.includes(d.data.sector)) {
            d3.select(this).classed("selected", false);
            sectorFilter = [];
        } else {
            d3.select(".treeBlock.selected").classed("selected", false);
            d3.select(this).classed("selected", true);
            sectorFilter = [d.data.sector]
        }
        filterSector_for_bubble_chart();
        if(sectorFilter.length===0){
            //if after the click, there is no sector is selected, we followed the basic rule for showing tab
            lineChart.updateVis()
        }
        else{
            //if after the click, there is sector is selected, we show the sector tab
            lineChart.update_tab('Sector',true)
        }

    }

}