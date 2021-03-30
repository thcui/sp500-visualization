class BubbleChart {
    constructor(_config, _data) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: 1300,
            containerHeight: 500,
            margin: {top: 20, right: 30, bottom: 50, left: 60},
        };
        this.data = _data
        this.initVis();
    }

    initVis() {
        let vis = this;

        vis.initFlag = true;
        vis.title_height = 30

        vis.custom_container_y = 70
        vis.custom_container_width = 300


        // Calculate inner chart size. Margin specifies the space around the actual chart.
        vis.innerWidth = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right - vis.custom_container_width;
        vis.innerHeight = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;
        vis.custom_container_height = vis.innerHeight / 2 - 10
        vis.custom_container_x = vis.innerWidth + 80
        // Define size of SVG drawing area
        vis.svg = d3
            .select(vis.config.parentElement)
            .attr("width", vis.config.containerWidth)
            .attr("height", vis.config.containerHeight);

        vis.svg.append('text')
            .attr('id', 'bubblechart_title')

        vis.custom_container = vis.svg.append('g').attr('id', 'custom_container')
            .style("font-size", "15px")
            .attr("font-weight", "700")
            .attr('fill', '#dddddd')
        vis.custom_container.append('text')
            .attr("transform", `translate(${vis.custom_container_x},${vis.custom_container_y - 40})`)
            .text('Customize your own basket of')
        vis.custom_container.append('text')
            .attr("transform", `translate(${vis.custom_container_x},${vis.custom_container_y - 20})`)
            .text(' stocks by dragging the bubble here! ')

        vis.custom_basket = vis.custom_container.append('rect')
            .attr("transform", `translate(${vis.custom_container_x},${vis.custom_container_y})`)
            .attr('width', vis.custom_container_width)
            .attr('height', vis.custom_container_height)
            .attr("fill", '#dddddd')
            .attr("rx", 10)
            .attr("ry", 10)
            .attr("fill-opacity", '0.5')
        vis.custom_container.append('text').attr("transform", `translate(${vis.custom_container_x},${vis.custom_container_y + 15})`)
            .text('Basket1')

        vis.custom_basket2 = vis.custom_basket.clone()
            .attr("transform", `translate(${vis.custom_container_x},${vis.custom_container_y + vis.custom_container_height + 10})`)
            .attr("fill", 'yellow')
            .attr("fill-opacity", '0.5')
        vis.custom_container.append('text').attr("transform", `translate(${vis.custom_container_x},${vis.custom_container_y + vis.custom_container_height + 25})`)
            .text('Basket2')


        vis.custom_selection = []
        vis.clones = {}

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
        vis.YaxisG = vis.chartArea.append("g");
        vis.XaxisG = vis.chartArea.append("g").attr("transform", `translate(0,${vis.innerHeight})`);


        // Apply clipping mask to 'vis.chart' to clip leader started before 1950
        vis.chart = vis.chartArea.append('g')
            .attr('clip-path', 'url(#chart-mask)');

        vis.xScale = d3.scaleLinear().range([10, vis.innerWidth - 55]);
        vis.yScale = d3.scaleLinear().range([vis.innerHeight - 55, 55]);
        vis.radiusScale = d3.scaleSqrt().range([5, 50]);
        vis.unzommed_radiusScale = d3.scaleSqrt().range([5, 50]);
        vis.Yaxis = d3.axisLeft(vis.yScale)
            .tickSize(-vis.innerWidth)
            .tickPadding(10)
            .ticks(6)
            .tickFormat(number => d3.format(".2%")(number))
        vis.Xaxis = d3.axisBottom(vis.xScale)
            .tickSize(-vis.innerHeight)
            .tickPadding(10)
            .ticks(10)
            .tickFormat(d => d / 10 ** 9 + 'B');

        // Append axis titles
        vis.chartArea.append('text')
            .attr('class', 'axis-name')
            .attr('y', vis.innerHeight - 15)
            .attr('x', vis.innerWidth - 30)
            .attr("text-anchor", "middle")
            .text("Market Cap");

        vis.svg.append('text')
            .attr('class', 'axis-name')
            .attr('x', 35)
            .attr('y', 60)
            .attr("text-anchor", "middle")
            .text("Price Change");

        // zoom and pan
        vis.zoom = d3.zoom()
            .scaleExtent([1, 40])
            .translateExtent([[-100, -100], [vis.config.containerWidth + 100, vis.config.containerHeight + 100]])
            .on("zoom", function (event) {
                vis.zoomed(event);
            });
        vis.autoZoom = d3.zoom()
            .scaleExtent([1, 40])
            .translateExtent([[-100, -100], [vis.config.containerWidth + 100, vis.config.containerHeight + 100]])
            .on("zoom", function (event) {
                vis.autoZoomed(event);
            });

        vis.updateVis();

    }

    updateVis() {
        let vis = this;

        vis.resetZoom();

        vis.xScale.domain(d3.extent(vis.data, d => d.marketcap));
        vis.yScale.domain(d3.extent(vis.data, d => d.perChange));
        vis.radiusScale.domain(d3.extent(vis.data, d => d.marketcap));
        vis.unzommed_radiusScale.domain(d3.extent(vis.data, d => d.marketcap));
        vis.YaxisG.call(vis.Yaxis);
        vis.XaxisG.call(vis.Xaxis);
        //remove domain
        vis.YaxisG.select(".domain").remove();
        vis.XaxisG.select(".domain").remove();

        vis.renderVis();
    }

    renderVis() {
        let vis = this;
        let original;
        let clone;

        let enterDelay = vis.initFlag ? 1050 : 0;
        vis.updateTitle()


        // Bond transition to circles
        vis.circle = vis.chart.selectAll("circle").data(vis.data, d => d.symbol)
            .join(
                enter => enter
                    .append("circle")
                    .attr("cx", (d) => vis.xScale(d.marketcap))
                    .attr("cy", (d) => vis.yScale(d.perChange))
                    .attr("cursor","pointer")
                    .attr("r", 0)
                    .attr("fill", (d) => colorScheme(d.industry))
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
            .on("mouseover", this.showToolTip)
            .on("mouseout", this.hideToolTip)
            .on('click', this.clickBubble)
            .call(
                d3.drag()
                    .on("start", function (event, d) {
                        original = d3.select(this)
                        clone = original.clone()
                            .attr('class', 'custom')
                            .attr("r", vis.unzommed_radiusScale(d.marketcap))
                            .attr('cx', -100)
                            .attr('cy', -100)
                            .attr('transform', null)
                            .on("mouseover", vis.showToolTip)
                            .on("mouseout", vis.hideToolTip)
                        clone.attr('clip-path', "polygon(21% 51%, 41% 78%, 78% 26%, 89% 38%, 42% 97%, 11% 62%)")

                        clone.each(function () {
                            vis.custom_container.append(() => this);
                        });

                    })
                    .on("drag", function (event, d) {
                        clone.attr("cx", event.x).attr("cy", event.y)

                    })
                    .on("end", dragend)
            );

        function dragend(event, d) {
            let basket_index = 0
            let text
            let data

            function remove_one_item(arr, value) {
                let index = arr.indexOf(value);
                if (index > -1) {
                    arr.splice(index, 1);
                }
                return arr;
            }

            if (event.x >= vis.custom_container_x && event.y >= vis.custom_container_y) {
                text = vis.custom_container.append('text').text(d.symbol).attr("transform", `translate(${event.x},${event.y + 10})`).attr('color', '#000000').attr('font-size', '20')
                if (event.y <= vis.custom_container_y + vis.custom_container_height) {
                    data = custom_data
                    basket_index = 1
                    selected_stock_symbol.push('Basket')
                } else {
                    basket_index = 2
                    data = custom_data2
                    selected_stock_symbol.push('Basket2')
                }
                data.push(d.symbol)

                clone.call(d3.drag().on("drag", function (event, d) {
                    d3.select(this).attr("cx", event.x).attr("cy", event.y)
                }).on("end", function (event, d) {
                    if (d3.select(this).attr("cx") >= vis.custom_container_x && d3.select(this).attr("cy") >= vis.custom_container_y) {
                        if (event.y <= vis.custom_container_y + vis.custom_container_height && basket_index === 2) {
                            basket_index = 1
                            remove_one_item(custom_data2, d.symbol)
                            custom_data.push(d.symbol)
                            selected_stock_symbol.push('Basket')
                        }
                        if (event.y > vis.custom_container_y + vis.custom_container_height && basket_index === 1) {
                            basket_index = 2
                            remove_one_item(custom_data, d.symbol)
                            custom_data2.push(d.symbol)
                            selected_stock_symbol.push('Basket2')
                        }

                        text.remove()
                        text = vis.custom_container.append('text').text(d.symbol).attr("transform", `translate(${event.x},${event.y + 10})`).attr('color', '#000000').attr('font-size', '20')

                    } else {
                        if (basket_index === 1) {
                            remove_one_item(custom_data, d.symbol)
                        }
                        if (basket_index === 2) {
                            remove_one_item(custom_data2, d.symbol)
                        }

                        d3.select(this).remove()
                        text.remove()

                    }
                    if (custom_data.length === 0) {
                        selected_stock_symbol = selected_stock_symbol.filter(v => {
                            return v !== 'Basket'
                        })
                    }
                    if (custom_data2.length === 0) {
                        selected_stock_symbol = selected_stock_symbol.filter(v => {
                            return v !== 'Basket2'
                        })
                    }
                    lineChart.updateVis()
                }))
                lineChart.updateVis()
            } else {
                clone.remove()
            }

        }

        if (enterDelay !== 0) {
            vis.initialZoom();
            vis.initFlag = false;
        }

        // reset button
        d3.select("#bubbleChart-reset-button")
            .on("click", function () {
                vis.resetZoom();
                vis.resetSelectedStockSymbol();
            });
    }

    clickBubble(event, d) {
        {
            const isSelected = (selected_stock_symbol.includes(d.symbol));
            d3.select(this).classed("selected", !isSelected);
            if (isSelected) {
                selected_stock_symbol = selected_stock_symbol.filter(v => {
                    return (v !== d.symbol)
                })
            } else {
                selected_stock_symbol.push(d.symbol)
            }
            updateLineChart();
        }
    }

    showToolTip(e, d) {
        const formatMarketCap = number => d3.format('.3s')(number).replace('G', 'Billions').replace('T', 'Trillions')
        let num = formatMarketCap(d.marketcap);
        d3.select('#tooltip')
            .style("display", "block")
            .style("top", e.pageY + 20 + "px")
            .style("left", e.pageX + 20 + "px")
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
        vis.transform = e.transform.k
        vis.radiusScale.range([5 / e.transform.k, 50 / e.transform.k]);
        vis.circle.attr("transform", e.transform)
            .attr("r", (d) => vis.radiusScale(d.marketcap));
        vis.XaxisG.call(vis.Xaxis.scale(e.transform.rescaleX(vis.xScale)));
        vis.YaxisG.call(vis.Yaxis.scale(e.transform.rescaleY(vis.yScale)));
        vis.YaxisG.select(".domain").remove();
        vis.XaxisG.select(".domain").remove();
    }

    autoZoomed(e) {
        let vis = this;
        vis.radiusScale.range([5 / e.transform.k, 50 / e.transform.k]);
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
                selected_stock_symbol = selected_stock_symbol.filter(v => v !== d.symbol);
            });
        updateLineChart();
    }

    initialZoom() {
        let vis = this;
        // initial zoom
        let initialTransform = d3.zoomIdentity.translate(vis.innerWidth / 2, vis.innerHeight / 2)
            .scale(5).translate(-vis.innerWidth / 5, -vis.innerHeight / 1.3);
        vis.svg.call(vis.zoom.transform, initialTransform);
        // go back to normal
        vis.svg
            .transition()
            .delay(1000)
            .duration(1000)
            .ease(d3.easeQuadInOut)
            .call(vis.zoom.transform, d3.zoomIdentity)
            .on("end", function () {
                // append zoom to svg after finish the initial zoom
                vis.svg.call(vis.zoom);
            });
    }

    updateTitle() {
        let vis = this
        vis.svg.select('#bubblechart_title')
            .attr("x", 500)
            .attr("y", 15)
            .attr('fill', 'white')
            .attr("text-anchor", "middle")
            .attr('font-size', '18px')
            .attr('font-weight', 'bold')
            .text("Market Capitalization for Companies & Percent Change from "
                + selectedDomain[0].toDateString() + " to " + selectedDomain[1].toDateString())
    }
}