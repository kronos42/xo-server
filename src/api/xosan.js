import fromPairs from 'lodash/fromPairs'
import arp from 'arp-a'
import { spawn } from 'child_process'

async function runSsh (ip, command) {
  return new Promise((resolve, reject) => {
    const child = spawn('ssh', [ '-o', 'StrictHostKeyChecking=no', 'root@' + ip, command ])
    let resp = ''
    let stderr = ''
    child.stdout.on('data', function (buffer) {
      resp += buffer.toString()
    })
    child.stderr.on('data', function (buffer) {
      stderr += buffer.toString()
    })
    child.on('close', (code) => {
      if (code !== 0) {
        reject(stderr)
      } else {
        resolve(resp)
      }
    })
  })
}

export async function getPeers ({ ip }) {
  // ssh -o StrictHostKeyChecking=no  root@192.168.0.201 gluster pool list
  const result = await runSsh(ip, 'gluster pool list')
  /* expected result:
   UUID\t\t\t\t\tHostname     \tState
   953f8259-5ddf-4459-9846-933433cc7787\t192.168.0.202\t  Connected
   b4a98ab8-4634-4916-9be6-c980298fe5ed\t192.168.0.203\tConnected
   1ec28018-92ea-4662-b3da-fcb11c128c07\tlocalhost    \tConnected
   * */
  let peers = result.trim().split('\n').slice(1)
    .map(line => (line.split('\t').map(elem => elem.trim())))
    .map(line => line[ 1 ] === 'localhost' ? [ line[ 0 ], ip, line[ 2 ] ] : line)
    .map(line => ({ uuid: line[ 0 ], hostname: line[ 1 ], state: line[ 2 ] }))
    .sort((l1, l2) => l1.hostname.localeCompare(l2.hostname))
  /* and now:
   [
   { uuid: '1ec28018-92ea-4662-b3da-fcb11c128c07', hostname: '192.168.0.201', state: 'Connected' },
   { uuid: '953f8259-5ddf-4459-9846-933433cc7787', hostname: '192.168.0.202', state: 'Connected' },
   { uuid: 'b4a98ab8-4634-4916-9be6-c980298fe5ed', hostname: '192.168.0.203', state: 'Connected' }
   ]
   */
  await new Promise((resolve, reject) => arp.table((err, entry) => {
    if (entry) {
      const peer = peers.find(element => element.hostname === entry.ip)
      if (peer) {
        peer.mac = entry.mac
      }
    }
    if (!entry && !err) {
      resolve(peers)
    }
  }))
  return peers
}

getPeers.description = 'find a gluster server peers'

getPeers.permission = 'admin'

getPeers.params = {
  ip: {
    type: 'string'
  }
}

export async function getVolumeInfo ({ ip, volumeName }) {
  // ssh -o StrictHostKeyChecking=no  root@192.168.0.201 gluster volume info xosan
  const result = await runSsh(ip, 'gluster volume info ' + volumeName)
  /*
   Volume Name: xosan
   Type: Disperse
   Volume ID: 1d4d0e57-8b6b-43f9-9d40-c48be1df7548
   Status: Started
   Snapshot Count: 0
   Number of Bricks: 1 x (2 + 1) = 3
   Transport-type: tcp
   Bricks:
   Brick1: 192.168.0.201:/bricks/brick1/xosan1
   Brick2: 192.168.0.202:/bricks/brick1/xosan1
   Brick3: 192.168.0.203:/bricks/brick1/xosan1
   Options Reconfigured:
   client.event-threads: 16
   server.event-threads: 16
   performance.client-io-threads: on
   nfs.disable: on
   performance.readdir-ahead: on
   transport.address-family: inet
   features.shard: on
   features.shard-block-size: 64MB
   network.remote-dio: enable
   cluster.eager-lock: enable
   performance.io-cache: off
   performance.read-ahead: off
   performance.quick-read: off
   performance.stat-prefetch: on
   performance.strict-write-ordering: off
   cluster.server-quorum-type: server
   cluster.quorum-type: auto
   */
  let info = fromPairs(result.trim().split('\n')
    .map(line => line.split(':').map(val => val.trim()))
    // some lines have more than one ":", re-assemble them
    .map(line => [ line[ 0 ], line.slice(1).join(':') ]))
  let getNumber = item => parseInt(item.substr(5))
  let brickKeys = Object.keys(info).filter(key => key.match(/^Brick[1-9]/)).sort((i1, i2) => getNumber(i1) - getNumber(i2))
  // expected brickKeys : [ 'Brick1', 'Brick2', 'Brick3' ]
  info[ 'Bricks' ] = brickKeys.map(key => ({ config: info[ key ] }))
  await new Promise((resolve, reject) => arp.table((err, entry) => {
    if (entry) {
      const brick = info[ 'Bricks' ].find(element => element.config.split(':')[ 0 ] === entry.ip)
      if (brick) {
        brick.mac = entry.mac
      }
    }
    if (!entry && !err) {
      resolve()
    }
  }))
  return info
}

getVolumeInfo.description = 'info on gluster volume'
getVolumeInfo.permission = 'admin'

getVolumeInfo.params = {
  ip: {
    type: 'string'
  },
  volumeName: {
    type: 'string'
  }
}
