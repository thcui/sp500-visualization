class LineChart {

    constructor(_config, _data) {
        // Configuration object with defaults
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: 680,
            containerHeight: 400,
            margin: _config.margin || {top: 20, right: 40, bottom: 20, left: 30}
        }
        this.data = _data;
        this.initVis();
    }

    initVis() {
        let vis = this

        vis.chart_height = vis.config.containerHeight - vis.config.margin.bottom - vis.config.margin.top
        vis.chart_width = vis.config.containerWidth - vis.config.margin.right - vis.config.margin.left

        vis.margin_btw=20
        vis.overview_chart_height=50
        vis.overview_chart_width=vis.chart_width
        vis.detail_chart_height=vis.chart_height-vis.overview_chart_height
        vis.detail_chart_width=vis.chart_width

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
            .attr('transform', `translate(${vis.chart_width},${vis.detail_chart_height})`)
            .text("Date");

        vis.chart = vis.svg.append('g')
            .attr('id', 'chart')
            .attr('width', vis.chart_width)
            .attr('height', vis.chart_height)
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);


        vis.xScale_detail = d3.scaleTime()
            .range([0, vis.detail_chart_width]);

        vis.yScale_detail = d3.scaleLinear()
            .range([0, vis.detail_chart_height-vis.margin_btw])

        vis.xScale_overview = d3.scaleTime()
            .range([0, vis.overview_chart_width]);

        vis.yScale_overview = d3.scaleLinear()
            .range([0, vis.overview_chart_height])

        vis.xAxis_detail = d3.axisBottom(vis.xScale_detail)
            .tickSize(-vis.chart_height)
            // .tickFormat((d, i) => {
            //     const ticks = vis.xAxis_detail.scale().ticks();
            //
            //     if (i > 0 && ticks[i - 1].getFullYear() === d.getFullYear()) {
            //         return d3.timeFormat('%b')(d);
            //     }
            //     else {
            //         return d3.timeFormat('%Y')(d);
            //     }
            // });

        vis.yAxis_detail = d3.axisLeft(vis.yScale_detail)
            .tickSize(-vis.chart_width)

        vis.xAxis_overview = d3.axisBottom(vis.xScale_overview)
            .tickSize(1)
            .tickFormat((d, i) => {
                const ticks = vis.xAxis_detail.scale().ticks();

                if (i > 0 && ticks[i - 1].getFullYear() === d.getFullYear()) {
                    return d3.timeFormat('%b')(d);
                }
                else {
                    return d3.timeFormat('%Y')(d);
                }
            });



        vis.xAxisG_detail = vis.chart.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0,${vis.detail_chart_height-vis.margin_btw})`);
        vis.xAxisG_overview = vis.chart.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0,${vis.chart_height})`);

        // Add the left y-axis group
        vis.yAxisG = vis.chart.append('g')
            .attr('class', 'axis y-axis');

        vis.drawing_area = vis.chart.append('g')
            .attr('id', 'drawing_area')
            .attr('width', vis.detail_chart_width)
            .attr('height', vis.detail_chart_height)

        vis.overview_area = vis.chart.append('g')
            .attr('id', 'overview_area')
            .attr('width', vis.overview_chart_width)
            .attr('height', vis.overview_chart_height)
            .attr('transform', `translate(0,${vis.detail_chart_height})`);


        vis.tooltip = vis.chart.append('g')
            .attr('class', 'tooltip')
            .style('display', 'none');





        vis.trackingArea = vis.chart.append('rect')
            .attr('width', vis.chart_width)
            .attr('height', vis.detail_chart_height-vis.margin_btw)
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


        vis.brushG = vis.overview_area.append('g')
            .attr('class', 'brush x-brush');


        // Initialize brush component
        vis.brush = d3.brushX()
            .extent([[0, 0], [vis.chart_width, vis.overview_chart_height]])
            .on('brush', function({selection}) {
                if (selection) vis.brushed(selection);
            })
            .on('end', function({selection}) {
                if (!selection) vis.brushed(null);
            });

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
            vis.xScale_detail.domain([d3.min(vis.All_date), d3.max(vis.All_date)])
            vis.yScale_detail.domain([d3.max(vis.All_price), d3.min(vis.All_price)])
            vis.xScale_overview.domain([d3.min(vis.All_date), d3.max(vis.All_date)])
            vis.yScale_overview.domain([d3.max(vis.All_price), d3.min(vis.All_price)])
            vis.renderVis()
        }
        vis.get_closest_date=function get_closest_date(xPos,data) {
            // Get date that corresponds to current mouse x-coordinate
            const date = vis.xScale_detail.invert(xPos);
            vis.bisectDate = d3.bisector(d => d.date).right;
            let temp=[]
            for (let stock of data) {
                stock = Object.values(stock)
                if (stock.length === 0) {
                    continue
                }
                const index = vis.bisectDate(stock, date, 1);
                const a = stock[index - 1];
                const b = stock[index];
                const d = b && (date - a.date > b.date - date) ? b : a;
                temp.push(d)
            }
            return temp
        }

    }


    renderVis() {

        let vis = this

        vis.renderLine=function renderLine(area,data,x_scale,y_scale,if_text){
            let line = area.selectAll('.line').data(data)

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
                        return x_scale(d.date)
                    })
                    .y(function (d) {
                        return y_scale(d.price)
                    })
                ).call(vis.transition);

            line.exit().remove()

            if(if_text){
                render_text(area,data,x_scale,y_scale)
            }


        }
        vis.renderLine(vis.drawing_area,Object.keys(vis.selected_stock_data),vis.xScale_detail,vis.yScale_detail,true)
        vis.renderLine(vis.overview_area,Object.keys(vis.selected_stock_data),vis.xScale_overview,vis.yScale_overview,false)




        function render_text(area,data,x_scale,y_scale) {
            let text = area.selectAll('.stock_name').data(data)
            let textEnter = text.enter().append('text')
            let textMerge = textEnter.merge(text)
            let boundary_date=vis.get_closest_date(x_scale.range()[1], Object.values(vis.selected_stock_data))[0].date
           
            textMerge.text(d => d)
                .attr('class', d => 'stock_name ' + vis.sector_data.filter(v => {
                    return v.symbol === d
                })[0].sector.replace(' ', '_'))
                .datum(d => Object.values(vis.selected_stock_data[d]).filter(v=>
                    v.date===boundary_date))
                .attr('transform',
                        d => `translate(${vis.chart_width + 20},${y_scale(d[0].price)})`)
                .attr('text-anchor', 'middle')
                .attr('vertical-align', 'text-bottom')
                .attr('font-size', 12)
                .attr('text-stroke', '#ffffff')

            text.exit().remove()
        }


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
                .attr('cx', d => vis.xScale_detail(d.date))
                .attr('cy', d => vis.yScale_detail(d.price))
                .attr('fill', 'green')


            circle.exit().remove();
        }

        vis.trackingArea.on('mouseenter', () => {
            vis.tooltip.style('display', 'block');
        })
            .on('mouseleave', () => {
                vis.tooltip.style('display', 'none');
            })
            .on('mousemove', (event) => {


                // Find nearest data point

                let tempoo_data = vis.get_closest_date(d3.pointer(event, this.svg.node())[0] - vis.config.margin.left,
                    Object.values(vis.selected_stock_data))



                let tooltip_circle = vis.tooltip.selectAll('.tooltip_point').data(tempoo_data)
                let tooltip_circleEnter = tooltip_circle.enter().append('g').attr('class', 'tooltip_point')
                tooltip_circleEnter.append('circle')
                tooltip_circleEnter.append('text')
                let tooltip_circleMerge = tooltip_circleEnter.merge(tooltip_circle)
                tooltip_circleMerge.select('circle')
                    .attr('r', 4)
                    .attr('fill', 'red')
                    .attr('transform', d => `translate(${(vis.xScale_detail(d.date))},${(vis.yScale_detail(d.price))})`)
                tooltip_circleMerge.select('text')
                    .attr('font-size', '12')
                    .attr('fill', 'white')
                    .attr('transform', d => `translate(${vis.xScale_detail(d.date)},${(vis.yScale_detail(d.price))})`)
                    .text(d => d.price)

                tooltip_circle.exit().remove()
            })


        vis.xAxisG_detail
            .call(vis.xAxis_detail)
            .call(g => g.select('.domain').remove())


        vis.xAxisG_overview
            .call(vis.xAxis_overview)



        vis.yAxisG
            .call(vis.yAxis_detail)
            .call(g => g.select('.domain').remove())

        // Update the brush and define a default position
        const defaultBrushSelection = [vis.xScale_detail(new Date('2019-01-01')), vis.xScale_detail.range()[1]];
        vis.brushG
            .call(vis.brush)
            .call(vis.brush.move, defaultBrushSelection);



    }


    /**
     * React to brush events
     */
    brushed(selection) {
        let vis = this;

        // Check if the brush is still active or if it has been removed
        if (selection) {
            // Convert given pixel coordinates (range: [x0,x1]) into a time period (domain: [Date, Date])
            const selectedDomain = selection.map(vis.xScale_overview.invert, vis.xScale_overview);

            // Update x-scale of the focus view accordingly
            vis.xScale_detail.domain(selectedDomain);
        } else {
            // Reset x-scale of the focus view (full time period)
            vis.xScale_detail.domain(vis.xScale_overview.domain());
        }


        // Redraw line and update x-axis labels in focus view
        vis.renderLine(vis.drawing_area,Object.keys(vis.selected_stock_data),vis.xScale_detail,vis.yScale_detail,true)
        vis.xAxisG_detail.call(vis.xAxis_detail);
    }

}