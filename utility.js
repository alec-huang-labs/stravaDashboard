
//convert meters & sec -> miles/min
function paceConverter(m, s){
    return (s / 60) / (m * 0.000621371192)
}

//convert date object to shorter string. Ex. 07-11-2020
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


const authLink = "https://www.strava.com/oauth/token";


