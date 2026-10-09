# Docker Images

> The Dockerfiles used to build the images that the Polar app needs to spin up nodes quickly across multiple operating systems.

_Warning: These images are not hardened and shouldn't be used to store real bitcoin. These images are intended solely to be used in regtest environments_

Creating multi-arch images for Polar makes use of the `docker buildx` command. It is a good idea to create a separate builder using the commands below.

```
// create the builder
$ docker buildx create --use --name polar-builder

// use the builder
$ docker buildx use polar-builder

// bootstrap the builder
$ docker buildx inspect --bootstrap
```

## Bitcoin Knots

### Tags

- `29.4.2` ([bitcoind/Dockerfile](bitcoind/Dockerfile))

**Building the image**

```sh
$ cd bitcoind
$ docker buildx build --platform linux/amd64,linux/arm64 --build-arg BITCOIN_VERSION=<version> --build-arg BITCOIN_SHA256SUMS=<sums> -t ghcr.io/privkeyio/polar/bitcoind:<tag> --push .
```

Replace `<version>` with the Bitcoin Knots release (ex: `29.4.2.knots20260508`), `<tag>` with its version number (ex: `29.4.2`), and `<sums>` with the sha256 of that release's `SHA256SUMS` once you have checked its `SHA256SUMS.asc` against Luke Dashjr's key `1A3E 761F 19D2 CC77 85C5 502E A291 A2C4 5D0C 504A` (for `29.4.2.knots20260508`: `90bd17505d37b92b7ac3c55a6d7109b9415c96711d04b9041e37b3fc67557f67`).

## LND

### Tags

- `0.21.3-beta-blake2b.17` ([lnd/Dockerfile](lnd/Dockerfile))

**Building the image**

```sh
$ cd lnd
$ docker buildx build --platform linux/amd64,linux/arm64 --build-arg LND_VERSION=<version> --build-arg LND_COMMIT=<commit> -t ghcr.io/privkeyio/polar/lnd:<version> --push .
```

Replace `<version>` with a tag of [paulscode/lightning-fork](https://github.com/paulscode/lightning-fork) without the leading `v` (ex: `0.21.3-beta-blake2b.17`) and `<commit>` with the commit that tag points at (for `0.21.3-beta-blake2b.17`: `cebc10fe01e811a38c2830c0396bd3c9182e5d62`). It is built from source, since the fork publishes no binaries, and the build fails if the tag has moved.

## Core Lightning

### Tags

- `26.06.9-blake2b.7` ([clightning/Dockerfile](clightning/Dockerfile))

**Building the image**

```sh
$ cd clightning
$ docker buildx build --platform linux/amd64,linux/arm64 --build-arg CLN_VERSION=<version> -t ghcr.io/privkeyio/polar/clightning:<version> --push .
```

Replace `<version>` with a release of [privkeyio/lightning](https://github.com/privkeyio/lightning) without the leading `v` (ex: `26.06.9-blake2b.7`). The image builds on `ghcr.io/privkeyio/lightningd`, which privkeyio/lightning publishes for each release.

## Lampo

### Tags

- `0.1.0-blake2b.1` ([lampo/Dockerfile](lampo/Dockerfile))

**Building the image**

```sh
$ cd lampo
$ docker buildx build --platform linux/amd64,linux/arm64 --build-arg LAMPO_VERSION=<version> --build-arg LAMPO_COMMIT=<commit> -t ghcr.io/privkeyio/polar/lampo:<version> --push .
```

Replace `<version>` with a tag of [privkeyio/lampo.rs](https://github.com/privkeyio/lampo.rs) without the leading `v` (ex: `0.1.0-blake2b.1`) and `<commit>` with the commit that tag points at. It is built from source, and the build fails if the tag has moved.

The images can also be built and pushed from master with the `Images` workflow in GitHub Actions, passing the same build args one per line.

## SimLN

### Tags

- `0.2.5` ([simln/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/simln/Dockerfile))

**Building the image**

```sh
$ cd simln
$ docker buildx build --platform linux/amd64, linux/arm64 --build-arg SIMLN_VERSION=<version> -t polarlightning/simln:<version> --push .
```

Replace `<version>` with the desired SimLN version (ex: `0.2.5`).

# Out-of-Band Image Updates

> Note: These steps can only be performed by developers with commit access to this GitHub repo and push access to the Docker Hub repo

These docker images can be updated in-between Polar releases. This allows developers to use the latest Bitcoin & Lightning versions shortly after they are released, without needing to download and install a new version of Polar.

To make new docker image versions available:

1. Build the new docker image using the commands above
1. Push the image to Docker Hub
1. Update the [`docker/nodes.json`](https://github.com/jamaljsr/polar/blob/master/docker/nodes.json) file
   - add the new version to the `versions` array of the associated implementation
   - update the `latest` property of the implementation if necessary
   - increment the root-level `version` number by `1`
1. Update the [`src/utils/constants.ts`](https://github.com/jamaljsr/polar/blob/master/src/utils/constants.ts) file

Once the updated `nodes.json` file is committed to master, the new images can be used in Polar by following these steps:

1. Create a Network or view an existing Network
1. In the Network Designer sidebar, click on the **Show All Versions** toggle
1. At the bottom of the node list, click on the **Check for new Node Versions** link
1. A dialog will open displaying the new versions available
1. Click the **Add New Versions** button to begin using them
