const parseTime = d3.timeParse("%Y-%m-%d");

//把需要linechart显示的股票的symbol放入这个list
let selected_stock_code = ['TEST', 'TEST2', 'AAP', 'AAPL', 'ABBV', 'ABC', 'ABMD', 'ABT']

d3.csv('data/industryMC.csv').then(data => {
    data.forEach(d => {
        d.marketcap = +d.marketcap;
    });
  //  data = d3.rollup(data, v => d3.sum(v, d=>d.marketcap), (d) => d.sector);
    let treeMap = new TreeMap({ parentElement: "#treeMap" }, data);
    let lineChart = new LineChart({parentElement: '#lineChart',}, data);

});
