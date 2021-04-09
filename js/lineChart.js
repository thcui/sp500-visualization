class LineChart {

    constructor(_config, _data) {
        // Configuration object with defaults
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: 680,
            containerHeight: 450,
            margin: _config.margin || {top: 30, right: 45, bottom: 60, left: 40}
        }
        this.data = _data;
        this.initVis();
    }

    initVis() {
        let vis = this
        vis.current_line=null
        //Initialize the domain(time) of the plot
        vis.defaultDomain = selectedDomain;

        //Set the size of each component in the plot
        vis.title_height = 30
        vis.chart_height = vis.config.containerHeight - vis.config.margin.bottom - vis.config.margin.top - vis.title_height
        vis.chart_width = vis.config.containerWidth - vis.config.margin.right - vis.config.margin.left

        vis.margin_btw = 20
        vis.overview_chart_height = 50
        vis.overview_chart_width = vis.chart_width
        vis.detail_chart_height = vis.chart_height - vis.overview_chart_height
        vis.detail_chart_width = vis.chart_width

        // Create SVG area, initialize scales and axes
        vis.svg = d3.select(vis.config.parentElement)
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight)

        // Create chart area for the detailed view and the overview.
        vis.chart = vis.svg.append('g')
            .attr('id', 'chart')
            .attr('width', vis.chart_width)
            .attr('height', vis.chart_height)
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top + vis.title_height})`);

        //Creat the title for the line chart
        vis.svg.append("text")
            .attr("id", 'linechart_title')

        //Creat the label for the y-axis
        vis.svg.append("text")
            .attr("class", 'axis-name')
            .attr("id", 'y-axis-name')
            .attr("x", vis.config.margin.left + 50)
            .attr("y", vis.config.margin.top + vis.title_height - 10)
            .attr("text-anchor", "middle")
            .text("Stock Price in USD($)");

        //Creat the label for the x-axis
        vis.svg.append("text")
            .attr("class", 'axis-name')
            .attr('transform', `translate(${vis.chart_width},${vis.detail_chart_height + vis.title_height})`)
            .text("Date");

        // Create scales for detailed view
        vis.xScale_detail = d3.scaleTime()
            .range([0, vis.detail_chart_width]);

        vis.yScale_detail = d3.scaleLinear()
            .range([0, vis.detail_chart_height - vis.margin_btw])

        // Create scales for the overview
        vis.xScale_overview = d3.scaleTime()
            .range([0, vis.overview_chart_width]);

        vis.yScale_overview = d3.scaleLinear()
            .range([0, vis.overview_chart_height])

        //Create the x,y axis for both detailed view and overview in the line chart
        vis.create_the_axis()
        //Create the legend for the line chart
        vis.add_legend()
        //Create the area for putting different elements in the line chart
        vis.create_the_area()
        vis.last_selected_stock_data = {}
        
        vis.brushG = vis.overview_area.append('g')
            .attr('class', 'brush x-brush');

        // Initialize the brush component
        vis.brush = d3.brushX()
            .extent([[0, 0], [vis.chart_width, vis.overview_chart_height]])
            .on('brush', function ({selection}) {
                if (selection) vis.brushed(selection);
            })
            .on('end', function ({selection}) {
                if (!selection)
                    vis.brushed(null);
            });

        //Prepare the data that let us know the sector information for each company
        vis.initialize_the_sector_data()
        vis.updateVis()

    }

    updateVis() {
        let vis = this
        //Initialize the variable component in the title of the line chart
        vis.data_indicator_string = 0
        vis.axis_name = "Stock Price in USD($)"
        vis.if_animation = true

        //use the proper data based on the user's selection
        vis.import_data()

        //Set the domain for the chart based on the data
        vis.set_lineChart_domain()

        //Set the title and the axis name for the chart based on the data and time selection
        vis.update_Title_and_AxisName()

        vis.renderVis()
    }


    renderVis() {

        let vis = this

        //Set the event for moving mouse on the tracking area: the tooltip will change based on the position of the mouse pointer.
        vis.trackingArea.on('mouseenter', () => {
            vis.tooltip.style('display', 'block');
        })
            .on('mouseleave', () => {
                vis.tooltip.style('display', 'none');
            })
            .on('mousemove', function (event) {
                vis.update_tooltip(event)
            })

        //update the axis groups
        vis.xAxisG_detail
            .call(vis.xAxis_detail)
            .call(g => g.select('.domain').remove())

        vis.xAxisG_overview
            .call(vis.xAxis_overview)

        vis.yAxisG
            .call(vis.yAxis_detail)
            .call(g => g.select('.domain').remove())


        // Update the brush and define a default position
        const defaultBrushSelection = [vis.xScale_detail(selectedDomain[0]), vis.xScale_detail(selectedDomain[1])];
        vis.brushG
            .call(vis.brush)
            .call(vis.brush.move, defaultBrushSelection);

    }


    //set the domain of the line chart based on the data selected
    set_lineChart_domain() {
        let vis = this
        vis.All_date = []
        vis.All_price = []
        for (let stock of Object.values(vis.selected_stock_data)) {
            vis.All_date = vis.All_date.concat(d3.map(Object.values(stock), d => d.date))
            vis.All_price = vis.All_price.concat(d3.map(Object.values(stock), d => d.price))
        }
        vis.xScale_detail.domain([d3.min(vis.All_date), d3.max(vis.All_date)])
        vis.yScale_detail.domain([d3.max(vis.All_price), d3.min(vis.All_price)])
        vis.xScale_overview.domain(vis.xScale_detail.domain())
        vis.yScale_overview.domain(vis.yScale_detail.domain())
    }


    // React to brush events
    brushed(selection) {

        let vis = this;

        // Check if the brush is still active or if it has been removed
        if (selection) {
            let currentDomain = selection.map(vis.xScale_overview.invert, vis.xScale_overview)
            // Update x-scale of the focus view accordingly
            vis.xScale_detail.domain(currentDomain);
            if (JSON.stringify(selectedDomain) !== JSON.stringify(currentDomain)) {
                // Convert given pixel coordinates (range: [x0,x1]) into a time period (domain: [Date, Date])
                selectedDomain = currentDomain
                let from = vis.get_closest_date(selectedDomain[0], Object.values(vis.selected_stock_data))[0].date
                let end = vis.get_closest_date(selectedDomain[1], Object.values(vis.selected_stock_data))[0].date
                filterDateRange(formatTime(from), formatTime(end))
            }
        } else {
            // Reset x-scale of the focus view (full time period)
            selectedDomain = vis.xScale_overview.domain()
            vis.xScale_detail.domain(vis.xScale_overview.domain());
            filterDateRange(formatTime(vis.xScale_overview.domain()[0]), formatTime(vis.xScale_overview.domain()[1]))
        }

        vis.update_Title_and_AxisName()


        let if_animation=true
        //if the selected data is unchanged, we do not want to add animation to the line chart(such as: brush will
        //not need the animation).
        if (JSON.stringify(vis.last_selected_stock_data) === JSON.stringify(vis.selected_stock_data)) {
            if_animation = false
        }else {
            //render the default line in detailed view, which requires the information from the overview.
            vis.renderLine(vis.overview_area, Object.keys(vis.selected_stock_data), vis.xScale_overview, vis.yScale_overview, false,true)
            vis.last_selected_stock_data = vis.selected_stock_data
        }

        // Redraw line
        vis.renderLine(vis.detailedView_area, Object.keys(vis.selected_stock_data), vis.xScale_detail, vis.yScale_detail, true,if_animation)
        // update x-axis labels in focus view
        vis.xAxisG_detail.call(vis.xAxis_detail);
    }

    get_closest_date(date, data) {
        let vis = this
        // Get date that corresponds to current mouse x-coordinate
        vis.bisectDate = d3.bisector(d => d.date).right;
        let temp = []
        for (let stock of data) {
            stock = Object.values(stock)
            if (stock.length !== 0) {
                const index = vis.bisectDate(stock, date, 1);
                const a = stock[index - 1];
                const b = stock[index];
                const d = b && (date - a.date > b.date - date) ? b : a;
                temp.push(d)
            }
        }
        return temp
    }

//The function that is responsible for drawing the line on the line chart,given the target area,data to show,
// scales and if need to label the name
    renderLine(area, data, x_scale, y_scale, if_text,if_animation) {
        let vis = this

        //the function for the animation for the line chart, function needs to be created before use
        vis.transition=function transition(path) {
            let duration = 2000
            if (!if_animation) {
                duration = 0
            }
            path.transition()
                .duration(duration)
                .attrTween("stroke-dasharray", function () {
                    const l = this.getTotalLength(),
                        i = d3.interpolateString("0," + l, l + "," + l);
                    return function (t) {
                        return i(t)
                    }
                })
                .on("end", () => {
                    d3.select(this).call(
                        vis.transition
                    );
                })
        }


        let line = area.selectAll('.line').data(data)

        let lineEnter = line.enter().append('path')
        let lineMerge = lineEnter.merge(line)
        lineMerge.attr('stroke',
            d => colorScheme(vis.getSectors(d)))
            .attr('class', d => 'line ' + vis.getSectors(d).replace(' ', '_'))


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
            ).call(
            vis.transition
        );

        line.exit().remove()

        if (if_text) {
            vis.render_text(vis.chart, data, x_scale, y_scale)
        }
    }

    //add the text to the line drawn
    render_text(area, data, x_scale, y_scale) {
        let vis = this
        let text = area.selectAll('.stock_name').data(data)
        let textEnter = text.enter().append('text')
        let textMerge = textEnter.merge(text)
        let boundary_date = vis.get_closest_date(vis.xScale_detail.invert(x_scale.range()[1]), Object.values(vis.selected_stock_data))[0].date



        textMerge.text(d => d)
            .attr('fill', d => colorScheme(vis.getSectors(d)))
            .attr('stroke', 'white')
            .attr('stroke-width', '0.1')
            .attr('class', d => 'stock_name ' + vis.getSectors(d).replace(' ', '_'))



        textMerge.datum(d => Object.values(vis.selected_stock_data[d]).filter(v =>
            v.date.toDateString() === boundary_date.toDateString()))
            .attr('transform',
                d => `translate(${vis.chart_width + 40},${y_scale(d[0].price)})`)
            .attr('text-anchor', 'end')
            .attr('vertical-align', 'text-bottom')
            .attr('font-size', 12)

        textMerge.data(data)

        textMerge.on("mouseenter",vis.showToolTip)
            .on("mouseout", vis.hideToolTip)
            .each(function (d){
                if(companies_data.filter(v=>{return v.symbol===d}).length>0){
                    d3.select(this).attr("cursor", "help")
                }else {
                    d3.select(this).attr("cursor", "default")
                }
            })


        text.exit().remove()
    }


    //update the title and axis name based on the data to show
    update_Title_and_AxisName() {
        let vis = this
        vis.svg.select('#y-axis-name').text(vis.axis_name)
        vis.svg.select('#linechart_title')
            .attr("x", vis.config.margin.left + 300)
            .attr("y", vis.title_height)
            .attr("text-anchor", "middle")
            .attr('font-size', '15px')
            .attr('font-weight', 'bold')
            .text(vis.data_indicator_string + " From " + selectedDomain[0].toDateString() + " to " + selectedDomain[1].toDateString())
    }

    //add the color legend to the line chart
    add_legend() {
        let vis = this
        vis.legend = vis.svg.append('g').attr('class', 'lineChart_legend').attr('transform', `translate(50,${vis.chart_height + vis.overview_chart_height + vis.title_height})`);
        vis.sp500_legend = vis.legend.append("line")
            .attr('class', 'SP500')
            .style("stroke-width", "8")
            .attr('stroke', colorScheme('SP500'))
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", 30)
            .attr("y2", 0);

        let legend_x1 = 0
        let legend_x2 = 30
        for (let legend of ['Basket1', 'Basket2', "Industrials", "Health Care", "Information Technology", "Communication Services",
            "Consumer Discretionary", "Utilities", "Financials", "Materials", "Real Estate",
            "Consumer Staples", "Energy"]) {
            legend_x1 = legend_x2 + 10
            legend_x2 = legend_x1 + 30
            vis.sp500_legend.clone().attr('class', legend).attr("x1", legend_x1).attr("x2", legend_x2).attr('stroke', colorScheme(legend))

        }

        //Add text to the legend for the line chart
        vis.legend.append('text').text('SP500').attr('transform', `translate(0,20)`).attr('font-size', 10)
        vis.legend.append('text').text('Basket1').attr('transform', `translate(40,20)`).attr('font-size', 10)
        vis.legend.append('text').text('Basket2').attr('transform', `translate(80,20)`).attr('font-size', 10)
        vis.legend.append('text').text('Other types of the line shows the sector of the stock, color corresponding to the treemap').attr('transform', `translate(150,20)`).attr('font-size', 10)


    }

    import_data() {
        let vis = this
        vis.selected_stock_data = {}
        //check whether the user has specified which company's stock price to show
        if (selected_stock_symbol.length === 0||vis.current_line==='Sector'||vis.current_line==='SP500') {
            //no company has been specified, then check whether the user selected a sector.
            if ((sectorTotal_Data[sectorFilter[0]]&&vis.current_line===null)||vis.current_line==='Sector') {
                vis.data_indicator_string = "Sector Total Stock Price"
                vis.selected_stock_data[sectorFilter[0]] = sectorTotal_Data[sectorFilter[0]].historical
                vis.updateDataType(sectorFilter[0])
                vis.update_tab('Sector',false)

            } else {
                //the user has not selected any companies or sectors, then the we will show the sp500 index as default
                //on the line chart
                vis.data_indicator_string = "SP500 Index"
                let temp_sp500 = sp500_data
                delete temp_sp500['columns'];
                vis.selected_stock_data['SP500'] = Object.assign({}, temp_sp500)
                vis.axis_name = "SP500 index(no unit)"
                vis.update_tab('SP500',false)
            }

        } else {
            //the user has selected some companies to show stock prices
            let data = []
            selected_stock_symbol.forEach(stock_symbol => {
                //check if the basket has been activated
                if (stock_symbol === 'Basket1' || stock_symbol === 'Basket2') {
                    if (stock_symbol === 'Basket1') {
                        data = custom_data
                    } else {
                        data = custom_data2
                    }

                    let total = {}
                    data.forEach(stock_symbol => {
                        for (let i of Object.keys(stockData[stock_symbol].historical)) {
                            if (total[i]) {
                                total[i].volume = (total[i].volume) + (stockData[stock_symbol].historical[i].volume)
                                total[i].price = (total[i].price) + (+(stockData[stock_symbol].historical[i].price))
                            } else {
                                total[i] = {}
                                total[i].volume = stockData[stock_symbol].historical[i].volume
                                total[i].price = (+(stockData[stock_symbol].historical[i].price))
                            }
                        }
                    })

                    vis.selected_stock_data[stock_symbol] = total
                } else {
                    //single company's stock price
                    if (stockData[stock_symbol]) {
                        vis.selected_stock_data[stock_symbol] = stockData[stock_symbol].historical
                    }
                }
                vis.data_indicator_string = "Stock Price(s)"
                vis.updateDataType(stock_symbol)

            });
            vis.update_tab('Companies',false)
        }

        vis.current_line=null
    }

    //convert the format of the data so that we can use them
    updateDataType(stock_symbol) {
        let vis = this
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

    //create the area need for all the components on the line chart
    create_the_area() {
        let vis = this
        // Initialize clipping mask that covers the detailed view
        vis.chart.append('defs')
            .append('clipPath')
            .attr('id', 'lineChart-mask')
            .append('rect')
            .attr('width', vis.detail_chart_width)
            .attr('y', -vis.config.margin.top)
            .attr('height', vis.detail_chart_height + vis.config.margin.top);

        // Apply clipping mask to 'vis.drawing_area' to clip semicircles at the very beginning and end of a year
        vis.detailedView_area = vis.chart.append('g')
            .attr('id', 'drawing_area')
            .attr('width', vis.detail_chart_width)
            .attr('height', vis.detail_chart_height)
            .attr('clip-path', 'url(#lineChart-mask)');

        //Append the place for the overview
        vis.overview_area = vis.chart.append('g')
            .attr('id', 'overview_area')
            .attr('width', vis.overview_chart_width)
            .attr('height', vis.overview_chart_height)
            .attr('transform', `translate(0,${vis.detail_chart_height})`);

        // Initialize the tooltip
        vis.tooltip = vis.chart.append('g')
            .attr('class', 'tooltip')
            .style('display', 'none');

        // Initialize the area that will track the user's mouse event
        vis.trackingArea = vis.chart.append('rect')
            .attr('width', vis.chart_width)
            .attr('height', vis.detail_chart_height - vis.margin_btw)
            .attr('fill', 'none')
            .attr('pointer-events', 'all')
    }


    //draw the axes for both the detailed view and the overview.
    create_the_axis() {
        let vis = this
        //create the x-axis for the detailed view
        vis.xAxis_detail = d3.axisBottom(vis.xScale_detail)
            .tickSize(-vis.chart_height)
        //create the y-axis for the detailed view
        vis.yAxis_detail = d3.axisLeft(vis.yScale_detail)
            .tickSize(-vis.chart_width)
        //create the x axis for the overview
        vis.xAxis_overview = d3.axisBottom(vis.xScale_overview)
            .tickSize(1)

        // Add the left y-axis group
        vis.xAxisG_detail = vis.chart.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0,${vis.detail_chart_height - vis.margin_btw})`);
        vis.xAxisG_overview = vis.chart.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0,${vis.chart_height})`);

        // Add the left y-axis group
        vis.yAxisG = vis.chart.append('g')
            .attr('class', 'axis y-axis');
    }


    //we need to prepare some data so that we know the sectors that each company belongs to.
    initialize_the_sector_data() {
        let vis = this
        vis.sector_data =[]
        //There are some special data do not have sectors they belonged to, so we need to manually set them
        for (let special_d of ["SP500", "Basket1", "Basket2"]) {
            vis.sector_data.push({
                "symbol": special_d,
                "name": special_d,
                "sector": special_d
            })
        }
        vis.sector_data=vis.sector_data.concat(companies_data)

        //set a small helper function to easily get the sectors of
        // given company or other types of data (such as: sector itself).
        vis.getSectors = d => {
            let company = vis.sector_data.filter(v => {
                return v.symbol === d
            })[0]

            if (company) {
                return company.sector
            }
            return d
        }
    }



    //update the tooltip when the mouse is entered the tracking area, or moving on the tracking area
    update_tooltip(event) {
        let vis = this
        // Find nearest data point
        let closestDate = vis.get_closest_date(vis.xScale_detail.invert(d3.pointer(event, this.svg.node())[0] - vis.config.margin.left),
            Object.values(vis.selected_stock_data))

        let tooltip_circle = vis.tooltip.selectAll('.tooltip_point').data(closestDate)
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
    }

    update_tab(line,if_update_chart) {
        d3.select('#Sector_tab').classed('unclickable',sectorFilter.length===0)

        d3.select('#Companies_tab').classed('unclickable',selected_stock_symbol.length===0)


        // Declare all variables
        let vis=this
        var i, tabcontent, tablinks;

        // Get all elements with class="tabcontent" and hide them
        tabcontent = document.getElementsByClassName("tabcontent");
        for (i = 0; i < tabcontent.length; i++) {
            tabcontent[i].style.display = "none";
        }

        // Get all elements with class="tablinks" and remove the class "active"
        tablinks = document.getElementsByClassName("tablinks");
        for (i = 0; i < tablinks.length; i++) {
            tablinks[i].className = tablinks[i].className.replace(" active", "");
        }

        vis.current_line=line
        d3.select("#"+line+"_tab").classed("active", true)
        if(if_update_chart){
            this.updateVis()
        }


    }

    showToolTip(e, d) {
        let name
        let company=companies_data.filter(v=>{return v.symbol===d})
        if(company.length>0){
            name=company[0]['name']
            getOverview(name).then((result)=> {
                d3.select('#lineChart_tooltip')
                    .style("display", "block")
                    .style("top", e.pageY+15 + "px")
                    .style("left", e.pageX - 600 + "px")
                    .style("right", 30 + "px")
                    .html(`<strong>${name}</strong><br>${result}
               `)
            })

        }
    }
    hideToolTip() {
        d3.select("#lineChart_tooltip").style("display", "none");
    }

}