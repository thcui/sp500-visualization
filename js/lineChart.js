class LineChart {

    constructor(_config, _data) {
        // Configuration object with defaults
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 680,
            containerHeight: _config.containerHeight || 300,
            margin: _config.margin || {top: 20, right: 20, bottom: 20, left: 30}
        }
        this.data = _data;
        this.selected_gender_data = []
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
            .attr('height', vis.config.containerHeight);

        vis.svg.append("text")
            .attr("x", vis.config.margin.left+50)
            .attr("y", vis.config.margin.top)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .attr("font-weight", "700")
            .text("Stock Price in USD($)");


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

        vis.svg.append("text")
            .attr("class", 'axis-name')
            .attr("font-weight", "700")
            .attr('font-size', '15')
            .attr('transform', `translate(${vis.chart_width},${vis.chart_height})`)
            .text("Date");


        vis.xAxisG = vis.chart.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0,${vis.chart_height})`);

        // Add the left y-axis group
        vis.yAxisG = vis.chart.append('g')
            .attr('class', 'axis y-axis');

        vis.trackingArea = vis.chart.append('rect')
            .attr('width', vis.chart_width)
            .attr('height', vis.chart_height)
            .attr('fill', 'none')
            .attr('pointer-events', 'all');

        vis.tooltip = vis.chart.append('g')
            .attr('class', 'tooltip')
            .style('display', 'none');


        this.updateVis()
    }

    updateVis() {
        let vis = this
        // Prepare data and scales
        // vis.selected_data = vis.data.filter(function (d) {
        //     return d[document.getElementById("country-selector").value] === 1;
        // });
        // vis.filtered_data = vis.selected_data.filter(function (d) {
        //     return d.pcgdp !== null;
        // });
        vis.xScale.domain([d3.min(vis.data, d => d.Date), d3.max(vis.data, d => d.Date)]);
        vis.yScale.domain([d3.max(vis.data, d => d.Close),d3.min(vis.data, d => d.Close)])

        vis.selected_stock=['TEST','TEST2','AAP','AAPL','ABBV','ABC','ABMD','ABT']
        vis.selected_stock_data=[]
        vis.actions=[]
        for (let stock of vis.selected_stock){
            let action=()=>{
                return new Promise(resolve =>{
                d3.csv('data/'+stock+'.csv').then(_data => {
                    let data_temp = _data
                    // Convert columns to numerical values
                    data_temp.forEach(d => {
                        Object.keys(d).forEach(attr => {
                            if (attr === 'Date') {
                                d[attr] = parseTime(d[attr])
                            } else {
                                d[attr] = +d[attr]
                            }

                        });
                        // data = data.filter(d => d.start_year !== d.end_year);
                        // data.sort((a, b) => a.label - b.label);
                    })
                    vis.selected_stock_data.push(data_temp)
                    resolve()
                })})
            }
            vis.actions.push(action())
        }

        Promise.all(vis.actions).then(()=>{
            vis.points_data=[]
            for (let stock of vis.selected_stock_data){
                for (let data of stock){
                    vis.points_data.push(data)
                }

            }
            console.log([d3.min(vis.points_data, d => d.Date), d3.max(vis.points_data, d => d.Date)])
            console.log([d3.max(vis.points_data, d => d.Close),d3.min(vis.points_data, d => d.Close)])
            vis.xScale.domain([d3.min(vis.points_data, d => d.Date), d3.max(vis.points_data, d => d.Date)]);
            vis.yScale.domain([d3.max(vis.points_data, d => d.Close),d3.min(vis.points_data, d => d.Close)])// 调用Promise的all方法，传入方法数组，结束后执行then方法参数中的方法
            vis.renderVis()
        })



        // bar.then(()=>v)


        // vis.selected_gender_data_id = vis.selected_gender_data.map(d => d.id)


    }

    renderVis() {
        let vis = this
        let line = vis.drawing_area.selectAll('.line').data(vis.selected_stock_data)

        let lineEnter = line.enter().append('path')
        let lineMerge = lineEnter.merge(line)

        lineMerge.datum(d => d)
            .attr("fill", "none")
            .attr('class', 'line')
            .attr("stroke", "navy")
            .attr("stroke-width", 2)
            .attr("d", d3.line()
                .x(function (d) {
                    return vis.xScale(d.Date)
                })
                .y(function (d) {
                    return vis.yScale(d.Close)
                })
            )


        // render_stock_point(vis.points_data)

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
                .attr('cx', d => vis.xScale(d.Date))
                .attr('cy', d => vis.yScale(d.Close))
                .attr('fill', 'green')

            circle.exit().remove();
        }
            // .attr("fill", "none")
            // .attr("stroke", "#69b3a2")
            // .attr("stroke-width", 4)
            // .attr("d", d3.line()
            //     .x(function(d) { return vis.xScale(d.Date) })
            //     .y(function(d) { return vis.yScale(d.Close) })
            // )


            // function setColor(d, selection) {
            //     if (LeaderFilter!==null && LeaderFilter.id===(d.id)) {
            //         selection.each(
            //             function (d) {
            //                 d3.select(this).classed('active', true);
            //                 setSelectedColor(d, d3.select(this))
            //             }
            //         )
            //     } else {
            //         selection.each(
            //             function (d) {
            //                 d3.select(this).classed('active', false);
            //                 if (vis.selected_gender_data.length !== 0) {
            //                     setBlack_with_diff_opacity(d, d3.select(this))
            //                 } else {
            //                     setDefaultBlack(d, d3.select(this))
            //                 }
            //
            //             })
            //     }
            // }


            // function setSelectedColor(d, selection) {
            //     selection.attr("fill", "#FF9933")
            //     selection.attr('fill-opacity', '0.7');
            // }
            //
            // function setDefaultBlack(d, selection) {
            //     selection.attr('fill', 'black')
            //     selection.attr('fill-opacity', '0.7');
            //     selection.each(function () {
            //         d3.select(this.parentNode).classed('hidden', false)
            //     })
            // }
            //
            // function setBlack_with_diff_opacity(d, selection) {
            //
            //     selection.attr('fill', 'black')
            //
            //     if (vis.selected_gender_data_id.includes(d.id)) {
            //         setDefaultBlack(d, selection)
            //     } else {
            //         selection.attr('fill-opacity', '0.15');
            //         selection.each(function () {
            //             d3.select(this.parentNode).on('mouseover', null).on('mousemove', null).on('click', null)
            //             d3.select(this.parentNode).classed('hidden', true)
            //         })
            //     }
            // }


            // circleMerge.on('click', function (d) {
            //
            //     d3.select(this).each(function (d) {
            //         let previous_id=null
            //         if(LeaderFilter!==null){
            //             previous_id=LeaderFilter.id
            //             LeaderFilter=null
            //             setColor(d, d3.select('#pid'+previous_id))
            //         }
            //         if (previous_id!==d.id) {
            //             LeaderFilter=d;
            //         }
            //         setColor(d, d3.select(this).select('circle'))
            //
            //         filterData_lexis_by_scatter();// Call global function to update lexisChart
            //
            //     })
            //
            // })

            // vis.chart.selectAll('.hidden').on('mouseover', null).on('mousemove', null).on('mouseleave', null).on('click', null)
            vis.trackingArea.on('mouseenter', () => {
                vis.tooltip.style('display', 'block');
            })
                .on('mouseleave', () => {
                    vis.tooltip.style('display', 'none');
                })
            //     .on('mouseover', (event, d) => {
            //     // if (d.pcgdp !== null) {
            //     //     pcgdp = '<li>GDP/capita: ' + parseInt(d.pcgdp) + '</li>'
            //     // } else {
            //     //     pcgdp = ''
            //     // }
            //     // d3.select('#pid' + d.id).classed("point-mouse", true)
            //     d3.select('#tooltip')
            //         .style('display', 'block')
            //         .style('background', 'white')
            //         // Format number with million and thousand separator
            //         .html(`<div class="tooltip-label"></div><B>${d.Close}</B><br/>
            //
            //             </ul>`)
            // })
                .on('mousemove', (event) => {

                    // Get date that corresponds to current mouse x-coordinate
                    const xPos = d3.pointer(event, this)[0]; // First array element is x, second is y
                    const date = vis.xScale.invert(xPos);
                    vis.bisectDate = d3.bisector(d=>d.Date).left;
                    // Find nearest data point

                    let tempoo_data=[]
                    for (let stock of vis.selected_stock_data) {
                        const index = vis.bisectDate(stock, date, 1);
                        const a = stock[index - 1];
                        const b = stock[index];
                        let d = b && (date - a.Date > b.Date - date) ? b : a;
                        tempoo_data.push(d)
                    }


                    let tooltip_circle = vis.tooltip.selectAll('.tooltip_point').data(tempoo_data)
                    let tooltip_circleEnter = tooltip_circle.enter().append('g').attr('class', 'tooltip_point')
                    tooltip_circleEnter.append('circle')
                    tooltip_circleEnter.append('text')
                    let tooltip_circleMerge=tooltip_circleEnter.merge(tooltip_circle)
                    tooltip_circleMerge.select('circle')
                        .attr('r', 4)
                        .attr('fill','red')
                        .attr('transform', d=>`translate(${(vis.xScale(d.Date))},${(vis.yScale(d.Close))})`)
                    tooltip_circleMerge.select('text')
                        .attr('font-size','12')
                         .attr('transform', d=>`translate(${vis.xScale(d.Date)},${(vis.yScale(d.Close) - 15)})`)
                        .text(d=>d.Close)


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