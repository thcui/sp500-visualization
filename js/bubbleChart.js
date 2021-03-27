class BubbleChart {
    constructor(_config, _data) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: 1300,
            containerHeight: 500,
            margin: {top: 50, right: 30, bottom: 50, left: 50},
        };
        this.data = _data
        this.initVis();
    }
    initVis(){
        let vis = this;

        vis.initFlag = true;

        vis.custom_container_y=100
        vis.custom_container_width=300

        // Calculate inner chart size. Margin specifies the space around the actual chart.
        vis.innerWidth = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right-vis.custom_container_width;
        vis.innerHeight = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        vis.custom_container_x=vis.innerWidth+50
        // Define size of SVG drawing area
        vis.svg = d3
            .select(vis.config.parentElement)
            .attr("width", vis.config.containerWidth)
            .attr("height", vis.config.containerHeight);

        vis.custom_container=vis.svg.append('g').attr('id','custom_container')
            .style("font-size", "15px")
            .attr("font-weight", "700")
            .attr('fill','#dddddd')
        vis.custom_container.append('text')
            .attr("transform", `translate(${vis.custom_container_x},${vis.custom_container_y-40})`)
            .text('Customize your own basket of')
        vis.custom_container.append('text')
            .attr("transform", `translate(${vis.custom_container_x},${vis.custom_container_y-20})`)
            .text(' stocks by dragging the bubble here! ')

        vis.custom_container.append('rect')
            .attr("transform", `translate(${vis.custom_container_x},${vis.custom_container_y})`)
            .attr('width', vis.custom_container_width)
            .attr('height', vis.innerHeight)
            .attr("fill", '#dddddd')
            .attr("rx", 10)
            .attr("ry", 10)
            .attr("fill-opacity", '0.5')

        vis.custom_selection=[]
        vis.clones={}

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
        
        vis.xScale = d3.scaleLinear().range([10, vis.innerWidth-55]);
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
                vis.zoomed(event);
            });
        vis.autoZoom = d3.zoom()
            .scaleExtent([1, 40])
            .translateExtent([[-100,-100],[vis.config.containerWidth+100,vis.config.containerHeight+100]])
            .on("zoom", function (event) {
                vis.autoZoomed(event);
            });

        vis.updateVis();

    }

    updateVis(){
        let vis = this;

        vis.resetZoom();

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
        let original;
        let clone;

        let enterDelay = vis.initFlag ? 1050 : 0;


        // Bond transition to circles
        vis.circle = vis.chart.selectAll("circle").data(vis.data, d => d.symbol)
            .join(
                enter => enter
                    .append("circle")
                    .attr("cx", (d) => vis.xScale(d.marketcap))
                    .attr("cy", (d) => vis.yScale(d.perChange))
                    .attr("r", 0)
                    .attr("fill", (d) => vis.color(d.industry))
                    .attr("opacity", 0.7)
                    .attr("class", (d) => `${d.industry} ${d.symbol} ${
                        selected_stock_symbol.includes(d.symbol) ? 'selected' : ''
                    }`)
                    .transition().delay(enterDelay).duration(300)
                    .attr("r", (d) => vis.radiusScale(d.marketcap))
                    .selection()
                    ,
                update => update
                    .transition().duration(300)
                    .attr("cx", (d) => vis.xScale(d.marketcap))
                    .attr("cy", (d) => vis.yScale(d.perChange))
                    .attr("r", (d) => vis.radiusScale(d.marketcap))
                    .selection(),
                exit => exit
                    .transition()
                    .duration(300)
                    .attr("r", 0)
                    .remove()
            );
        vis.circle
            .on("mouseover",this.showToolTip)
            .on("mouseout",this.hideToolTip)
            .on('click',this.clickBubble )
            .call(
                    d3.drag()
                        .on("start", function (event,d){
                            original=d3.select(this)
                            clone=d3.select(this)
                                .clone()
                                .attr('cx',-100)
                                .attr('cy',-100)
                            clone.attr('clip-path',"polygon(21% 51%, 41% 78%, 78% 26%, 89% 38%, 42% 97%, 11% 62%)")

                            clone.each(function() { vis.custom_container.append(() => this); });

                        })
                        .on("drag", function (event,d){

                            clone.attr("cx",  event.x).attr("cy",  event.y)
                                .attr('class','custom')
                                .on("mouseover",vis.showToolTip)
                                .on("mouseout",vis.hideToolTip)
                        })
                        .on("end", dragend)
                );

        function dragend(event,d){
            let text
            if (event.x >= vis.custom_container_x && event.y >= vis.custom_container_y) {
                clone.attr("transform", `scale(${vis.transform})`)
                    .attr("r", (d) => vis.radiusScale(d.marketcap));
                text=vis.custom_container.append('text').text(d.symbol).attr("transform",`translate(${clone.attr("cx")},${clone.attr("cy")+10})`).attr('color','#000000').attr('font-size','20')
                clone.call( d3.drag().on("drag", function (event,d){
                    d3.select(this).attr("cx", event.x).attr("cy",  event.y)
                }). on("end", function (event,d){
                    if (d3.select(this).attr("cx")>= vis.custom_container_x && d3.select(this).attr("cy")>= vis.custom_container_y){
                        text.remove()
                        text=vis.custom_container.append('text').text(d.symbol).attr("transform",`translate(${clone.attr("cx")},${clone.attr("cy")+10})`).attr('color','#000000').attr('font-size','20')

                    }
                    else{
                        custom_data=custom_data.filter(v=>{return v!==d.symbol})
                        if(custom_data.length===0){
                            selected_stock_symbol=selected_stock_symbol.filter(v=>{return v!=='Yours'})
                        }
                       // original.call(d3.drag().on("end", dragend))
                       // original .attr("cx", (d) => vis.xScale(d.marketcap))
                       //     .attr("cy", (d) => vis.yScale(d.perChange))
                        d3.select(this).remove()
                        text.remove()
                        lineChart.updateVis()
                    }
                }))
                custom_data.push(d.symbol)
                selected_stock_symbol.push('Yours')
                lineChart.updateVis()
            } else {

                // original .attr("cx", (d) => vis.xScale(d.marketcap))
                //     .attr("cy", (d) => vis.yScale(d.perChange))
                clone.remove()
            }

        }

        if (enterDelay !== 0) {
            vis.initialZoom();
            vis.initFlag = false;
        }

        // append zoom to svg
        vis.svg.call(vis.zoom);


        // reset button
        d3.select("#bubbleChart-reset-button")
            .on("click", function () {
                vis.resetZoom();
                vis.resetSelectedStockSymbol();
            });
    }

    clickBubble (event, d){
        {
            const isSelected = (selected_stock_symbol.includes(d.symbol));
            d3.select(this).classed("selected", !isSelected);
            if(isSelected){
                selected_stock_symbol=selected_stock_symbol.filter(v=>{return (v!== d.symbol)})
            }else{
                selected_stock_symbol.push(d.symbol)
            }
            updateLineChart();
        }
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
        vis.transform=e.transform.k
        vis.radiusScale.range([5/e.transform.k,50/e.transform.k]);
        vis.circle.attr("transform", e.transform)
            .attr("r", (d) => vis.radiusScale(d.marketcap));
        vis.XaxisG.call(vis.Xaxis.scale(e.transform.rescaleX(vis.xScale)));
        vis.YaxisG.call(vis.Yaxis.scale(e.transform.rescaleY(vis.yScale)));
        vis.YaxisG.select(".domain").remove();
        vis.XaxisG.select(".domain").remove();
    }

    autoZoomed(e) {
        let vis = this;
        vis.radiusScale.range([5/e.transform.k,50/e.transform.k]);
        vis.circle
            .attr("transform", e.transform)
            .attr("r", (d) => vis.radiusScale(d.marketcap));

        vis.XaxisG.transition().duration(30).call(vis.Xaxis.scale(e.transform.rescaleX(vis.xScale)));
        vis.YaxisG.transition().duration(30).call(vis.Yaxis.scale(e.transform.rescaleY(vis.yScale)));
        vis.YaxisG.select(".domain").remove();
        vis.XaxisG.select(".domain").remove();
    }

    resetZoom() {
        let vis = this;
        vis.svg.transition()
            .duration(500)
            .call(vis.autoZoom.transform, d3.zoomIdentity);
    }

    resetSelectedStockSymbol() {
        d3.selectAll("circle.selected")
            .classed("selected", false)
            .each(function (d) {
                selected_stock_symbol = selected_stock_symbol.filter(v => v!==d.symbol);
            });
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
            .delay(1000)
            .duration(1000)
            .ease(d3.easeQuadInOut)
            .call(vis.zoom.transform, d3.zoomIdentity)
    }

    add_legend(){
        let vis=this
        let pos_x=1100
        let pos_y=200

        let height=100


            let svg = vis.chartArea.append('svg')
                .style("overflow", "visible")
                .datum([{x: pos_x, y: pos_y, r: 0, id:0}, {x: pos_x, y: pos_y, r: 0,id:1}]);
            //
            // let delta = svg.append("line")
            //     .attr("stroke", "red")
            //     .attr("stroke-width", 2)
            //     .attr("stroke-linecap", "round");

            let e = svg.append("g");

            e.append("circle")
                .attr("fill", "darkgrey")
                .attr("r",'80')
                .attr("fill-opacity", 0.3)
                .attr("stroke", "red")
                // .call(d3.drag().on("drag", dragged_large));

            // e.append("circle")
            //     .attr("fill", "red")
            //     .attr("r", 3.5);

            let circle = svg.append("g")
                .selectAll("g")
                .data(d => d)
                .enter().append("g")
                .attr("transform", d => `translate(${d.x},${d.y})`)
                .each(function (d){
                    if(d.id===0){
                        d3.select(this).call(d3.drag().on("drag", dragged));
                        d3.select(this).append("path")
                            .attr("fill", "white")
                            .attr("transform", `scale(0.05)`)
                            .attr("d", "M0,-300l100,100h-50v150h150v-50L300,0l-100,100v-50h-150v150h50L0,300l-100,-100h50v-150h-150v50L-300,0l100,-100v50h150v-150h-50z")

                    }})

            circle.append("circle")
                .attr("id", "circle_minimum")
                .attr("cursor", "move")
                .attr("stroke", "black")
                .attr("fill-opacity", 0.3)
                .attr("r", d => d.r)
                .call(d3.drag().on("drag", null));


            function dragged(event) {
                let d = d3.select(this).datum();
                d.x = Math.max(0, Math.min(pos_x, event.x));
                d.y = Math.max(0, Math.min(pos_y, event.y));
                update();
            }

            function update() {
                let circles = svg.datum(),
                    ad = circles[0],
                    bd = circles[1],
                    dx = bd.x - ad.x,
                    dy = bd.y - ad.y,
                    l = Math.sqrt(dx * dx + dy * dy);

                circle
                    .attr("transform", d => `translate(${d.x},${d.y})`);

                if (vis.encloses(ad, bd) || vis.encloses(bd, ad)) {
                    e.style("display", "none");
                    return;
                }

                let ed = vis.encloseBasis2(ad, bd);

                e
                    .style("display", null)
                    .attr("transform",`translate(${ed.x},${ed.y})`)
                    .select("circle")
                    .attr("r", ed.r);
            }

            update();

            return svg.node();

    }

     encloseBasis2(a, b) {
        const x1 = a.x, y1 = a.y, r1 = a.r;
        const x2 = b.x, y2 = b.y, r2 = b.r;
        const x21 = x2 - x1, y21 = y2 - y1, r21 = r2 - r1;
        const l = Math.sqrt(x21 * x21 + y21 * y21);
        return {
            x: (x1 + x2 + x21 / l * r21) / 2,
            y: (y1 + y2 + y21 / l * r21) / 2,
            r: (l + r1 + r2) / 2
        };
    }
    encloses(a, b) {
        const dr = a.r - b.r;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        return dr >= 0 && dr * dr > dx * dx + dy * dy;
    }
}