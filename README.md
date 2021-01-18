# TiCode

TiCode is a Visual Studio Code extension that makes developing TiDB a breeze.

Still in the loop of coding, compiling, copying binary to servers, restarting every process and pulling information from logs everywhere?

**Try and see how TiCode makes TiDB development experience great again!**

## Quick start

```bash
$ git clone https://github.com/pingcap/tidb.git
$ git clone https://github.com/pingcap/tikv.git
$ git clone https://github.com/pingcap/pd.git
$ git clone https://github.com/pingcap/tidb-dashboard.git
$ cat>tidb.code-workspace<<EOF
{
	"folders": [
		{
			"path": "$PWD/tidb"
		},
		{
			"path": "$PWD/pd"
		},
		{
			"path": "$PWD/tikv"
		},
		{
			"path": "$PWD/tidb-dashboard"
		}
	],
	"settings": {}
}
EOF 
$ code-insiders --install-extension dragonly.ticode
$ code-insiders tidb.code-workspace
```

Navigate to the TiDE panel in VS Code, and click `start default playground` to get started.

## Features

Do all the things just in your favorite Visual Studio Code:

- Start TiUP Playground/Cluster and start debugging instantly
- Debug TiDB Cluster on Kubernetes
- Run Chaos Mesh experiments
- And mooooooooore!

## Demo:

Cluster:

- Youtube: https://youtu.be/fxflwr_lFvE
- Bilibili: https://www.bilibili.com/video/BV1oz4y1U7ec/

![image](https://user-images.githubusercontent.com/1284531/104792552-b7e9ba80-57d9-11eb-907c-1d0cfbc6d72d.png)

Playground:

- Youtube: https://youtu.be/57pU6Jhc5C0
- Bilibili: https://www.bilibili.com/video/BV1pK411u7S4/

![image](https://user-images.githubusercontent.com/1284531/104793321-f7fe6c80-57dc-11eb-8b51-a25a6690d87a.png)

Debug:

![debug](https://user-images.githubusercontent.com/18556593/104743603-d70b2c80-5786-11eb-988b-8f8c3f2daeae.gif)

Bilibili: https://www.bilibili.com/video/BV12p4y1x7w8/

Scaffold:

- Bilibiili: https://www.bilibili.com/video/BV12A411H74T/

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
  - [x] Attach to Debug @Aylei
  - [ ] Restart on local compile (Rsync)

- Playground

  - [x] Start a simple default playground cluster
  - [x] Start a confiured playground cluster
  - [x] Use current repo's binary
  - [x] List playground cluster instances
  - [x] View logs of all instances
  - [x] Follow logs of all instances
  - [x] Attach to Debug @Aylei

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

  - [x] Scaffold for tidb-dashboard repo (add a new app in 10 seconds)
  - [ ] Scaffold for coprocess

- TiUP Manager
  - [ ] Install TiUP
  - [ ] Upgrade TiUP

## Requirements

- TiUP

## Extension Settings

## Known Issues

## Release Notes

### 0.0.1

Initial release
