class TreeMap {
    constructor(_config, _data) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: 646,
            containerHeight: 380,
            margin: {top: 15, right: 10, bottom: 10, left: 15},
        };
        this.data = _data
        this.initVis();
    }

    initVis() {
        let vis = this;
        vis.color = d3.scaleOrdinal()
            .domain(["Industrials", "Health Care", "Information Technology", "Communication Services",
                "Consumer Discretionary", "Utilities", "Financials", "Materials", "Real Estate",
                "Consumer Staples", "Energy"])
            .range(["#ED8936", "#2F855A", "#3182CE", "#702459", "#805AD5", "#FC8181", "#C53030",
                "#C4C4C4", "#81E6D9", "#B7791F", "#E0CE61"]);
        vis.svg = d3
            .select(vis.config.parentElement)
            .attr("width", vis.config.containerWidth)
            .attr("height", vis.config.containerHeight)

        vis.innerWidth = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.innerHeight = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;
        vis.chartArea = vis.svg
            .append("g")
            .attr("transform", `translate(${vis.config.margin.left},${vis.config.margin.top})`);


        vis.sector_data = Object.values(companies)
        vis.sector={}


        vis.name_size_scale= d3.scaleLinear()
            .range([0, 10])
            .domain([0,d3.max(vis.sector_data.map(v=>v.marketcap))])

        for (let sector of ["Industrials", "Health Care", "Information Technology", "Communication Services",
            "Consumer Discretionary", "Utilities", "Financials", "Materials", "Real Estate",
            "Consumer Staples", "Energy"]){
            vis.sector[sector]=vis.sector_data.filter(v=>v.sector===sector).map(v=>{return {'text':v.name,'value':vis.name_size_scale(v.marketcap)}})

        }
        vis.renderVis()

    }






    updateVis(){}

    renderVis(){
        let vis = this;
        // stratify the data: reformatting for d3.js
        let data = vis.data;
        var root = d3.stratify()
            .id(function (d) {
                return d.sector;
            })   // Name of the entity (column name is name in csv)
            .parentId(function (d) {
                return d.parent;
            })   // Name of the parent (column name is parent in csv)
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
        vis.svg
            .selectAll("rect")
            .data(root.leaves())
            .enter()
            .append("rect")
            .attr("class","treeBlock")
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
            .style("fill", function(d){ return vis.color(d.data.sector)})
            .on("mouseover",this.showToolTip)
            .on("mouseout",this.hideToolTip)
<<<<<<< HEAD
            .on("click", this.selectSector)
=======
            .on("click", this.selectSector);
>>>>>>> master

        // and to add the text labels
        vis.svg
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
            .append("svg")
            .attr("width", d=>d.x1 - d.x0)
            .attr("height", d=>d.y1 - d.y0)
            .each(function (d){
                vis.layout=d3.layout.cloud()
                    .size([d.x1 - d.x0-30, d.y1 - d.y0-20])
                    .words(vis.sector[d.id].map(function(v) {
                        return Object.create(v) }))
                    .padding(0)
                    .rotate(() => 0)
                    .font("sans-serif")
                    .fontSize(d => Math.sqrt(d.value))
                    .on("word", ({size, x, y, rotate, text}) => {
                        vis.svg
                            .append("g")
                            .attr('transform', `translate(${d.x0-20},${d.y0+20})`)
                            .append("text")
                            .attr("font-size", size)
                            .style("fill", "#C0C0C0")
                            .attr("transform", `translate(${x},${y}) rotate(${rotate})`)
                            .text(text);
                    });
                // .on("end",  function (v){vis.draw(v,vis,d.x0,d.y0)})
                vis.layout.start();})

    }
    showToolTip(e,d){
        const formatMarketCap = number => d3.format('.3s')(number).replace('G','Billions').replace('T','Trillions')
        let num = formatMarketCap(d.data.marketcap);
        d3.select('#tooltip')
            .style("display", "block")
            .style("top", e.pageY +20+ "px")
            .style("left", e.pageX + 20+"px")
            .html(`<strong>${d.data.sector}</strong>
              <div><i>Amount of Market Capitalization:</i></div>
              <div> ${num}  USD</div>
               `);
        d3.select


    }
    hideToolTip() {
        d3.select("#tooltip").style("display", "none");
    }
    selectSector(e,d){
        console.log(d.data.sector);
        if(sectorFilter.includes(d.data.sector)){
            d3.select(this).classed("selected", false);
            sectorFilter = [];
        }else{
            d3.select(".treeBlock.selected").classed("selected", false);
            d3.select(this).classed("selected", true);
            sectorFilter = [d.data.sector]
        }
        filterSector();
    }
    showToolTip(e,d){
        const formatMarketCap = number => d3.format('.3s')(number).replace('G','Billions').replace('T','Trillions')
        let num = formatMarketCap(d.data.marketcap);
        d3.select('#tooltip')
            .style("display", "block")
            .style("top", e.pageY +20+ "px")
            .style("left", e.pageX + 20+"px")
            .html(`<strong>${d.data.sector}</strong>
              <div><i>Amount of Market Capitalization:</i></div>
              <div> ${num}  USD</div>
               `);
        d3.select


    }
    hideToolTip() {
        d3.select("#tooltip").style("display", "none");
    }
    selectSector(e,d){
        console.log(d.data.sector);
        if(sectorFilter.includes(d.data.sector)){
            d3.select(this).classed("selected", false);
            sectorFilter = [];
        }else{
            d3.select(".treeBlock.selected").classed("selected", false);
            d3.select(this).classed("selected", true);
            sectorFilter = [d.data.sector]
        }
        filterSector();
    }

    draw(words,vis,x,y) {
        let layout=vis.layout

        vis.svg.append("g")
            .attr('transform', `translate(${x+ layout.size()[0] / 2},${y+ layout.size()[1] / 2})`)
            .selectAll("text")
            .data(words)
            .enter()
            .append("text")
            .style("font-size", function(d) { return d[1]; })
            .style("fill", "#dddddd")
            .attr("transform", function(d) {
                return "translate(" + [x, y] + ")";
            })
            .text(function(d) { return d[0] });
    }
}