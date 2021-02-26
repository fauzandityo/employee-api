const moment = require('moment');

module.exports = {
    randomTime: (absDate, startHour, endHour) => {
        var date = new Date(absDate);
        date.setHours(0);
        date.setMinutes(0);
        date.setSeconds(0);
        var hour = startHour + Math.random() * (endHour - startHour) | 0;
        var minutes = 0 + Math.random() * (59 - 0) | 0;
        var seconds = 0 + Math.random() * (59 - 0) | 0;
        date.setHours(hour);
        date.setMinutes(minutes);
        date.setSeconds(seconds);
        return date;
    }
}