import { verifyAbi, verifyProgramAdmission } from "../verify.js";

/**
 * matrixVerifyMiddleware:
 * - verifies ABI hash (hard gate)
 * - verifies policy admission
 * - attaches verified envelope to req.matrix
 */
export function matrixVerifyMiddleware({ expectedAbi, policy, plugins = ["idb", "kql"] }) {
  return (req, res, next) => {
    const programPack = req.body?.program;
    if (!programPack) return res.status(400).json({ error: "PROGRAM_REQUIRED" });

    try {
      const r = verifyAbi({ programPack, policy, plugins, expectedAbiHash: expectedAbi });
      verifyProgramAdmission({ programNorm: r.programNorm, policyNorm: r.policyNorm });
      req.matrix = { abi: r, programNorm: r.programNorm, policyNorm: r.policyNorm };
      next();
    } catch (e) {
      return res.status(403).json({ error: e.code ?? "VERIFY_FAIL", detail: e.message });
    }
  };
}
