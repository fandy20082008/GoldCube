# custom.17-hf1: generation operations query hotfix

The administrative generation-operations endpoint returned 518 tasks at the origin but took about 61 seconds. The Gateway's existing 30-second timeout returned HTTP 502 before the response arrived. This was not an empty database or a permission failure.

`summarizeStoredAgentPerformance` now materializes the filtered `payload.timings` projection once and its seven numeric fields once, rather than repeatedly extracting fields from the full JSON payload during percentile/aggregate evaluation. Filters, metrics, permissions and billing remain unchanged. The production read-only comparison returned identical aggregate hashes: original 56.317 seconds, intermediate materialization 10.694 seconds, final projection 1.601 seconds, original again 51.974 seconds. These are observations, not guaranteed latency bounds.

The deployed custom.17 image remains unchanged. This repair is a separately recorded application-server overlay, not a newly built image. No worker or database mutation is required. The baseline server chunk SHA-256 is `fa58e3000f68679aec8659524310f2db1d1f7a1d0cad33a918f2b231ad5c808e`; the patched chunk is `0e4be385286e045ed5554838494751536d473b65441ae37c70b85db952f9ecc9`. Base application commit: `802e24e9749ec671b90e9b02c5b7c53985aa8756`. Gateway remains `a7ace58964de605c29fe0d391b159063cf568ada`.

Retain this source change in the next normal image build; do not re-create an unpatched custom.17 application container without restoring the recorded overlay. A process restart retains the writable-layer patch; container replacement does not. Rollback restores the exact original chunk and restarts only the application, retaining Worker and PostgreSQL.

Based on the fixed old AGPL source; no external code, asset, dependency, license or attribution changes. Existing permissions and source notices are preserved. No external CI or image-registry push.
