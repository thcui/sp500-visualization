/**
 * Load data from CSV file asynchronously and render charts
 */
let genderFilter = null;
let LeaderFilter = null;
let data, lineChart
const parseTime = d3.timeParse("%Y-%m-%d");

d3.csv('data/TEST.csv').then(_data => {
    data = _data

    // Convert columns to numerical values
    data.forEach(d => {
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

        lineChart = new LineChart({
            parentElement: '#lineChart',
        }, data);


        // barChart = new BarChart({
        //     parentElement: '#barChart',
        //     genderFilter: genderFilter
        // }, data);
        //
        // scatterPlot = new LineChart({
        //     parentElement: '#scatterPlot',
        // }, data);
        // lexisChart.updateVis()
        // barChart.updateVis()
        // scatterPlot.updateVis()

        // d3.select('#country-selector').on('change', function () {
        //     lexisChart.updateVis()
        //     barChart.updateVis()
        //     scatterPlot.updateVis()
        // })



})

//
//
// function filterData_lexis() {
//     if (genderFilter === null) {
//         lexisChart.data = data;
//     } else {
//         lexisChart.data = data.filter(d => genderFilter === d.gender);
//     }
//     lexisChart.updateVis();
// }
//
// function filterData_by_barChart() {
//    if(LeaderFilter!==null&&LeaderFilter[document.getElementById("country-selector").value] !== 1){
//        LeaderFilter =null
//    }
//     if(LeaderFilter!==null&&genderFilter !== null&&LeaderFilter.gender !== genderFilter){
//         LeaderFilter =null
//     }
//     filterData_scatter()
//     filterData_lexis()
//     filterData_lexis_by_scatter()
// }
//
// function filterData_scatter() {
//     if (genderFilter !== null) {
//         scatterPlot.selected_gender_data = data.filter(d => genderFilter === d.gender);
//     } else {
//         scatterPlot.selected_gender_data = []
//     }
//     scatterPlot.updateVis();
// }
//
// function filterData_lexis_by_scatter() {
//     if (LeaderFilter === null) {
//         lexisChart.highlighted_data = null;
//     } else {
//         lexisChart.highlighted_data = LeaderFilter
//     }
//     lexisChart.updateVis();
// }



