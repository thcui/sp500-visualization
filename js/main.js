d3.csv('data/industryMC.csv').then(data => {
    data.forEach(d => {
        d.marketcap = +d.marketcap;
    });
  //  data = d3.rollup(data, v => d3.sum(v, d=>d.marketcap), (d) => d.sector);
    let treeMap = new TreeMap({ parentElement: "#treeMap" }, data);
});
