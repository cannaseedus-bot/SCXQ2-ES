<?php
/**
 * MATRIX verify (PHP projection)
 * Uses matrix-verify CLI as authority.
 * This keeps PHP "dumb" and policy-driven.
 */

function matrix_verify_program($programJson, $policyJson, $expectedAbiHash, $pluginsCsv = "idb,kql") {
  $tmpProg = tempnam(sys_get_temp_dir(), "mx_prog_");
  $tmpPol  = tempnam(sys_get_temp_dir(), "mx_pol_");

  file_put_contents($tmpProg, $programJson);
  file_put_contents($tmpPol, $policyJson);

  $cmd = "matrix-verify --program " . escapeshellarg($tmpProg) .
         " --policy " . escapeshellarg($tmpPol) .
         " --expect " . escapeshellarg($expectedAbiHash) .
         " --plugins " . escapeshellarg($pluginsCsv) .
         " --quiet";

  $out = [];
  $code = 0;
  exec($cmd . " 2>&1", $out, $code);

  @unlink($tmpProg);
  @unlink($tmpPol);

  if ($code !== 0) {
    http_response_code(403);
    header("Content-Type: application/json");
    echo json_encode(["error" => "ABI_MISMATCH", "detail" => implode("\n", $out)]);
    exit;
  }

  return true;
}
