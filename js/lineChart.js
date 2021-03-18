class LineChart {

    constructor(_config, _data) {
        // Configuration object with defaults
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: 680,
            containerHeight: 400,
            margin: _config.margin || {top: 20, right: 40, bottom: 20, left: 20}
        }
        this.data = _data;
        this.initVis();
    }

    initVis() {
        let vis = this

        vis.chart_height = vis.config.containerHeight - vis.config.margin.bottom - vis.config.margin.top
        vis.chart_width = vis.config.containerWidth - vis.config.margin.right - vis.config.margin.left
        // Create SVG area, initialize scales and axes
        // Create scales
        vis.svg = d3.select(vis.config.parentElement)
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight)

        vis.svg.append("text")
            .attr("x", vis.config.margin.left + 80)
            .attr("y", vis.config.margin.top)
            .attr("text-anchor", "middle")
            .style("font-size", "15px")
            .attr("font-weight", "700")
            .text("Stock Price in USD($)");

        vis.svg.append("text")
            .attr("class", 'axis-name')
            .attr("font-weight", "700")
            .attr('font-size', '15')
            .attr('transform', `translate(${vis.chart_width},${vis.chart_height})`)
            .text("Date");



        vis.chart = vis.svg.append('g')
            .attr('id', 'chart')
            .attr('width', vis.chart_width)
            .attr('height', vis.chart_height)
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);
        vis.drawing_area = vis.chart.append('g')
            .attr('id', 'drawing_area')


        vis.xScale = d3.scaleTime()
            .range([0, vis.chart_width]);

        vis.yScale = d3.scaleLinear()
            .range([0, vis.chart_height])

        vis.xAxis = d3.axisBottom(vis.xScale)
            .tickSize(-vis.chart_height)

        vis.yAxis = d3.axisLeft(vis.yScale)
            .tickSize(-vis.chart_width)



        vis.xAxisG = vis.chart.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0,${vis.chart_height})`);

        // Add the left y-axis group
        vis.yAxisG = vis.chart.append('g')
            .attr('class', 'axis y-axis');


        vis.tooltip = vis.chart.append('g')
            .attr('class', 'tooltip')
            .style('display', 'none');

        vis.trackingArea = vis.chart.append('rect')
            .attr('width', vis.chart_width)
            .attr('height', vis.chart_height)
            .attr('fill', 'none')
            .attr('pointer-events', 'all')

        vis.transition=function transition(path) {
            path.transition()
                .duration(3000)
                .attrTween("stroke-dasharray", vis.tweenDash)
                .on("end", () => {
                    d3.select(this).call(vis.transition);
                });
        }

        vis.tweenDash=function tweenDash() {
            const l = this.getTotalLength(),
                i = d3.interpolateString("0," + l, l + "," + l);
            return function (t) {
                return i(t)
            };
        }


        vis.sector_data = {}

        vis.prepare_stock_data = new Promise((resolve, reject) => {
            d3.json('data/companyData.json').then(d => {
                resolve(d)
            })
        })


        d3.csv('data/marketcap_preprocessed.csv').then(_data => {
            vis.sector_data = _data
            vis.sector_data.push({
                "": "0",
                "symbol": "SP500",
                "name": "SP500",
                "sector": "SP500",
            })
            this.updateVis()
        })



    }

    updateVis() {
        let vis = this


        vis.selected_stock_data = {}

        if (selected_stock_symbol.length === 0) {
            d3.csv('data/SP500HistoricalData.csv').then(_data => {
                delete _data['columns'];
                vis.selected_stock_data['SP500'] = Object.assign({}, _data)
                Object.values(vis.selected_stock_data['SP500']).forEach(stock => {
                    Object.keys(stock).forEach(attr => {
                        if (attr === 'date') {
                            stock[attr] = parseTime(stock[attr])
                        }
                        if (attr === 'price' || attr === 'Volume') {
                            stock[attr] = +stock[attr]
                        }
                    })
                })
            }).then(() => {
                set_lineChart_property(vis)
            })
        } else {

            vis.prepare_stock_data.then(_data => {
                // Convert columns to numerical values
                selected_stock_symbol.forEach(stock_symbol => {
                    if (_data[stock_symbol]) {

                        vis.selected_stock_data[stock_symbol] = _data[stock_symbol].historical
                        d3.map(Object.keys(vis.selected_stock_data[stock_symbol]), d => vis.selected_stock_data[stock_symbol][d]['date'] = d)
                        Object.values(vis.selected_stock_data[stock_symbol]).forEach(stock => {
                            Object.keys(stock).forEach(attr => {
                                if (attr === 'date') {
                                    stock[attr] = parseTime(stock[attr])
                                }
                                if (attr === 'price' || attr === 'Volume') {
                                    stock[attr] = +(stock[attr])
                                }
                            })
                        })
                    }


                });


            }).then(() => {
                set_lineChart_property(vis)
            })
        }

        function set_lineChart_property(vis) {
            vis.All_date = []
            vis.All_price = []
            for (let stock of Object.values(vis.selected_stock_data)) {
                vis.All_date = vis.All_date.concat(d3.map(Object.values(stock), d => d.date))
                vis.All_price = vis.All_price.concat(d3.map(Object.values(stock), d => d.price))
            }
            vis.xScale.domain([d3.min(vis.All_date), d3.max(vis.All_date)])
            vis.yScale.domain([d3.max(vis.All_price), d3.min(vis.All_price)])
            vis.renderVis()
        }

    }


    renderVis() {

        let vis = this
        let line = vis.drawing_area.selectAll('.line').data(Object.keys(vis.selected_stock_data))

        let lineEnter = line.enter().append('path')
        let lineMerge = lineEnter.merge(line)
        lineMerge.attr('class', d => 'line ' + vis.sector_data.filter(v => {
            return v.symbol === d
        })[0].sector.replace(' ', '_'))




        lineMerge.datum(d => Object.values(vis.selected_stock_data[d]))
            .attr("fill", "none")
            .attr("stroke-width", 2)
            .attr("d", d3.line()
                .x(function (d) {
                    return vis.xScale(d.date)
                })
                .y(function (d) {
                    return vis.yScale(d.price)
                })
            ).call(vis.transition);


        let text = vis.drawing_area.selectAll('.stock_name').data(Object.keys(vis.selected_stock_data))
        let textEnter = text.enter().append('text')
        let textMerge = textEnter.merge(text)

        textMerge.text(d => d)
            .attr('class', d => 'stock_name ' + vis.sector_data.filter(v => {
                return v.symbol === d
            })[0].sector.replace(' ', '_'))
            .datum(d => Object.values(vis.selected_stock_data[d]).slice(-1)[0])
            .attr('transform', d => `translate(${vis.chart_width + 20},${vis.yScale(d.price)})`)
            .attr('text-anchor', 'middle')
            .attr('vertical-align', 'text-bottom')
            .attr('font-size', 12)
            .attr('text-stroke', '#ffffff')


        function render_stock_point(stock) {

            // Bind data to visual elements, update axes
            // Update the axes/gridlines, remove the tick lines


            let circle = vis.drawing_area.selectAll('.point').data(stock)
            let circleEnter = circle.enter()
                .append('g')
                .attr('class', 'point')
            circleEnter.append('circle')
            circleEnter.append('path')

            let circleMerge = circleEnter.merge(circle)

            circleMerge.select('circle')
                .attr('r', 1)
                .attr('cx', d => vis.xScale(d.date))
                .attr('cy', d => vis.yScale(d.price))
                .attr('fill', 'green')


            circle.exit().remove();
        }

        // vis.chart.selectAll('.hidden').on('mouseover', null).on('mousemove', null).on('mouseleave', null).on('click', null)
        vis.trackingArea.on('mouseenter', () => {
            vis.tooltip.style('display', 'block');
        })
            .on('mouseleave', () => {
                vis.tooltip.style('display', 'none');
            })
            .on('mousemove', (event) => {

                // Get date that corresponds to current mouse x-coordinate
                const xPos = d3.pointer(event, this.svg.node())[0] - vis.config.margin.left// First array element is x, second is y
                const date = vis.xScale.invert(xPos);
                vis.bisectDate = d3.bisector(d => d.date).left;
                // Find nearest data point

                let tempoo_data = []
                for (let stock of Object.values(vis.selected_stock_data)) {
                    stock = Object.values(stock)
                    if (stock.length === 0) {
                        continue
                    }
                    const index = vis.bisectDate(stock, date, 1);
                    const a = stock[index - 1];
                    const b = stock[index];
                    const d = b && (date - a.date > b.date - date) ? b : a;
                    tempoo_data.push(d)
                }


                let tooltip_circle = vis.tooltip.selectAll('.tooltip_point').data(tempoo_data)
                let tooltip_circleEnter = tooltip_circle.enter().append('g').attr('class', 'tooltip_point')
                tooltip_circleEnter.append('circle')
                tooltip_circleEnter.append('text')
                let tooltip_circleMerge = tooltip_circleEnter.merge(tooltip_circle)
                tooltip_circleMerge.select('circle')
                    .attr('r', 4)
                    .attr('fill', 'red')
                    .attr('transform', d => `translate(${(vis.xScale(d.date))},${(vis.yScale(d.price))})`)
                tooltip_circleMerge.select('text')
                    .attr('font-size', '12')
                    .attr('fill', 'white')
                    .attr('transform', d => `translate(${vis.xScale(d.date)},${(vis.yScale(d.price))})`)
                    .text(d => d.price)

                tooltip_circle.exit().remove()
            })


        vis.xAxisG
            .call(vis.xAxis)
            .call(g => g.select('.domain').remove())

        vis.yAxisG
            .call(vis.yAxis)
            .call(g => g.select('.domain').remove())


    }

}