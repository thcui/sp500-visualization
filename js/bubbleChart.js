class BubbleChart {
    constructor(_config, _data) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: 400,
            containerHeight: 380,
            margin: {top: 45, right: 15, bottom: 20, left: 25},
        };
        this.data = _data
        this.initVis();
    }
    initVis(){}

    updateVis(){}

    renderVis(){}
}