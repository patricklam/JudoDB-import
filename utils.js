function getDate() {
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1;
    var yyyy = today.getFullYear();
    return dd + "/" + mm + "/" + yyyy;
}

function getDbDate() {
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1;
    var yyyy = today.getFullYear();
    return yyyy + "-" + mm + "-" + dd;
}

function dbEncode(year, month, day) {
    if (day < 10) day = "0" + day;
    if (month < 10) month = "0" + month;
    return year + "-" + month + "-" + day;
}

function xlMonthToNum(month) {
    if (month == 'Jan') return 1;
    if (month == 'Feb') return 2;
    if (month == 'Mar') return 3;
    if (month == 'Apr') return 4;
    if (month == 'May') return 5;
    if (month == 'Jun') return 6;
    if (month == 'Jul') return 7;
    if (month == 'Aug') return 8;
    if (month == 'Sep') return 9;
    if (month == 'Oct') return 10;
    if (month == 'Nov') return 11;
    if (month == 'Dec') return 12;
}

function fixdata(data) {
    var o = "", l = 0, w = 10240;
    for(; l<data.byteLength/w; ++l) o+=String.fromCharCode.apply(null,new Uint8Array(data.slice(l*w,l*w+w)));
    o+=String.fromCharCode.apply(null, new Uint8Array(data.slice(l*w)));
    return o;
}

function ab2str(data) {
    var o = "", l = 0, w = 10240;
    for(; l<data.byteLength/w; ++l) o+=String.fromCharCode.apply(null,new Uint16Array(data.slice(l*w,l*w+w)));
    o+=String.fromCharCode.apply(null, new Uint16Array(data.slice(l*w)));
    return o;
}

function s2ab(s) {
    var b = new ArrayBuffer(s.length*2), v = new Uint16Array(b);
    for (var i=0; i != s.length; ++i) v[i] = s.charCodeAt(i);
    return [v, b];
}

function xlsxworker(data, cb) {
    var worker = new Worker('./xlsxworker2.js');
    worker.onmessage = function(e) {
        switch(e.data.t) {
            case 'ready': break;
            case 'e': console.error(e.data.d); break;
            default: xx=ab2str(e.data).replace(/\n/g,"\\n").replace(/\r/g,"\\r"); console.log("done"); cb(JSON.parse(xx)); break;
        }
    };
    var val = s2ab(data);
    worker.postMessage(val[1], [val[1]]);
}

function get_radio_value( radioName ) {
    var radios = document.getElementsByName( radioName );
    for( var i = 0; i < radios.length; i++ ) {
        if( radios[i].checked || radios.length === 1 ) {
            return radios[i].value;
        }
    }
}

function process_wb(wb) {
    var output = "";
    switch(get_radio_value("format")) {
        case "json":
            output = JSON.stringify(to_json(wb), 2, 2);
            break;
        case "import":
            output = to_import(wb);
            break;
        default:
            output = to_csv(wb);
    }
    if(out.innerText === undefined) out.textContent = output;
    else out.innerText = output;
    if(typeof console !== 'undefined') console.log("output", new Date());
}
