import { setClients, listSwarmImages, listSwarmContainers, deleteImage  } from './clientActions';
require('console-stamp')(console, '[HH:MM:ss.l]');

export const runTask = async () => {
  await setClients();
  try{
    console.log('Searching for unused images')
    const images = await listSwarmImages();
    const runningContainers = await listSwarmContainers();
    const runningContainersImageIds = runningContainers.map(x => x.ImageID);
    let unusedImages = images.filter(x => !runningContainersImageIds.includes(x.Id));
    if(process.env.EXCLUDE_IMAGES){
      const excludeImages = process.env.EXCLUDE_IMAGES.split(',');
      unusedImages = unusedImages.filter(x => !excludeImages.some(y => x.RepoDigests[0].includes(y)));
    }
    console.log(`${unusedImages.length} unused images can be delete`);
    if(unusedImages && unusedImages.length > 0){
      unusedImages.forEach(async(image) => {
        await deleteImage(image);
      });
    }
  } catch(e){
    console.error(e);
  }  
} 
