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

});