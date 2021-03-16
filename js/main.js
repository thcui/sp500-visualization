const d3 = require("d3");
const parseTime = d3.timeParse("%Y-%m-%d");
let companies  = [];
let marketCap = [];
let industry = [];
let names = [];
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
d3.csv('data/marketcap_preprocessed.csv').then(data =>{
    data.forEach(d =>{
        companies.push(d.symbol);
        names.push(d.name);
        marketCap.push(d.marketcap);
        industry.push(d.sector);
    });

});
//const fs = require('fs');
d3.csv('data/preprocessed_data.csv').then(data => {
    data.forEach(d => {
        d.marketcap = +d.marketcap;
    });
    let stockData = {};
    console.log("hi");
    for (let i = 0; i < companies.length; i++) {
        let historical = {};
        let filterData = data;
        let companyData = {};
        filterData = filterData.filter(d => d.symbol === companies[i]);
        filterData = filterData.sort((a, b) => a.Date - b.Date);
        for(let j = 0; j < filterData.length; j++){
            let dayData = {};
            dayData["volume"] = filterData[j].Volume;
            dayData["price"] = filterData[j].Adj_Close;
            historical[filterData[j].Date] = dayData;
        }
        companyData["marketcap"] = marketCap[i];
        companyData["industry"] = industry[i];
        companyData["name"] = names[i];
        companyData["historical"] = historical;
        stockData[companies[i]] = companyData;
    }
    console.log("done");
    console.log(stockData);
    let bubbleChartData = [];
    for(var comp of Object.keys(stockData)){
        if(stockData[comp]["historical"]["2020-09-11"]!== undefined
            && stockData[comp]["historical"]["2020-09-18"]!== undefined){
            let obj = {};
            obj["symbol"] = comp;
            obj["name"] = stockData[comp]["name"];
            obj["marketcap"] = stockData[comp]["marketcap"];
            let price2 = stockData[comp]["historical"]["2020-09-18"]["price"];
            let price1 = stockData[comp]["historical"]["2020-09-11"]["price"];
            obj["perChange"] = (price2 - price1) / price1;
            bubbleChartData.push(obj);
        }
    }
    const fs = require('fs');
    fs.writeFile('./companyData.json',JSON.stringify(stockData), err =>{
        if(err){
            console.log(err);
        } else{
            console.log("successfully saved")
        }
    });
});