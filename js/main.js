
const parseTime = d3.timeParse("%Y-%m-%d");
let stockData = [];
let bubbleChartData = [];
let lineChart,treeMap
let selected_stock_symbol=[]


//如何更新lineChart
//添加:
// 1.把需要lineChart显示的股票的symbol放入这个selected_stock_code:  selected_stock_symbol.push('AAPL')
// 2. lineChart.upDateVis()
//去除：
// 1. selected_stock_symbol.filter(d=>{d!==‘AAPL’})
// 2. lineChart.upDateVis()


d3.csv('data/industryMC.csv').then(data => {
    data.forEach(d => {
        d.marketcap = +d.marketcap;
    });
  //  data = d3.rollup(data, v => d3.sum(v, d=>d.marketcap), (d) => d.sector);
    treeMap = new TreeMap({ parentElement: "#treeMap" }, data);
    lineChart= new LineChart({parentElement: '#lineChart',}, data);

});

d3.json("data/companyData.json").then(function(data) {

    stockData = data;
    getbubbleChartData("2020-09-11","2020-09-18");
});
function getbubbleChartData(start_date, end_date){
    bubbleChartData = [];
    for(var comp of Object.keys(stockData)){
        if(stockData[comp]["historical"][start_date]!== undefined
            && stockData[comp]["historical"][end_date]!== undefined){
            let obj = {};
            obj["symbol"] = comp;
            obj["name"] = stockData[comp]["name"];
            obj["marketcap"] = stockData[comp]["marketcap"];
            let price2 = stockData[comp]["historical"][end_date]["price"];
            let price1 = stockData[comp]["historical"][start_date]["price"];
            obj["perChange"] = (price2 - price1) / price1;
            bubbleChartData.push(obj);
        }
    }
    console.log(bubbleChartData);
}
