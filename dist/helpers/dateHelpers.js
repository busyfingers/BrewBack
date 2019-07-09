"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getCurrentTimeStamp = function () {
    const now = new Date();
    const mm = now.getMonth() + 1; // getMonth() is zero-based
    const dd = now.getDate();
    const hh = now.getHours();
    const min = now.getMinutes();
    const ss = now.getSeconds();
    const ms = now.getMilliseconds().toString();
    const paddingDiff = 3 - ms.length;
    return `${now.getFullYear()}-${(mm > 9 ? '' : '0') + mm}-${(dd > 9 ? '' : '0') + dd} ${(hh === 0 ? '0' : '') +
        hh}:${(min > 9 ? '' : '0') + min}:${(ss > 9 ? '' : '0') + ss}.${'0'.repeat(paddingDiff) + ms}`;
};
exports.getCurrentTimeStamp = getCurrentTimeStamp;
// https://stackoverflow.com/questions/10830357/javascript-toisostring-ignores-timezone-offset#
const getLocalISOString = function (date) {
    const tzoffset = date.getTimezoneOffset() * 60000; //offset in milliseconds
    return new Date(date.getTime() - tzoffset).toISOString(); // TODO: date -> date.getTime()  OK?
};
exports.getLocalISOString = getLocalISOString;
