import { v4 as uuidv4 } from 'uuid';
import * as Docker from 'dockerode';
import dns from 'dns';
import * as net from 'net';

require('console-stamp')(console, '[HH:MM:ss.l]');

let clients;

async function lookupPromise(domain){
  return new Promise((resolve, reject) => {
      dns.lookup(domain, { all:true }, (err, addresses, family) => {
        if(err) reject(err);
        resolve(addresses.map(x => x.address));
      });
 });
};

export const setClients = async () => {
  let hosts = process.env.DOCKER_API_ADDRESS.split(',');
  if(hosts.length = 1 && !net.isIP(hosts[0])){
    hosts = await lookupPromise(hosts[0]);
  }
  clients = hosts.map((host) => 
    ({
      id: uuidv4(),
      dockerClient: new Docker({
        host: host,
        port: process.env.DOCKER_API_PORT || 2375,
        version: process.env.DOCKER_API_VERSION ? process.env.DOCKER_API_VERSION : 'v1.25'
      })
    })
  );
};


export const listSwarmImages = async () => {
  let promises = clients.map(client => addClientIdToPromiseResult(client.id, () => client.dockerClient.listImages()));
  let images = await Promise.all(promises);
  return images.flat();
}

export const listSwarmContainers = async () => {
  let promises = clients.map(client => addClientIdToPromiseResult(client.id, () => client.dockerClient.listContainers()));
  let containers = await Promise.all(promises);
  return containers.flat();
}

export const deleteImage = async (image) => {
  const imageDigest = image.RepoDigests && image.RepoDigests.length > 0 ? image.RepoDigests[0] : 'unknown'
  const imageName = imageDigest.split('@')[0];
  const imageSha = imageDigest.split('@').length > 1 ? imageDigest.split('@')[1] : '';
  
  return new Promise((resolve,reject) => 
    clients.find(x => x.id ===  image.ClientId).dockerClient.getImage(image.Id).remove({force: true},(error, result) => {
      if(error){
        reject(error);
      }
      console.log(`The image: ${imageName}${imageSha && ' ' + imageSha} deleted`);
      resolve();
    })
  );
}

const addClientIdToPromiseResult = (clientId, func) => {
  return new Promise((resolve, reject) => 
    func()
    .then(results => resolve(results.map(x => ({
      ClientId: clientId,
      ...x
    }))))
    .catch(err => reject(err))
  );
}