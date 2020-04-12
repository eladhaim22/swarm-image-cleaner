const cron = require('node-cron');
const express = require('express');
const { axios } = require('./axiosWrapper');
const cronExpression = process.env.CRON ? process.env.CRON : '* 24 * * * *';
require('console-stamp')(console, '[HH:MM:ss.l]');

let taskIsRunning = false;

app = express();

// schedule tasks to be run on the server
cron.schedule(cronExpression, async() => {
  if(!taskIsRunning){
    try{
      taskIsRunning = true;
      console.log("Starts cron job");
      const pendingToDelete = await getUnusedImages();
      if(pendingToDelete && pendingToDelete.length > 0){
      await deleteImages(pendingToDelete);
      }
      taskIsRunning = false;
    } catch(e){
      taskIsRunning = false;
    }
  }
});

const getUnusedImages = async() => {
  try{
    console.log('Searching for unused images')
    const imagesResult = await axios.get('/endpoints/1/docker/images/json?all=0');
    const images = imagesResult.data;
    const containers = await axios.get('/endpoints/1/docker/containers/json');
    const unusedImages = images.filter(x => !containers.data.map(y => y.ImageID).includes(x.Id));
    if(process.env.EXCLUDE_IMAGES){
      unusedImages = unusedImages.filter(x => !x.RepoDigests.some(y => y.includes(process.env.EXCLUDE_IMAGES)));
    }
    console.log(`${unusedImages.length} images than can deleted detected`);
    return unusedImages;
  } catch(e){
    console.error(e.response.data.message);
  }
}

const deleteImages = async(images) => {
  images.forEach(async(image) => {
    const imageName = image.RepoTags && image.RepoTags.length > 0 ? image.RepoTags[0] : 'unknown'
    console.log(`Deleting ${imageName} from ${image.Portainer.Agent.NodeName}`);
    try {
      await axios.delete(`/endpoints/1/docker/images/${image.Id}?force=true`);
    } catch (e){
      console.error(`Could not delete image due ${e}`);
    }
  });
}

console.log('running server');
app.listen("3128");