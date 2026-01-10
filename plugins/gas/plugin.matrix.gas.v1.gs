/**
 * GAS / Sheets projection (v0.1):
 * - Treat Sheets as a static/bulk data plane
 * - Expose query + append as MATRIX plugin routes
 *
 * Deploy as Apps Script Web App:
 * doPost(e) receives JSON { op, args, program, policy, expectAbi }
 */

function json(o) {
  return ContentService
    .createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    // v0.1: verify is external (matrix-verify CLI). GAS focuses on plugin ops.
    var op = body.op;
    var args = body.args || {};

    if (op === "sheets.query") return json(sheetsQuery_(args));
    if (op === "sheets.append") return json(sheetsAppend_(args));
    if (op === "sheets.snapshot.export") return json(sheetsSnapshotExport_(args));

    return json({ ok: false, error: "UNKNOWN_OP" });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function sheetsQuery_(args) {
  var ss = SpreadsheetApp.openById(args.sheet_id);
  var sh = ss.getSheetByName(args.tab || "data");
  var values = sh.getDataRange().getValues();
  var header = values.shift();

  var limit = args.limit || 50;
  var rows = [];
  for (var i = 0; i < values.length && rows.length < limit; i++) {
    var obj = {};
    for (var c = 0; c < header.length; c++) obj[String(header[c])] = values[i][c];
    rows.push(obj);
  }
  return { ok: true, rows: rows };
}

function sheetsAppend_(args) {
  var ss = SpreadsheetApp.openById(args.sheet_id);
  var sh = ss.getSheetByName(args.tab || "data");
  var obj = args.record || {};
  var header = sh.getDataRange().getValues()[0];
  var row = header.map(function(h){ return obj[String(h)] ?? ""; });
  sh.appendRow(row);
  return { ok: true };
}

function sheetsSnapshotExport_(args) {
  // Exports a JSON snapshot usable to seed IDB
  var q = sheetsQuery_({ sheet_id: args.sheet_id, tab: args.tab || "data", limit: args.limit || 100000 });
  return { ok: true, idb: { [args.store || "data"]: q.rows } };
}
