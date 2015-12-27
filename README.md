JudoDB import tool
==================

The import tool must be set up on the same webserver as the JudoDB
backend; it makes requests to fetch the list of clubs and to push the
clients that it imports.

The "Rangées en-tête" input is approximate at best.

In JSON and CSV mode, it reads the given XLSX file and prints out
its impression of the contents to the current HTML file.

In Import mode, it reads the XLSX file and emits push_one_client
requests to the server, which add the entries from the XLS file
to the db. The matching is as specified by the select boxes. Selecting
a single target field more than once results in concatenation of
the fields (e.g. nom1, prenom1 -> nom_impot_recu concatenates nom1
and prenom1). Currently I hardcoded a '/' separator between the second
and third elements to be concatenated.

The nom, prenom and ddn fields are mandatory.