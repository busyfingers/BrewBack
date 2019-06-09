Date.prototype.yyyymmdd_hhmmss = function() {
    var mm = this.getMonth() + 1; // getMonth() is zero-based
    var dd = this.getDate();
    var hh = this.getHours();
    var min = this.getMinutes();
    var ss = this.getSeconds();

    return [
        this.getFullYear(),
        (mm > 9 ? '' : '0') + mm,
        (dd > 9 ? '' : '0') + dd,
        ' ',
        (hh === 0 ? '0' : '') + hh,
        (min === 0 ? '0' : '') + min,
        (ss === 0 ? '0' : '') + ss
    ].join('');
};
