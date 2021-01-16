import * as vscode from 'vscode';
import {KubeCommand} from './command'


export const KUBERNETES_EXPLORER_NODE_CATEGORY = 'kubernetes-explorer-node';

enum NodeType{
  TC = 'tidbcluster',
  PD = 'pd',
  TIDB = 'tidb',
  TIKV = 'tikv',
}

export class KubeProvider implements vscode.TreeDataProvider<ClusterExplorerNode> {
  getTreeItem(element: ClusterExplorerNode): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element
  }

  async getChildren(node?: ClusterExplorerNode): Promise<ClusterExplorerNode[]> {
    // root -> TidbClusters
    if (node === undefined) {
      console.log('TreeView: root')
      let tcs = await KubeCommand.listTidbCluster()
      let nodes = tcs.map(tc => new ClusterExplorerNode(tc.metadata.name, NodeType.TC, vscode.TreeItemCollapsibleState.Collapsed))
      return nodes
    }

    // TidbCluster -> TiDB Components
    if (node.type === NodeType.TC) {
      console.log('TreeView: TC')
      return [
        new ClusterExplorerNode('PD', NodeType.PD, vscode.TreeItemCollapsibleState.Collapsed),
        new ClusterExplorerNode('TiDB', NodeType.TIDB, vscode.TreeItemCollapsibleState.Collapsed),
        new ClusterExplorerNode('TiKV', NodeType.TIKV, vscode.TreeItemCollapsibleState.Collapsed),
      ]
    }

    // TiDB Components -> Pods
    if (node.type === NodeType.PD) {
      console.log('TreeView: PD')
      let pods = await KubeCommand.listPDPods()
      console.log('pods:', pods)
      let nodes: ClusterExplorerNode[] = []
      pods?.forEach(pod => {
        let node = new ClusterExplorerNode(pod.metadata.name, NodeType.PD, vscode.TreeItemCollapsibleState.None, {
          command: 'ticode.kubernetes.showPodInDocument',
          title: 'View Pod',
          arguments: [pod.metadata.name],
        })
        nodes.push(node)
      })
      return nodes
    }

    if (node.type === NodeType.TIDB) {
      console.log('TreeView: TiDB')
      let pods = await KubeCommand.listTiDBPods()
      console.log('pods:', pods)
      let nodes: ClusterExplorerNode[] = []
      pods?.forEach(pod => {
        let node = new ClusterExplorerNode(pod.metadata.name, NodeType.TIDB, vscode.TreeItemCollapsibleState.None, {
          command: 'ticode.kubernetes.showPodInDocument',
          title: 'View Pod',
          arguments: [pod.metadata.name],
        })
        nodes.push(node)
      })
      return nodes
    }
    
    if (node.type === NodeType.TIKV) {
      console.log('TreeView: TiKV')
      let pods = await KubeCommand.listTiKVPods()
      console.log('pods:', pods)
      let nodes: ClusterExplorerNode[] = []
      pods?.forEach(pod => {
        let node = new ClusterExplorerNode(pod.metadata.name, NodeType.TIKV, vscode.TreeItemCollapsibleState.None, {
          command: 'ticode.kubernetes.showPodInDocument',
          title: 'View Pod',
          arguments: [pod.metadata.name],
        })
        nodes.push(node)
      })
      return nodes
    }

    return []
  }
}

// TODO: find out what's good in kubernetes plugin and replace this
class ClusterExplorerNode extends vscode.TreeItem {
  public extra: any
  constructor(
    public readonly label: string,
    public readonly type: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState)
  }
}
