function load_clubs() {
    var clubSelect = document.getElementById("club");

    var clubReq = new XMLHttpRequest();
    clubReq.onload = function(e) {
        clubs = JSON.parse(clubReq.responseText);
        for (c in clubs) {
            club = clubs[c];
            if (club.nom == 'admin') continue;
            var option = document.createElement("option");
            option.value = club.id;
            option.text = club.nom;
            clubSelect.appendChild(option);
        }
    }

    clubReq.open("get", "/backend/pull_club_list.php", true);
    clubReq.send();
}

load_clubs();


var fields = ["nom", "prenom", "ddn", "courriel", "adresse", "ville", "code_postal", "tel", "affiliation", "carte_resident", "nom_recu_impot", "tel_contact_urgence", "sexe", "grade"]
var key_fields = ["nom", "prenom", "ddn"];

// note to self: can get the range like this:
// var r = XLSX.utils.decode_range(workbook.Sheets[sheetName]["!ref"]);
// r.s.r += parseInt(headers.value);
// and then re-encode it by calling XLSX.utils.encode_range(r).
                
function to_json(workbook) {
    var result = {};
    workbook.SheetNames.forEach(function(sheetName) {
        var roa = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName], {range:0});
        if(roa.length > 0){
            result[sheetName] = roa;
        }
    });
    return result;
}

function to_csv(workbook) {
    var result = [];
    workbook.SheetNames.forEach(function(sheetName) {
        var csv = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]);
        if(csv.length > 0){
            result.push("SHEET: " + sheetName);
            result.push("");
            result.push(csv);
        }
    });
    return result.join("\n");
}

var observedColumns = [];
var selects = [];
var all_clients;

var guid = 0;
function getGUID() {
    guid++;
    return guid;
}

function to_import(workbook) {
    workbook.SheetNames.forEach(function(sheetName) {
        all_clients = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName], {range:0});

        var observedColumnsSet = {};
        observedColumns = [];
        for (var r in all_clients) {
            for (var c in all_clients[r]) {
                if (all_clients[r].hasOwnProperty(c)) {
                    cc = c;
                    if (!(cc in observedColumnsSet)) {
                        observedColumns.push(cc);
                        observedColumnsSet[cc] = true;
                    }
                }
            }
        }
        // result.push(observedColumns.join(":"));

        var selectsDiv = document.getElementById("selects");
        selects = [];
        while (selectsDiv.firstChild) {
            selectsDiv.removeChild(selectsDiv.firstChild);
        }
        for (c in observedColumns) {
            var cc = observedColumns[c];
            var newSelectLabel = document.createElement("label");
            newSelectLabel.appendChild(document.createTextNode(cc));
            var newSelect = document.createElement("select");
            newSelect.id = cc;
            selects.push(newSelect);
            newSelectLabel["for"] = newSelect;

            var row = document.createElement("tr");
            var d0 = document.createElement("td");
            d0.appendChild(newSelectLabel);
            var d1 = document.createElement("td");
            d1.appendChild(newSelect);
            row.appendChild(d0);
            row.appendChild(d1);
            selectsDiv.appendChild(row);

            var nilOption = document.createElement("option");
            newSelect.appendChild(nilOption);
            for (var i = 0; i < fields.length; i++) {
                var option = document.createElement("option");
                option.value = fields[i];
                option.text = fields[i];
                newSelect.appendChild(option);
            }
        }

        var go = document.getElementById("go");
        go["disabled"] = false;
    });
}

function convert(e) {
    var clubs = document.getElementById("club");
    var current_club = clubs[clubs.selectedIndex].value;

    // make sure that we have the key fields assigned
    var key_field_selects = {}, field_selects = {};
    for (kf in key_fields) {
        var kft = key_fields[kf];
        var found = false;
        for (s in selects) {
            var ss = selects[s];
            if (kft == ss.options[ss.selectedIndex].value) {
                key_field_selects[kft] = s;
                found = true;
                break;
            }
        }
        if (!found) {
            alert("Champ obligatoire: "+kft);
            return;
        }
    }

    // build up mapping for all fields, also
    for (f in fields) {
        var ft = fields[f];
        for (s in selects) {
            var ss = selects[s];
            if (ft == ss.options[ss.selectedIndex].value) {
                if (!(ft in field_selects)) {
                    field_selects[ft] = [s];
                } else {
                    field_selects[ft].push(s);
                    // TODO separate multiple mappings by custom separator
                }
            }
        }
    }
    // should refactor that to build mapping for all fields and check for key fields

    var result = [];
    for (var cl in all_clients) {
        var c = all_clients[cl];
        // TODO a query to see if c exists already and set sid appropriately
        var cReq = new XMLHttpRequest();
            var guid = Math.uuid();

        cReq.onload = function(e) {
            var confirmReq = new XMLHttpRequest();
            confirmReq.open("get", "/backend/confirm_push.php?guid="+this, true);
            confirmReq.send();
        }.bind(guid);

        cReq.open("post", "/backend/push_one_client.php", true);
        var fd = new FormData();
        fd.append("date_inscription_encoded", getDbDate()+",");
        fd.append("club_id_encoded", current_club+",");
        fd.append("saisons_encoded", saisons.value);
        // XXX must also include 'saisons' field!
        var f = {};
        for (var ss in field_selects) {
            for (var fn in field_selects[ss]) {
                var fid = selects[field_selects[ss][fn]].id;
                if (c[fid] === undefined)
                    c[fid] = "";
                if (f[ss])
                    f[ss] = c[fid] + " " + f[ss] + " ";
                else
                    f[ss] = c[fid];

                if (ss == 'ddn') {
                    // convert date format if necessary
                    var xlDateRE=/^(\d*)-(\w*)-(\d*)$/;
                    var altDateRE=/^(\d*)\/(\d*)\/(\d*)$/;
                    if (c[fid].search(xlDateRE) == 0) {
                        date_bits = xlDateRE.exec(c[fid]);
                        f[ss] = dbEncode(date_bits[1], xlMonthToNum(date_bits[2]), date_bits[3]);
                    } else if (c[fid].search(altDateRE) == 0) {
                        date_bits = altDateRE.exec(c[fid]);
                        f[ss] = dbEncode(date_bits[3], date_bits[1], date_bits[2]);
                    }
                }
                if (ss == 'grade') {
                    var today = new Date();
                    fd.append('grades_encoded', c[fid]);
                    fd.append('grade_dates_encoded', getDbDate());
                }
                // XX hack
                //if (fn == 2)
                //f[ss] += "/";
            }
            fd.append(ss, f[ss]);
        }
        fd.append("guid", guid);

        cReq.send(fd);
    }
}

var xlf = document.getElementById('xlf');
function handleFile(e) {
    var files = xlf.files;
    var i,f;
    for (i = 0, f = files[i]; i != files.length; ++i) {
        var reader = new FileReader();
        var name = f.name;
        reader.onload = function(e) {
            if(typeof console !== 'undefined') console.log("onload", new Date());
            var data = e.target.result;
            xlsxworker(data, process_wb);
        };
        reader.readAsBinaryString(f);
    }
}

if(xlf.addEventListener) xlf.addEventListener('change', handleFile, false);
if(go.addEventListener) go.addEventListener('click', convert, false);
