# TiDE Step By Step Guide

## 1. Install TiUP

If you don't install TiUP, the extension will prompt you to install it:

![install tiup](./install-tiup.jpg)

## 2. Clone and import repos

Then you need to clone repos (tidb/tikv/pd/tidb-dashboard) to local if you don't have them.

```shell
$ mkdir tidb-repos && cd tidb-repos
$ git clone https://github.com/pingcap/tidb.git
$ git clone https://github.com/pingcap/tikv.git
$ git clone https://github.com/pingcap/pd.git
$ git clone https://github.com/pingcap/tidb-dashboard.git
```

> Note: you don't need to clone all repos, just the repos you want to develop.

Open any repo in VSCode, for example tidb, then choose menu "File / Add Folder to Workspace...", add other repo folders to VSCode. The VSCode will automatically organize them as a untitled workspace.

> Note: again, you don't need to add all repos, just the repos you want to develop.


<div>
  <img src="./add-folder-to-workspace.jpg" style="zoom:50%">
</div>

<div>
  <img src="./untitled-workspace.jpg" style="zoom:50%">
</div>

Save the workspace by the menu "File / Save Workspace as ..." to any path, for example save it as "tidb-dev.code-workspace".

<div>
  <img src="./save-workspace.jpg" style="zoom:50%">
</div>

<div>
  <img src="./final-workspace.jpg" style="zoom:50%">
</div>

## 3. Setup build tools

(Currently, we need to manually setup them, we try to automate some of them later.)

Required tools for building:

1. TiDB

   - See https://github.com/pingcap/community/blob/master/contributors/README.md for details
   - [`Go 1.13+`](https://golang.org/doc/install)
   - [Go for Visual Studio Code](https://marketplace.visualstudio.com/items?itemName=golang.Go)

1. TiKV

   - See tikv/CONTRIBUTING.md for details
   - [rustup](https://rustup.rs/) - Rust installer and toolchain manager
   - `make` - Build tool (run common workflows)
   - `cmake` - Build tool (required for gRPC)
   - `awk` - Pattern scanning/processing language
   - `lldb`
   - [LLDB VSCode](https://marketplace.visualstudio.com/items?itemName=lanza.lldb-vscode)

1. PD

   - See pd/README.md for details
   - [`Go 1.13+`](https://golang.org/doc/install)
   - [Go for Visual Studio Code](https://marketplace.visualstudio.com/items?itemName=golang.Go)

1. TiDB-Dashboard

   - See tidb-dashboard/CONTRIBUTING.md for details
   - `make` - Build tool (run common workflows)
   - [`Go 1.13+`](https://golang.org/) - To compile the server
   - [`Node.js 12+`](https://nodejs.org/) - To compile the front-end
   - [`Yarn 1.21+`](https://classic.yarnpkg.com/en/docs/install) - To manage front-end dependencies
   - [`Java 8+`](https://www.java.com/en/download/) - To generate JavaScript API client by OpenAPI specification (so pity, but it's true we need it)

## 4. Use playground

### Start

Assume you have modified some code for tidb/tikv/pd, and you want to test the binaries with a playground cluster. You just need one click:

![start-default-playground](./start-default-playground.jpg)

Clicking the "start default playground" item will automatically build current tidb/tikv/pd repos and start a default playground cluster with them.

### Refresh to get topo

After playground is starting successfully, you can refresh the playground to get the topo.

<div>
  <img src="./playground-topo.jpg" style="zoom:50%">
</div>

### View component log

Click the menu item "View Log" in the component to view its log:

![view-playground-log](./view-playground-log.jpg)

### Debug

You can debug the whole playground cluster or a single component, just click the "Debug" menu item in the cluster or a single component.

<div>
  <img src="./debug-playground-cluster.jpg" style="zoom:50%">
</div>

<div>
  <img src="./debug-playground-component.jpg" style="zoom:50%">
</div>

### Start configured playground

If you just want to test certain binaries instead of all, or you need more than 1 instances for the component, you need to start a configured playground.

Click "playground.toml", modify the content. To say I just want to test tidb repo, just uncomment the following line:

```toml
"db.binpath" = "current" # current means to use the current repo binary, will fallback to default binary if it doesn't exist
```

You can also assign the tidb with a special configuration, modify the `components-config/tidb.config` and uncomment the following line:

```toml
"db.config" = "components-config/tidb.config"
```

Start the playground by clicking the menu item "Start playground by config":

<div>
  <img src="./start-configured-playground.jpg" style="zoom:50%">
</div>

## 5. Use clusters

Assume you have deployed some clusters by `tiup cluster` command manually. (We will support it later.) You can manage the clusters in this extension.

- Start/Stop/Restart/Destory cluster, Open dashboard/grafa

  <div>
    <img src="./cluster.jpg" style="zoom:50%">
  </div>

- Modify and apply cluster configuration

  ![cluster-config](./cluster-config.jpg)

- Restart/Patch component

  <div>
    <img src="./cluster-component.jpg" style="zoom:50%">
  </div>

- Restart/Patch/Debug/SSH instance

  <div>
    <img src="./cluster-instance.jpg" style="zoom:50%">
  </div>

- View instance log

  <div>
    <img src="./cluster-instance-log.jpg" style="zoom:50%">
  </div>

- Modify and apply instance configuration

  <div>
    <img src="./cluster-instance-config.jpg" style="zoom:50%">
  </div>

## 6. Use scaffold

(currently we only support add new app to dashboard, we will add more later.)

### Add new app to dashboard

At first, we need to start the dashboard in development mode, just one click:

<div>
  <img src="./dashboard-start.jpg" style="zoom:50%">
</div>

It will do three things:

1. Start a playground if there is no a playground running
1. Start the dashboard backend
1. Start the dashboard frontend

Assume you want to add a new individual feature (aka an "app") to dashboard, click the "Add new app to dashboard", input the app name, it will auto generate the template code for you, and auto restart the dashboard as well.

![add new app to dashboard](./dashboard-add-app.jpg)

![dashboard new page](./dashboard-new-page.jpg)
