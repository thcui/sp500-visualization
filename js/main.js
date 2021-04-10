const parseTime = d3.timeParse("%Y-%m-%d");
const formatTime = d3.timeFormat("%Y-%m-%d");

let stockData = [];
let sectorTotal_Data = [];
let companies_data = []
let bubbleChartData = [];
let lineChart, treeMap, bubbleChart
let selected_stock_symbol = []
let sectorFilter = [];
let sp500_data = [];
let data = [];
let custom_data=[]
let custom_data2=[]
//define color scheme
let colorScheme = d3.scaleOrdinal()
    .domain(["Industrials", "Health Care", "Information Technology", "Communication Services",
        "Consumer Discretionary", "Utilities", "Financials", "Materials", "Real Estate",
        "Consumer Staples", "Energy","SP500","Basket1","Basket2"])
    .range(["#ED8936", "#2F755A", "#3182CE", "#8F2F77", "#805AD5", "#fC8181", "#C53030",
        "#718096", "#38B2AC", "#9DCC00", "#E0CE61","#FFFFFF","#dddddd","Yellow"]);
let selectedDomain = [new Date('2020-04-01'), new Date('2021-01-29')];



// Avoid promise hell, read all the data needed for this visualization
d3.json('data/companyData.json').then(_stock => {
    stockData = _stock;
    let startDate = selectedDomain[0].toISOString().split('T')[0];
    let endDate = selectedDomain[1].toISOString().split('T')[0];
    getbubbleChartData(startDate, endDate);
    return d3.json('data/sectorIndex.json')})
    .then(_sector=>{
        sectorTotal_Data=_sector
    return d3.csv('data/industryMC.csv');
}).then(_data => {
    data = _data;
    data.forEach(d => {
        d.marketcap = +d.marketcap;
    });
    return d3.csv('data/marketcap_preprocessed.csv');
}).then(_companies => {
    companies_data = _companies;
    return d3.csv('data/SP500HistoricalData.csv');
}).then(sp500_data_ => {
    sp500_data = sp500_data_;

    sp500_data_.forEach(stock => {
        Object.keys(stock).forEach(attr => {
            if (attr === 'date') {
                stock[attr] = parseTime(stock[attr]);
            }
            if (attr === 'price' || attr === 'Volume') {
                stock[attr] = +stock[attr];
            }
        });
    });

    // reset button must render before chart initialization
    d3.select("#bubbleChart-reset-button_div")
        .html(`<button id="bubbleChart-reset-button">Reset Stocks Selection</button>`);

    treeMap = new TreeMap({parentElement: "#treeMap"}, data);
    bubbleChart = new BubbleChart({parentElement: '#bubbleChart',}, bubbleChartData);
    lineChart = new LineChart({parentElement: '#lineChart',}, data);
    d3.select(".spinner_group").style("display", "none");
    d3.select(".tab").style("display", "block");

    $(() => {
        const submitSearch = () => {
            let searchValue = $('#search').val()
            let searched_company = companies_data.filter(v => {
                return v.name === searchValue
            })[0]
            if (searched_company) {
                let symbol = searched_company.symbol
                selected_stock_symbol.push(symbol)
                bubbleChart.updateVis()
                bubbleChart.focusZoom(symbol)
                lineChart.updateVis()
            }
            else {
                window.alert('No Company Found')
            }
        };
        $('#search').autocomplete({
            source: companies_data.map(v => v.name)
        });
        $('#submit').click(submitSearch);
    })


});

//compute stock price percentage change for bubble chart base on the given interval
function getbubbleChartData(start_date, end_date) {
    bubbleChartData = [];
    for (var comp of Object.keys(stockData)) {
        if (stockData[comp]["historical"][start_date] !== undefined
            && stockData[comp]["historical"][end_date] !== undefined) {
            let obj = {};
            obj["symbol"] = comp;
            obj["name"] = stockData[comp]["name"];
            obj["marketcap"] = +stockData[comp]["marketcap"];
            obj["industry"] = stockData[comp]["industry"];
            let price2 = stockData[comp]["historical"][end_date]["price"];
            let price1 = stockData[comp]["historical"][start_date]["price"];
            obj["perChange"] = (price2 - price1) / price1;
            bubbleChartData.push(obj);
        }
    }
}
//filter bubble chart based on selected sector in treemap
function filterSector_for_bubble_chart() {
    if (sectorFilter.length !== 0) {
        bubbleChart.data = bubbleChartData.filter(d => sectorFilter.includes(d.industry));
    } else {
        //no filter applied, get original data
        bubbleChart.data = bubbleChartData;
    }
    bubbleChart.updateVis();
}
// change bubble change range based on date
function filterDateRange(startDate, endDate) {
    bubbleChart.brushFlag = true;
    getbubbleChartData(startDate, endDate);
    bubbleChart.data = bubbleChartData;
    filterSector_for_bubble_chart();
}
// get company overview using api
let searchUrl = 'https://en.wikipedia.org/w/api.php?action=opensearch&format=json&origin=*&search=';
let contentUrl = "https://en.wikipedia.org/w/api.php?format=json&origin=*&action=query&prop=extracts&exintro&explaintext&redirects=1&titles="
function getOverview(comp) {
    let result
        comp = comp.replace(/\s+/g, '_').replace(/_\(Class_\w+\)/i,"")
    return new Promise((resolve,rej)=>{
    d3.json(searchUrl + comp).then(data => {
        let title = data[1][0].replace(/\s+/g, '_');
        d3.json(contentUrl+title).then(res =>{
            let page = res.query.pages;
            let pageId = Object.keys(page)[0];
            let content = page[pageId].extract;
            result=content.split("\n")[0]
            resolve(result+"<br>(From Wikipedia)")
        });
    });
  })
}
