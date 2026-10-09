# Offline stdio regression tests

Run `pnpm build:bindings`, `pnpm typecheck`, `pnpm build`, then `pnpm test` on Node 22.
`pnpm test` creates a fresh unfunded test key in memory and does not inherit an operator key or dotenv settings. The built-server integration exchanges initialize, tools/list, a local generateSalt tools/call, and an unknown-tool error over real stdin/stdout pipes. No network-backed tool is invoked.

Run `node --test test/stdio-protocol.test.mjs` directly without STELLAR_SECRET_KEY to observe the explicit missing-key skip. CI uses the ephemeral-key wrapper so it does not silently skip the transport tests.

A second integration case injects a non-JSON stdout line and requires the verifier to reject it. Successful and failed transaction paths are tested separately with mocked signing/RPC. A read-only helper cannot exercise submitTransaction honestly: that method simulates, signs, submits and polls. The success-path mutation test turns diagnostics back into console.log and proves their detection. VM here is solely a dependency-mocking harness, not an isolation boundary.

The local acceptance run used a rootless Podman Node container, network=none, read-only root, UID 65534, no capabilities, no-new-privileges, 1 GiB memory, 2 CPUs, 128 PIDs and a 180-second limit. Only the vetted source/dependencies were streamed into /work tmpfs. No host filesystem bind mounts. Five separate isolation probes passed. This is local evidence, not independent security certification or hosted CI evidence.

Existing handler and allowHttp tests are preserved. Duplicate package.json test keys were consolidated. Duplicate CallTool handler registration was removed so the existing tested handler is actually used. The unused invalid contract link dependency was removed to make dependency acquisition portable. Transaction diagnostics now use stderr.

Hosted GitHub Actions status and maintainer acceptance must be verified after submission. No reward or payment is implied by passing tests.
