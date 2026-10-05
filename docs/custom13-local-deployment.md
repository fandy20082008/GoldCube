# Custom.13 local image deployment

This release uses the application's complete source tree, including documentation,
and the paired GoldCube-Gateway source commit. Only the application/worker and
Gateway are deployed. The documentation service is not deployed.

Build the fixed source with the root Dockerfile. Where the legacy Docker builder
is required, replace the pnpm RUN cache-mount prefix with plain RUN; do not change
the installation command or lockfile. Build arguments BUILD_NODE_OPTIONS and
NEXT_BUILD_CPUS limit resources. Record the transformed Dockerfile hash.

The version-2 source manifest binds exact source commits and downloadable archive
hashes to the local OCI manifest digest, image configuration digest, image archive
hash, and Gateway runtime archive hash. Docker inspect IDs are not assumed to be
configuration digests: verify the actual OCI descriptors. App and worker use the
same image. The manifest is mounted read-only; its raw SHA-256 and the running
identities are configured with GOLDCUBE_SOURCE_MANIFEST_FILE,
GOLDCUBE_SOURCE_MANIFEST_SHA256, GOLDCUBE_RUNNING_APP_COMMIT,
GOLDCUBE_RUNNING_GATEWAY_COMMIT, GOLDCUBE_RUNNING_APP_IMAGE_DIGEST,
GOLDCUBE_RUNNING_APP_IMAGE_CONFIG_ID, GOLDCUBE_RUNNING_APP_IMAGE_ARCHIVE_SHA256
and GOLDCUBE_RUNNING_GATEWAY_ARTIFACT_DIGEST.

`/open-source` and `/api/open-source` expose only the verified public fields.
Invalid or mismatched configuration does not expose private manifest data.
Registry image publication and external CI are not part of this release.

Before replacing app/worker, preserve their actual startup/environment/mount
configuration, the old image, the Gateway release directory and a private
database backup. Do not rebuild the database or run the optional prompt data
retirement script. Existing prompt records and customer media remain unchanged.
Restore the previous application/worker image and Gateway directory on failed
health/source checks; do not restore over newly written customer data.

The owner has deferred completing native libvips corresponding-source and
applicable relinking delivery. The manifest states `deliveryStatus.libvips:
deferred`; this statement is not a license-compliance finding.

Source: independently implemented on the fixed old AGPL baseline and reused
previously reviewed project changes. No new external dependency or asset is
introduced. Original licenses and applicable attribution remain.
