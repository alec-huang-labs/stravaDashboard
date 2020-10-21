
function reAuthPersonal(){
    fetch(authLink, {
        method: 'post',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            client_id: '54733',
            client_secret: '94390e3fb81c4de14d55c4983dc20388cbe628ef',
            refresh_token: '0cec6481e41265ed524b13a27262b3a4a74ee797',
            grant_type: 'refresh_token'
        })
    })
    .then(response => response.json())
        .then(response => getActivities(response))
}

//response obj is passed in
function getActivities(res) {
    const activities_link = `https://www.strava.com/api/v3/athlete/activities?access_token=${res.access_token}&per_page=200`;
    //provide fetch() with the path to the resource you want to fetch
    fetch(activities_link)
        //if the fetch is successful, Promise obj is returned: Promise {status: "resolved", result: [Object, Object, ...] (88)} 
        .then(res => res.json())
        //if the data is successfully read & parsed through using json(), the data in json is passed into activityData which executes the following function 
        .then(activityData => {
            //work with the MapBox Api to pull a map from their database 
            const mbAttr = 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
            '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
            'Imagery &copy; <a href="https://www.mapbox.com/">Mapbox</a>',
            mbUrl = 'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYWxlYy1odWFuZy1sYWJzIiwiYSI6ImNrZzgzNnR0bjBkOWUycHBtYWVrOWRwa24ifQ.XF-6fJrDm7L_LLQcnE-VOw';
            var grayscale   = L.tileLayer(mbUrl, {id: 'mapbox/dark-v10', tileSize: 512, zoomOffset: -1,detectRetina: true, attribution: mbAttr})
            //using the Leaflet.js library, create a map obj
            var map = L.map('map', {
                center: [40.77508184, -73.9525795],
                zoom: 13,
                layers: [grayscale]
            });
            console.log(activityData.length)
            console.log(activityData)
            let numRuns = activityData.length;
            let paceArr = []
            for(let i = 0; i < activityData.length; i ++){
                //summary_polyline is a series of encoded lat & lng coordinates that represents your running path
                //we're going to decode it into an array of coordinate objs 
                let coordinates = L.Polyline.fromEncoded(activityData[i].map.summary_polyline).getLatLngs();
                //string the coordinates together to form a polyline when strung together. then add it to our map
                L.polyline(
                    coordinates,{
                        color:"red",
                        weight: 3,
                        opacity: 0.25
                    }
                ).addTo(map)
                let distance = activityData[i].distance;
                let time = activityData[i].moving_time;
                paceArr.push([new Date(activityData[i].start_date), paceConverter(distance, time)])
            }
            var tooltip = d3.select("body").append("div").attr("class", "toolTip");
            //dimensions of svg canvas
            const horizontalPad = 30;
            const verticalPad = 30;
            const w = 600 - horizontalPad;
            const h = 675;
            console.log(w);
            //x & y scale
            const xScale = d3.scaleTime()
                                .domain([new Date(activityData[0].start_date), new Date(activityData[activityData.length - 1].start_date)])
                                .range([w - horizontalPad, horizontalPad]);
            const yScale = d3.scaleLinear()
                                .domain([5,12])
                                .range([verticalPad, h-verticalPad]);
            //svg canvas
            const canvas = d3.select("#scatter")
                                    .append("svg")
                                    .attr("width", w)
                                    .attr("height", h)
                                    .attr("class", "scatter-bg")
                                    .attr("align", "center")
            //x & y axis
            const xAxis = d3.axisBottom(xScale)
                            .ticks(5)
            const yAxis = d3.axisLeft(yScale)  
                            //.tickFormat(d3.timeFormat("%I"))           
            //appending x & y axis
            canvas.append("g")
                    .attr("transform", "translate(0," + (h - horizontalPad) + ")")
                    .attr("class", "axis")
                    .call(xAxis)
            canvas.append("g")
                    .attr("transform", "translate(" + horizontalPad + ", 0)")
                    .attr("class", "axis")
                    .call(yAxis)
            canvas.append("text")
                    .attr("transform", "rotate(-90)")
                    .attr('x', -135)
                    .attr('y', 50)
                    .attr("font-size", "12px")
                    .text('Pace (mins/mile)')
                    .attr("class", "axis-label");
            canvas.append("text")
                    .attr('x', w-horizontalPad - 20)
                    .attr('y', h-verticalPad - 10)
                    .attr("font-size", "12px")
                    .text('Date')
                    .attr("class", "axis-label");
            canvas.append("text")
                    .attr('x', 225) 
                    .attr('y', 20)
                    .attr("class", "graph-title")
                    .text("Pace on Each Run")
            canvas.selectAll("circle")
                    .data(paceArr)
                    .enter()
                    .append("circle")
                    .attr("cx", (d) => xScale(d[0]))
                    .attr("cy", (d) => yScale(d[1]))
                    .attr("r", (d) => 3)
                    .on("mousemove", function(d) {
                        tooltip
                            .style("left", d3.event.pageX + "px")
                            .style("top", d3.event.pageY + 20 + "px")
                            .style("display", "inline-block")
                            .html( shortDate(d[0]) + "<br>" + Math.floor(d[1]) + ' Mins ' + Math.floor((d[1]%1) * 60) + ' Seconds ');
                    })
                    .on("mouseout", function(d){
                        tooltip.style("display", "none")
                    })
            });       
}
reAuthPersonal();

