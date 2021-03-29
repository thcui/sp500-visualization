let companies  = [];
let marketCap = [];
let industry = [];
let names = [];
d3.csv('data/marketcap_preprocessed.csv').then(data =>{
    data.forEach(d =>{
        companies.push(d.symbol);
        names.push(d.name);
        marketCap.push(d.marketcap);
        industry.push(d.sector);
    });
});
// load csv and parse to json format
d3.csv('data/preprocessed_data.csv').then(data => {
    data.forEach(d => {
        d.marketcap = +d.marketcap;
    });
    let stockData = {};
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
    let stockIndex = {};
    for(var i  = 0; i< industry.length; i++){
        let sector = industry[i];
        let sectorData = data.filter(d => d.sector === sector);
        sectorData = d3.rollup(sectorData, v => d3.sum(v, d=>d.Adj_Close), (d) => d.Date);
        let obj = {}
        obj['historical']={}
        obj['symbol']=sector+" sector in total"
        obj['name']=sector+" sector in total"
        obj['sector']=sector
        let mut=1
        // if(sector==="Information Technology"){mut=0.2748}
            // if(sector==="Health Care"){mut=0.1458}
            // if(sector==="Consumer Discretionary"){mut=0.1118}
            // if(sector==="Communication Services"){mut=0.1090}
            // if(sector==="Financials"){mut=0.0989}
            // if(sector==="Industrials"){mut=0.079}
            // if(sector==="Consumer Staples"){mut=0.0705}
            // if(sector==="Utilities"){mut=0.0313}
            // if(sector==="Real Estate"){mut=0.0280}
            // if(sector==="Materials"){mut=0.0256}
            // if(sector==="Energy"){mut=0.0253}
            // if(sector==="Utilities"){mut=0.1458}

        for(let [key, value] of sectorData){
           obj['historical'][key]={}
           obj['historical'][key]["price"]= value*mut;
        }
        stockIndex[sector] = obj;

    }
    console.log(JSON.stringify(stockIndex));
});
