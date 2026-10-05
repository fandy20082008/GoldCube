# Structured text parsing repair

This increment fixes two independently reproduced parser defects: an incomplete
outer JSON object could be replaced by one of its complete nested objects, and
Chat streaming text fragments lost whitespace at their boundaries.

Streaming structured output that is explicitly incomplete or has an unfinished
outer object is rejected rather than promoted to a successful partial result.
Existing business-schema and script-coverage checks remain in place. No automatic
resubmission or paid-model replay is introduced. Existing failure refunds remain.

Failure diagnostics record only fixed shape types/counts and bounded completion
metadata, never script text or arbitrary customer field values. Historical
production diagnostics do not establish which of these defects triggered the
reported incident; this change does not claim that every model will produce a
valid storyboard.

Source: independent changes to the existing fixed AGPL baseline implementation.
No new upstream code, external material, dependency, license or attribution change.
The Gateway remains a7ace58964de605c29fe0d391b159063cf568ada.

Deployment uses the same local OCI process and source-manifest v2 described in
custom13-local-deployment.md, with version-specific source and artifact hashes.
Native libvips delivery remains deferred under the owner's existing direction.
Original custom.13 artifacts and containers are retained for rollback. No database
schema migration or customer-data changes are included.
