var fields = ["nom", "prenom", "ddn", "courriel", "adresse", "ville", "code_postal", "tel", "affiliation", "carte_resident", "nom_recu_impot", "tel_contact_urgence", "sexe"]
var key_fields = ["nom", "prenom", "ddn"];

// note to self: can get the range like this:
// var r = XLSX.utils.decode_range(workbook.Sheets[sheetName]["!ref"]);
// r.s.r += parseInt(headers.value);
// and then re-encode it by calling XLSX.utils.encode_range(r).
				
function to_json(workbook) {
	var result = {};
	workbook.SheetNames.forEach(function(sheetName) {
		var roa = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName], {range:parseInt(headers.value)});
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

function to_import(workbook) {
	workbook.SheetNames.forEach(function(sheetName) {
		all_clients = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName], {range:parseInt(headers.value)});

		var observedColumnsSet = {};
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

function reqListener() {
	console.log(this.responseText);
}

function convert(e) {
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
				field_selects[ft] = s;
				break;
			}
		}
	}
	// should refactor that to build mapping for all fields and check for key fields

	var result = [];
	var count = 0;
	for (var cl in all_clients) {
		var c = all_clients[cl];
		// TODO a query to see if c exists already
		var cReq = new XMLHttpRequest();
		cReq.onload = reqListener;
		cReq.open("post", "/backend/push_one_client.php", true);
		// must create guid
		var fd = new FormData();
		for (var ss in field_selects) {
			var fn = selects[field_selects[ss]].id;
			console.log(ss+":"+fn);
			fd.append(ss, c[fn]);
		}

		cReq.send(fd);

		// must use guid
		var confirmReq = new XMLHttpRequest();
		confirmReq.onload = reqListener;
		confirmReq.open("get", "/backend/confirm_push.php", true);
		confirmReq.send();

		count++;
		if (count > 2) break;
	}
}

var headers = document.getElementById('headers');
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

if(headers.addEventListener) headers.addEventListener('change', handleFile, false);
if(xlf.addEventListener) xlf.addEventListener('change', handleFile, false);
if(go.addEventListener) go.addEventListener('click', convert, false);
