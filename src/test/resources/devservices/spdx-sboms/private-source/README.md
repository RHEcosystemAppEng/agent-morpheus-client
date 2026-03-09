# SPDX fixture for upload-spdx with credentials (private repo)

This fixture provides an SPDX file that references a **container image** whose OCI labels point to a **private GitHub repository**. It is used to test the upload-spdx flow with credentials (PAT or SSH key) for private repository access.

## How it works

1. **Private repo**: A GitHub repo is created with `gh repo create` (or you use an existing one).
2. **Container image**: A minimal image is built with Podman with OCI labels:
   - `org.opencontainers.image.source` = `https://github.com/OWNER/REPO`
   - `org.opencontainers.image.revision` = commit ref (e.g. `main`)
3. When the backend processes the SPDX, it runs Syft on that image; Syft emits these labels as CycloneDX metadata properties, and the app builds `source_info` (git repo + ref) for the report. If the repo is private, the credential (PAT) is used when fetching repo metadata (e.g. languages).

## Prerequisites

- **gh** CLI installed and logged in: `gh auth login`
- **podman** installed

## One-shot: create repo, build image, push, generate SPDX

From this directory (or the repo root), run:

```bash
cd src/test/resources/devservices/spdx-sboms/private-source
chmod +x build-and-push.sh
./build-and-push.sh
```

Optional arguments:

- `./build-and-push.sh [REPO_NAME] [IMAGE_NAME]`
- Defaults: `REPO_NAME=spdx-private-source-test`, `IMAGE_NAME=spdx-private-source-test`

The script will:

1. Create a private repo `spdx-private-source-test` under your GitHub user (if it doesn’t exist).
2. Build an image with the Dockerfile, labeling it with that repo URL.
3. Push the image to `ghcr.io/<your-user>/spdx-private-source-test:latest`.
4. Write `spdx-with-private-source.json` in this directory, with the component’s purl pointing at that image.

## Using the SPDX in tests

1. Create a GitHub **Personal Access Token** (PAT) with `repo` scope for the private repo.
2. Upload the generated SPDX with credentials:

   - **file**: `spdx-with-private-source.json` (path from project root or absolute)
   - **cveId**: e.g. `CVE-2024-0000`
   - **secretValue**: your GitHub PAT
   - **userName**: your GitHub username (or any non-empty value for PAT)

3. In tests (e.g. `UploadSpdxEndpointTest`), use the same file and credentials so the backend can access the private repo when building the report.

## Manual steps (without the script)

1. **Create private repo**: `gh repo create spdx-private-source-test --private`
2. **Build image** (replace OWNER/REPO):

   ```bash
   podman build \
     --build-arg GITHUB_REPO_URL=https://github.com/OWNER/spdx-private-source-test \
     --build-arg COMMIT_ID=main \
     -t ghcr.io/OWNER/spdx-private-source-test:latest \
     -f Dockerfile .
   ```

3. **Push**: `podman push ghcr.io/OWNER/spdx-private-source-test:latest` (log in to ghcr.io first with `gh auth token`).
4. **Get digest**: e.g. from push output or `podman image inspect ... --format '{{.Digest}}'`.
5. **SPDX**: Use the generated `spdx-with-private-source.json` from the script, or craft an SPDX document with one component whose purl is `pkg:oci/spdx-private-source-test@<digest>?repository_url=ghcr.io/OWNER/spdx-private-source-test&tag=latest`.
