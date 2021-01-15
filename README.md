# TiCode

TiCode is a Visual Studio Code extension that makes developing TiDB a breeze.

Still in the loop of coding, compiling, copying binary to servers, restarting every process and pulling information from logs everywhere?

**Try and see how TiCode makes TiDB development experience great again!**

## Features

Do all the things just in your favorite Visual Studio Code:

- Start TiUP Playground/Cluster and start debugging instantly
- Debug TiDB Cluster on Kubernetes
- Run Chaos Mesh experiments
- And mooooooooore!

## Quick Start

1. Install Extension on [Visual Studio Code MarketPlace](https://marketplace.visualstudio.com/items?itemName=dragonly.ticode)
2. Start TiUP Playground
3. Coding and Debugging

## TODO

- Cluster

  - [x] List all clusters
  - [x] Display a cluster detail inforamtion
  - [x] Start / Stop / Destroy a cluster
  - [x] Show a cluster topo (currently by graphviz)
  - [x] Open dashboard / grafana
  - Restart
    - [x] Restart a cluster
    - [x] restart all instances of a component
    - [x] restart a single instance
  - Config
    - [x] View a cluster configuration
    - [x] View a single instance configuration
    - [x] Edit and apply a cluster configuration
    - [x] Edit and apply a single instance configuration
  - [x] view all logs of all instances
  - Patch (replace binary)
    - Patch by current repo
      - [x] Patch for all instance of a component
      - [x] Patch for a single instance
    - Patch by other binary
      - [x] Patch for all instance of a component
      - [x] Patch for a single instance
  - [x] SSH to a single instance and enter the folder
  - [ ] Follow logs of all instances @Aylei
  - [ ] Attach to Debug @Aylei
  - [ ] Restart on local compile (Rsync)

- Playground

  - [x] Start a simple default playground cluster
  - [x] Start a confiured playground cluster
  - [x] Use current repo's binary
  - [x] List playground cluster instances
  - [x] View logs of all instances
  - [x] Follow logs of all instances
  - [ ] Attach to Debug @Aylei

- Bench

  - [ ] Config bench
  - [ ] Start bench

- Kubernetes

  - [ ] TreeView
  - [ ] Attach to Debug
  - [ ] Restart on local compile (Rsync)

- Cluster Topo Manager

  - [ ] Manage cluster topos
  - [ ] Deploy a cluster by a topo

- Virtual Machines Manager

  - [ ] Manager vagrant virtual machines
  - [ ] Start virtual machines, ready for deploy a cluster

- Scaffold for adding new feature

  - [ ] Scaffold for tidb-dashboard repo
  - [ ] Scaffold for coprocess

- TiUP Manager
  - [ ] Install TiUP
  - [ ] Upgrade TiUP

## Demo:

Cluster:

- Youtube: https://youtu.be/fxflwr_lFvE
- Bilibili: in review


Playground:

- Youtube: https://youtu.be/57pU6Jhc5C0
- Bilibili: in review

Debug:

![debug](https://user-images.githubusercontent.com/18556593/104743603-d70b2c80-5786-11eb-988b-8f8c3f2daeae.gif)

## Requirements

- TiUP

## Extension Settings

## Known Issues

## Release Notes

### 0.0.1

Initial release
