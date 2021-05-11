# TiDE

[![version](https://vsmarketplacebadge.apphb.com/version/dragonly.ticode.svg)](https://marketplace.visualstudio.com/items?itemName=dragonly.ticode)
[![install](https://vsmarketplacebadge.apphb.com/installs-short/dragonly.ticode.svg)](https://marketplace.visualstudio.com/items?itemName=dragonly.ticode)
![ci](https://github.com/dragonly/ticode/workflows/ci/badge.svg)

TiDE is a Visual Studio Code extension that makes developing TiDB a breeze.

Still in the loop of coding, compiling, copying binary to servers, restarting every process and pulling information from logs everywhere?

**Try and see how TiDE makes TiDB development experience great again!**

## Quick start

1. Install the extension

   - Install from [Visual Studio Code MarketPlace](https://marketplace.visualstudio.com/items?itemName=dragonly.ticode), or
   - Run command `code --install-extension dragonly.ticode`

1. Navigate to the TiDE panel in VS Code, follow the [`Step-by-Step Guide`](./doc/guide.md)

## Features

Do all the things just in your favorite Visual Studio Code:

- Start TiUP Playground/Cluster and start debugging instantly
- Debug TiDB Cluster on Kubernetes
- And mooooooooore!

> Note: Currently we only test it in macOS, and we plan to support Ubuntu as well.

## Community

### Slack

Join our [Slack channel](https://slack.tidb.io/invite?team=tidb-community&channel=tide&ref=website) 🥳

## Demo

### Playground

Video: https://www.bilibili.com/video/BV1pK411u7S4/

![Playground](https://user-images.githubusercontent.com/1284531/104793321-f7fe6c80-57dc-11eb-8b51-a25a6690d87a.png)

### Debug

Video: https://www.bilibili.com/video/BV12p4y1x7w8/

![debug](https://user-images.githubusercontent.com/18556593/104743603-d70b2c80-5786-11eb-988b-8f8c3f2daeae.gif)

### Cluster

Video: https://www.bilibili.com/video/BV1oz4y1U7ec/

![image](https://user-images.githubusercontent.com/1284531/104792552-b7e9ba80-57d9-11eb-907c-1d0cfbc6d72d.png)

### Scaffold

Video: https://www.bilibili.com/video/BV12A411H74T/

## TODO

- Playground

  - [x] Start a simple default playground cluster
  - [x] Start a configured playground cluster
  - [x] Use the current repo's binary
  - [x] List playground cluster instances
  - [x] View logs of all instances
  - [x] Follow logs of all instances
  - [x] Attach to Debug @Aylei

- Virtual Machines & Cluster Topo Manager

  - [x] Manage vagrant virtual machines
  - [x] Start virtual machines, ready for deploy a cluster
  - [x] Manage cluster topos
  - [x] Deploy a cluster by a topo file

- Cluster

  - [x] List all clusters
  - [x] Display a cluster detail information
  - [x] Start / Stop / Destroy a cluster
  - [x] Show a cluster topo (currently by graphviz)
  - [x] Open dashboard / grafana
  - Restart
    - [x] Restart a cluster
    - [x] Restart all instances of a component
    - [x] Restart a single instance
  - Config
    - [x] View a cluster configuration
    - [x] View a single instance configuration
    - [x] Edit and apply a cluster configuration
    - [x] Edit and apply a single instance configuration
  - [x] View all logs of all instances
  - Patch (replace binary)
    - Patch by the current repo
      - [x] Patch for all instance of a component
      - [x] Patch for a single instance
    - Patch by other binary
      - [x] Patch for all instance of a component
      - [x] Patch for a single instance
  - [x] SSH to a single instance and enter the folder
  - [ ] Follow logs of all instances @Aylei
  - [x] Attach to Debug @Aylei
  - [ ] Restart on local compile (Rsync)

- Kubernetes

  - [ ] TreeView
  - [ ] Attach to Debug
  - [ ] Restart on local compile (Rsync)

- Scaffold for adding new feature

  - [x] Scaffold for tidb-dashboard repo (add a new app in 10 seconds)
  - [ ] Scaffold for coprocess

- Bench

  - [ ] Config bench
  - [ ] Start bench

- TiUP Manager

  - [x] Install TiUP
  - [ ] Upgrade TiUP
