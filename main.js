
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

function to_import(workbook) {
	var result = [];
	workbook.SheetNames.forEach(function(sheetName) {
		var roa = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName], {range:parseInt(headers.value)});

		var observedColumns = [], observedColumnsSet = {};
		for (var r in roa) {
			for (var c in roa[r]) {
				if (roa[r].hasOwnProperty(c)) {
					cc = c;
					if (!(cc in observedColumnsSet)) {
						observedColumns.push(cc);
						observedColumnsSet[cc] = true;
					}
				}
			}
		}
		result.push(observedColumns.join(":"));
	});
	return result.join("\n");
}

var headers = document.getElementById('headers');
var xlf = document.getElementById('xlf');
function handleFile(e) {
	var files = e.target.files;
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
