const authLink = "https://www.strava.com/oauth/token"

function paceConverter(m, s){
    return (s / 60) / (m * 0.000621371192);
}

function shortDate(obj){
    let month = obj.getMonth() + 1;
    return (
      month +
      "-" +
      obj.getDate() +
      "-" +
      obj.getFullYear()
    )
  }

function getActivities(res) {
    const activities_link = `https://www.strava.com/api/v3/athlete/activities?access_token=${res.access_token}&per_page=200`;
    fetch(activities_link)
        .then((res) => res.json())
        .then(function (activityData){
            const mbAttr = 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
            '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
            'Imagery &copy; <a href="https://www.mapbox.com/">Mapbox</a>',
            mbUrl = 'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYWxlYy1odWFuZy1sYWJzIiwiYSI6ImNrZzgzNnR0bjBkOWUycHBtYWVrOWRwa24ifQ.XF-6fJrDm7L_LLQcnE-VOw';
            var grayscale   = L.tileLayer(mbUrl, {id: 'mapbox/dark-v10', tileSize: 512, zoomOffset: -1,detectRetina: true, attribution: mbAttr})
            var map = L.map('map', {
                center: [40.77508184, -73.9525795],
                zoom: 13,
                layers: [grayscale]
            });
            console.log(activityData)
            let numRuns = activityData.length;
            let paceArr = []
            for(let i=0; i<activityData.length; i++){
                //console.log(activityData[x].map.summary_polyline)
                let coordinates = L.Polyline.fromEncoded(activityData[i].map.summary_polyline).getLatLngs();
                let distance = activityData[i].distance;
                let time = activityData[i].moving_time;
                paceArr.push([new Date(activityData[i].start_date), paceConverter(distance, time)])
                //console.log(paceArr)
                L.polyline(
                    coordinates,{
                        color:"red",
                        weight: 3,
                        opacity: 0.25,
                        linkeJoin: "round"
                    }
                ).addTo(map)
            }
            console.log(paceArr);
            var tooltip = d3.select("body").append("div").attr("class", "toolTip");
            //dimensions of svg canvas
            const horizontalPad = 30;
            const verticalPad = 30;
            const w = numRuns * 7- horizontalPad;
            const h = 675;
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

//new functions to fetch club activities 
function getClub(res){
    const clubMemberLink = `https://www.strava.com/api/v3/clubs/746943/members?access_token=${res.access_token}`
    fetch(clubMemberLink)
        .then((res) => res.json())
        .then(function (memberData){
            //console.log(memeberData)
            let membersArr = [...memberData];
            for(let i = 0; i < membersArr.length; i++){
                membersArr[i].meters = 0;
                membersArr[i].time = 0;
            }
            //console.log(MembersArr)
        const clubRunLink = `https://www.strava.com/api/v3/clubs/746943/activities?access_token=${res.access_token}&page=1&per_page=200`
        fetch(clubRunLink)
            .then((res) => res.json())
            .then(function (clubData){
                //console.log(clubData)
                const startPos = clubData.map(x => x.name).indexOf("Back on Strava");
                //console.log(startPos)
                const dataAfterStart = clubData.slice(0, startPos);
                console.log(dataAfterStart)
                for(let i = 0; i < dataAfterStart.length; i++){
                    for(let j = 0; j < membersArr.length; j++){
                        if(dataAfterStart[i].athlete.firstname == membersArr[j].firstname &&
                            dataAfterStart[i].athlete.lastname == membersArr[j].lastname) {
                                membersArr[j].meters += dataAfterStart[i].distance;
                                membersArr[j].time += dataAfterStart[i].moving_time;
                                //console.log(`found: ${clubData[i].athlete.firstname}, ${clubData[i].distance}`)
                            }
                    }
                }
                console.log(membersArr);
                //array of [[Member, Distance]]
                let memberDistArr = [];
                for(let i = 0; i < membersArr.length; i++){
                    memberDistArr.push([membersArr[i].firstname+" "+membersArr[i].lastname, membersArr[i].meters * 0.000621371192])
                }
                memberDistArr.sort((a,b) => b[1] - a[1])
                console.log(`memberDistArr: ${memberDistArr}`)
                console.log(memberDistArr.map(x => x[0]))

                //make bar graph of all Member distances
                const horizontalPad = 35;
                const verticalPad = 35;
                const w = memberDistArr.length * 60 - horizontalPad;
                const h = 675;
                //d3.scaleOrdinal([[domain, ]range])
                let tickDist = [];
                for (let i = 0; i<memberDistArr.length; i++){
                    tickDist.push(i*55 + horizontalPad)
                }
                var tooltip = d3.select("body").append("div").attr("class", "toolTip");

                const xScale = d3.scaleOrdinal()
                                .domain(memberDistArr.map(x => x[0]))
                                //.range(["#C4C4C4"])
                                .range([...tickDist])
                const yScale = d3.scaleLinear()
                                .domain([Math.ceil(memberDistArr[0][1]),Math.floor(memberDistArr[memberDistArr.length-1][1])])
                                //map memberDistArr then use max and min
                                .range([verticalPad, h-verticalPad]);
                //create svg canvas for vertical bar graph
                const canvas = d3.select("#bar")
                                .append("svg")
                                .attr("width", w)
                                .attr("height", h)
                                .attr("class", "vert-bar-bg")
                const xAxis = d3.axisBottom(xScale);
                const yAxis = d3.axisLeft(yScale);
                canvas.append("g")
                    .attr("transform", "translate(0," + (h - horizontalPad) + ")")
                    .attr("class", "axis")
                    .call(xAxis)
                canvas.append("g")
                    .attr("transform", "translate(" + horizontalPad + ", 0)")
                    .attr("class", "axis")
                    .call(yAxis)
                console.log(memberDistArr.map(x => x[1]))
                const distances = memberDistArr.map(x => x[1])
                canvas.selectAll("rect")
                        .data(memberDistArr)
                        .enter()
                        .append("rect")
                        .attr("x", (d,i) => xScale(d[0]))
                        .attr("y", (d,i) => yScale(d[1]))
                        .attr("width", 10)
                        .attr("height", (d,i) => h - verticalPad -  yScale(d[1]))
                        .attr("class", "rectangles")
                        .on("mousemove", function(d) {
                            tooltip
                                .style("left", d3.event.pageX - 25 + "px")
                                .style("top", d3.event.pageY - 35 + "px")
                                .style("display", "inline-block")
                                .html(Math.floor(d[1]) + " Miles")
                        })
                        .on("mouseout", function(d){
                            tooltip.style("display", "none")
                        })
                
                        .text("Avg. Pace Per Run")
                canvas.append("text")
                        .attr('x', 200) 
                        .attr('y', 20)
                        .attr("class", "graph-title")
                        .text("Total Distance Per Runner")
                canvas.append("text")
                        .attr('x', w-horizontalPad - 250)
                        .attr('y', verticalPad + 50)
                        .attr("class", "cumulative-label")
                        .text(`Cumulative Club Miles: ${Math.floor(distances.reduce((accum, current) => accum + current))} miles`)
                canvas.append("text")
                        .attr("transform", "rotate(-90)")
                        .attr('x', -100)
                        .attr('y', 60)
                        .attr("font-size", "12px")
                        .text('Miles')
                        .attr("class", "axis-label");
                
                const memberRunTimes = [];
                for(let i = 0; i < membersArr.length; i++){
                    memberRunTimes.push([membersArr[i].firstname+" "+membersArr[i].lastname, paceConverter(membersArr[i].meters, membersArr[i].time)])
                }
                console.log(memberRunTimes);
                memberRunTimes.sort((a,b) => a[1] - b[1]);



                //make Horizontal Bar graph of all Member Paces
                horizontalPad2 = 65;
                verticalPad2 = 50;
                let tickDist2 = [];
                for (let i = 0; i < memberDistArr.length; i++){
                    tickDist2.push(i * 55 + horizontalPad2)
                }
                const yScale2 = d3.scaleOrdinal()
                                .domain(memberRunTimes.map(x => x[0]))
                                .range([...tickDist2])
                const xScale2 = d3.scaleLinear()
                                .domain([Math.floor(memberRunTimes[0][1]), Math.ceil(memberRunTimes[memberRunTimes.length-1][1])])
                                .range([horizontalPad2, w - horizontalPad2])
                const canvas2 = d3.select("#bar2")
                                .append("svg")
                                .attr("width", w)
                                .attr("height", h)
                                .attr("class", "hor-bar-bg")
                const yAxis2 = d3.axisLeft(yScale2);
                const xAxis2 = d3.axisTop(xScale2)
                                .ticks(Math.ceil(memberRunTimes[memberRunTimes.length-1][1]) - Math.floor(memberRunTimes[0][1]))
                
                //console.log(Math.ceil(memberRunTimes[memberRunTimes.length-1][1]) - Math.floor(memberRunTimes[0][1]))

                

                canvas2.append("g")
                    .attr("transform", "translate(0," + horizontalPad2 + ")")
                    .attr("class", "axis")
                    .call(xAxis2)
                canvas2.append("g")
                    .attr("transform", "translate(" + horizontalPad2 + ", 0)")
                    .attr("class", "axis")
                    .call(yAxis2)
                canvas2.append("text")
                    .attr('x', w-horizontalPad - 150)
                    .attr('y', verticalPad + 50)
                    .attr("class", "cumulative-label")
                    .text(`Pace: (mins/mile)`)
                canvas2.append("text")
                    .attr('x', 225) 
                    .attr('y', 20)
                    .attr("class", "graph-title")
                    .text("Avg. Pace of Runners")
                canvas2.selectAll("rect")
                    .data(memberRunTimes)
                    .enter()
                    .append("rect")
                    .attr("x", (d,i) => horizontalPad2)
                    .attr("y", (d,i) => yScale2(d[0]))
                    .attr("height", 10)
                    .attr("width", (d,i) => xScale2(d[1]) - horizontalPad2) //fix!
                    .attr("class", "rectangles")
                    .on("mousemove", function(d) {
                        tooltip
                            .style("left", d3.event.pageX - 25 + "px")
                            .style("top", d3.event.pageY - 35 + "px")
                            .style("display", "inline-block")
                            .html(Math.floor(d[1]) + ' Mins ' + Math.floor((d[1]%1) * 60) + ' Seconds ');
                    })
                    .on("mouseout", function(d){
                        tooltip.style("display", "none")
                    })
            })
    })
}



//"Why won’t my friends download Strava "
//68 9/21 (Why won't my friends Download Strava) - Alec H. (make this start date of cumulative miles)
//155 7/3 (clouds emoji) - Alec H.
//156 7/2 (First Half Marathon) - Jake L. 
function reAuthPersonal(){
    fetch(authLink, {
        method: 'post',
        headers: {
            'Accept': 'application/json, text/plain, */*',
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

function reAuthClub(){
    fetch(authLink, {
        method: 'post',
        headers: {
            'Accept': 'application/json, text/plain, */*',
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
        .then(response => getClub(response))
}


reAuthPersonal();
reAuthClub()

//.then(response => console.log(response.json()))