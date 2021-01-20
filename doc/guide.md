# Step By Step Guide

## Clone and import repos

At frist you need to clone all repos (tidb/tikv/pd/tidb-dashboard) to local if you don't have them.

```shell
$ mkdir repos
$ git clone https://github.com/pingcap/tidb.git
$ git clone https://github.com/pingcap/tikv.git
$ git clone https://github.com/pingcap/pd.git
$ git clone https://github.com/pingcap/tidb-dashboard.git
```

Open any repo in VSCode, for example tidb, then choose menu "File / Add Folder to Workspace...", add all other repo folders to VSCode. The VSCode will automatically organize them as a untitled workspace.

![add-folder-to-workspace](./add-folder-to-workspace.jpg)

![untitled-workspace](./untitled-workspace.jpg)

Save the workspace by the menu "File / Save Workspace as ..." to any path, for example save it as "tidb-dev.code-workspace".

![save-workspace](./save-workspace.jpg)

![final-workspace](./final-workspace.jpg)

## Setup build tools

(Currently, we need to manually setup them, we try to automate some of them later.)

Required tools for building:

1. TiDB

   - See https://github.com/pingcap/community/blob/master/contributors/README.md for details
   - [`Go 1.13+`](https://golang.org/doc/install)

1. TiKV

   - See tikv/CONTRIBUTING.md for details
   - [rustup](https://rustup.rs/) - Rust installer and toolchain manager
   - `make` - Build tool (run common workflows)
   - `cmake` - Build tool (required for gRPC)
   - `awk` - Pattern scanning/processing language

1. PD

   - See pd/README.md for details
   - [`Go 1.13+`](https://golang.org/doc/install)

1. TiDB-Dashboard

   - See tidb-dashboard/CONTRIBUTING.md for details
   - `make` - Build tool (run common workflows)
   - [`Golang 1.13+`](https://golang.org/) - To compile the server
   - [`Node.js 12+`](https://nodejs.org/) - To compile the front-end
   - [`Yarn 1.21+`](https://classic.yarnpkg.com/en/docs/install) - To manage front-end dependencies
   - [`Java 8+`](https://www.java.com/en/download/) - To generate JavaScript API client by OpenAPI specification (so pity, but it's true we need it)

1. TiUP

   ```
   $ curl --proto '=https' --tlsv1.2 -sSf https://tiup-mirrors.pingcap.com/install.sh | sh
   ```

## Start playground with modified code

### Start

Assume you have modified some code for tidb/tikv/pd, and you want to test the binaries with a playground cluster. You just need one click:

![start-default-playground](./start-default-playground.jpg)

Clicking the "start default playground" item will automatically build current tidb/tikv/pd repos and start a default playground cluster with them.

### Refresh to get topo

After playground is starting successfully, you can refresh the playground to get the topo.

![playground-topo](./playground-topo.jpg)

### View component log

Click the menu item "View Log" in the component to view its log:

![view-playground-log](./view-playground-log.jpg)

### Debug

You can debug the whole playground cluster or a single component, just click the "Debug" menu item in the cluster or a single component.

![debug-playground-cluster](./debug-playground-cluster.jpg)

![debug-playground-component](./debug-playground-component.jpg)

### Start configured playground

If you just want to test certain binaries instead of all, you need to start a configured playground.

Click "playground.toml", modify the content. To say I just want to test tidb repo, just uncomment the following line:

```toml
"db.binpath" = "current" # current means to use the current repo binary, will fallback to default binary if it doesn't exist
```

You can also assign the tidb with a special configuration, modify the `components-config/tidb.config` and uncomment the following line:

```toml
"db.config" = "components-config/tidb.config"
```

Start the playground by clicking the menu item "Start playground by config":

![start-configured-playground](./start-configured-playground.jpg)
