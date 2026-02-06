export { canonicalJSONStringify } from "./lib/canonical_json.js";
export { sha256hex } from "./lib/hash.js";

export {
  MATRIX_SYMBOLS_V1,
  computeSymbolsHash,
  normalizePolicyV1,
  computePolicyHash,
  normalizeProgramV1,
  computeProgramHash,
  computeIOSchemaHash,
  computeCapabilitiesHash,
  computeAbiEnvelopeV1,
  computeAbiHash
} from "./abi.js";

export {
  verifyAbi,
  verifyProgramAdmission,
  verifyVectorSet
} from "./verify.js";

export {
  runProgramWithPlugins
} from "./vm.js";

export {
  matrixVerifyMiddleware
} from "./middleware/node.js";

export { default as scxq2Handlers } from "./handlers/scxq2.js";
