// Function to clear the svgArea
function clearSVG() {
    var svgArea = d3.select("body").select("svg");
    if (!svgArea.empty()) {
        svgArea.remove();
    }
}

// Wrapper function to automatically resize the chart
function makeResponsive() {

    // Empty svgArea when the browser loads
    clearSVG();

    // Set chart parameters
    var svgWidth = parseInt(d3.select("#scatter").style("width"));
    var svgHeight = parseInt(d3.select("#scatter").style("height"));
    var margin = {top: 40, right: 40, bottom: 100, left: 100};
    var chartWidth = svgWidth - margin.right - margin.left;
    var chartHeight = svgHeight - margin.top - margin.bottom;
    var chosenXAxis = "poverty";
    var chosenYAxis = "healthcare";

    // Create SVG wrapper
    var svg = d3.select("#scatter")
                .append("svg")
                .attr("width", svgWidth)
                .attr("height", svgHeight);

    // Append svg group and shift by margins
    var chartGroup = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Function used for updating x-scale var upon click on axis label
    function getXScale(data, chosenXAxis) {
        var xLinearScale = d3.scaleLinear()
            .domain([d3.min(data, d => d[chosenXAxis] * 0.9), d3.max(data, d => d[chosenXAxis])])
            .range([0, chartWidth]);
        return xLinearScale;
    }

    // Function used for updating y-scale var upon click on axis label
    function getYScale(data, chosenYAxis) {
        var yLinearScale = d3.scaleLinear()
            .domain([d3.min(data, d => d[chosenYAxis] * 0.9), d3.max(data, d => d[chosenYAxis])])
            .range([chartHeight, 0]);
        return yLinearScale;
    }

    // Function used for updating xAxis var upon click on axis label
    function renderXAxis(newXScale, xAxis) {
        var bottomAxis = d3.axisBottom(newXScale);
        xAxis.transition().duration(1000).call(bottomAxis);
        return xAxis;
    }

    // Function used for updating yAxis var upon click on axis label
    function renderYAxis(newYScale, yAxis) {
        var leftAxis = d3.axisLeft(newYScale);
        yAxis.transition().duration(1000).call(leftAxis);
        return yAxis;
    }

    // Function used for updating circles group upon click on x axis label
    function renderXCircles(circlesGroup, newXScale, chosenXAxis) {
        circlesGroup.transition().duration(1000)
            .attr("cx", d => newXScale(d[chosenXAxis]));
        return circlesGroup;
    }

    // Function used for updating circles group upon click on y axis label
    function renderYCircles(circlesGroup, newYScale, chosenYAxis) {
        circlesGroup.transition().duration(1000)
            .attr("cy", d => newYScale(d[chosenYAxis]));
        return circlesGroup;
    }

    // Function used for updating state abbr group upon click on x axis label
    function renderXStateText(stateTextGroup, newXScale, chosenXAxis) {
        stateTextGroup.transition().duration(1000)
            .attr("x", d => newXScale(d[chosenXAxis]));
        return stateTextGroup;
    }

    // Function used for updating state abbr group upon click on x axis label
    function renderYStateText(stateTextGroup, newYScale, chosenYAxis) {
        stateTextGroup.transition().duration(1000)
            .attr("y", d => newYScale(d[chosenYAxis]));
        return stateTextGroup;
    }

    // Function used for updating circles group with new tooltip
    function updateToolTip(circlesGroup, stateTextGroup, chosenXAxis, chosenYAxis) {

        // Change labels depending on the axes selected
        var xLabel;
        switch (chosenXAxis) {
            case "poverty":
                xLabel = "% in poverty";
                break;
            case "age":
                xLabel = "median age";
                break;
            case "income":
                xLabel = "median household income";
                break;
        }
        console.log("xLabel: ", xLabel);
        var yLabel;
        switch (chosenYAxis) {
            case "healthcare":
                yLabel = "% lacks healthcare";
                break;
            case "smokes":
                yLabel = "% smokes";
                break;
            case "obesity":
                yLabel = "% obese";
                break;
        }
        console.log("yLabel: ", yLabel);

        // Create toolTip
        var toolTip = d3.tip()
                        .attr("class", "d3-tip")
                        .offset([-10, 0])
                        .html(d => `${d.state}<br>${xLabel}: ${d[chosenXAxis]}<br>${yLabel}: ${d[chosenYAxis]}`);
        circlesGroup.call(toolTip);

        // Event listeners for toolTip
        circlesGroup.on("mouseover", toolTip.show)
                    .on("mouseout", toolTip.hide);
        stateTextGroup.on("mouseover", toolTip.show)
                    .on("mouseout", toolTip.hide);
        
        return circlesGroup;
    }

    // Retrieve data from the csv file and create chart
    d3.csv("assets/data/data.csv").then(data => {

        // Parse data
        data.forEach( d => {
            d.poverty = +d.poverty;
            d.age = +d.age;
            d.income =+d.income;
            d.healthcare = +d.healthcare;
            d.smokes = +d.smokes;
            d.obesity = +d.obesity;
        })
    
        // Create xLinearScale function
        var xLinearScale = getXScale(data, chosenXAxis);

        // Create yLinearScale function
        var yLinearScale = getYScale(data, chosenYAxis);

        // Create initial axis functions
        var bottomAxis = d3.axisBottom(xLinearScale);
        var leftAxis = d3.axisLeft(yLinearScale);

        // Append x axis
        var xAxis = chartGroup.append("g")
            .attr("transform", `translate(0, ${chartHeight})`)
            .call(bottomAxis);
    
        // Append y axis
        var yAxis = chartGroup.append("g").call(leftAxis);

        // Append initial circles
        var circlesGroup = chartGroup.selectAll("circle")
            .data(data)
            .enter()
            .append("circle")
            .classed("stateCircle", true)
            .attr("cx", d => xLinearScale(d[chosenXAxis]))
            .attr("cy", d => yLinearScale(d[chosenYAxis]))
            .attr("r", 13);
        
        // Append initial state abbreviations inside circles
        var stateTextGroup = chartGroup.selectAll()
            .data(data)
            .enter()
            .append("text")
            .classed("stateText", true)
            .attr("x", d => xLinearScale(d[chosenXAxis]))
            .attr("y", d => yLinearScale(d[chosenYAxis]))
            .text(d => d.abbr);

        // Append initial tooltips
        circlesGroup = updateToolTip(circlesGroup, stateTextGroup, chosenXAxis, chosenYAxis);

        // Create group for 3 x-axis labels
        var xLabelsGroup = chartGroup.append("g")
            .attr("transform", `translate(${chartWidth / 2}, ${chartHeight + 20})`);
        var povertyLabel = xLabelsGroup.append("text")
            .attr("x", 0)
            .attr("y", 20)
            .attr("value", "poverty") // value to grab for event listener
            .classed("aText active", true)
            .text("In Poverty (%)");
        var ageLabel = xLabelsGroup.append("text")
            .attr("x", 0)
            .attr("y", 45)
            .attr("value", "age") // value to grab for event listener
            .classed("aText inactive", true)
            .text("Age (Median)");
        var incomeLabel = xLabelsGroup.append("text")
            .attr("x", 0)
            .attr("y", 70)
            .attr("value", "income") // value to grab for event listener
            .classed("aText inactive", true)
            .text("Household Income (Median)");

        // Create group for 3 y-axis labels
        var yLabelsGroup = chartGroup.append("g")
            .attr("transform", `rotate(-90)`);
        var healthcareLabel = yLabelsGroup.append("text")
            .attr("y", -35)
            .attr("x", -chartHeight/2)
            .attr("value", "healthcare") // value to grab for event listener
            .classed("aText active", true)
            .text("Lacks Healthcare (%)");
        var smokesLabel = yLabelsGroup.append("text")
            .attr("y", -60)
            .attr("x", -chartHeight/2)
            .attr("value", "smokes") // value to grab for event listener
            .classed("aText inactive", true)
            .text("Smokes (%)");
        var obeseLabel = yLabelsGroup.append("text")
            .attr("y", -85)
            .attr("x", -chartHeight/2)
            .attr("value", "obesity") // value to grab for event listener
            .classed("aText inactive", true)
            .text("Obese (%)");

        // x axis labels event listener
        xLabelsGroup.selectAll(".aText").on("click", function() {
            // Get value of selection
            var value = d3.select(this).attr("value");
            if (value !== chosenXAxis) {
                // Replace chosenXAxis with value
                chosenXAxis = value;
                // Update x scale for new data
                xLinearScale = getXScale(data, chosenXAxis);
                // Update x axis with transition
                xAxis = renderXAxis(xLinearScale, xAxis);
                // Update circles with new x values
                circlesGroup = renderXCircles(circlesGroup, xLinearScale, chosenXAxis);
                // Update state abbreviations inside circles
                stateTextGroup = renderXStateText(stateTextGroup, xLinearScale, chosenXAxis);
                // Update tooltips with new info
                circlesGroup = updateToolTip(circlesGroup, stateTextGroup, chosenXAxis, chosenYAxis);
                // Change classes to change bold text
                switch (chosenXAxis) {
                    case "poverty":
                        povertyLabel.classed("active", true).classed("inactive", false);
                        ageLabel.classed("active", false).classed("inactive", true);
                        incomeLabel.classed("active", false).classed("inactive", true);
                        break;
                    case "age":
                        povertyLabel.classed("active", false).classed("inactive", true);
                        ageLabel.classed("active", true).classed("inactive", false);
                        incomeLabel.classed("active", false).classed("inactive", true);
                        break;
                    case "income":
                        povertyLabel.classed("active", false).classed("inactive", true);
                        ageLabel.classed("active", false).classed("inactive", true);
                        incomeLabel.classed("active", true).classed("inactive", false);
                        break;
                }
            }
        });
        // y axis labels event listener
        yLabelsGroup.selectAll(".aText").on("click", function() {
            // Get value of selection
            var value = d3.select(this).attr("value");
            console.log("value:", value);
            if (value !== chosenYAxis) {
                // Replace chosenYAxis with value
                chosenYAxis = value;
                console.log("chosenYAxis:", chosenYAxis);
                // Update y scale for new data
                yLinearScale = getYScale(data, chosenYAxis);
                // Update y axis with transition
                yAxis = renderYAxis(yLinearScale, yAxis);
                // Update circles with new x values
                circlesGroup = renderYCircles(circlesGroup, yLinearScale, chosenYAxis);
                // Update state abbreviations inside circles
                stateTextGroup = renderYStateText(stateTextGroup, yLinearScale, chosenYAxis);
                // Update tooltips with new info
                circlesGroup = updateToolTip(circlesGroup, stateTextGroup, chosenXAxis, chosenYAxis);
                // Change classes to change bold text
                switch (chosenYAxis) {
                    case "healthcare":
                        healthcareLabel.classed("active", true).classed("inactive", false);
                        smokesLabel.classed("active", false).classed("inactive", true);
                        obeseLabel.classed("active", false).classed("inactive", true);
                        break;
                    case "smokes":
                        healthcareLabel.classed("active", false).classed("inactive", true);
                        smokesLabel.classed("active", true).classed("inactive", false);
                        obeseLabel.classed("active", false).classed("inactive", true);
                        break;
                    case "obesity":
                        healthcareLabel.classed("active", false).classed("inactive", true);
                        smokesLabel.classed("active", false).classed("inactive", true);
                        obeseLabel.classed("active", true).classed("inactive", false);
                        break;
                }
            }
        });
    })
}

makeResponsive();
d3.select(window).on("resize", makeResponsive);
