const axios = require('axios');
require('console-stamp')(console, '[HH:MM:ss.l]');

axios.interceptors.request.use(config => {
  console.log(`Starting ${config.method} request to ${config.url}`);
  return config;
});

const instance = axios.create({
  baseURL: `${process.env.PORTAINER_URL}/api`,
  timeout: 5000,
});

instance.interceptors.request.use(async config => {
  let token;
  if(!token){
    console.log('Retrieving jwt token......')
    token = await getAuthToken();
  }
  config.headers.Authorization = `Bearer ${token}`
  return config;
}, function (error) {
  console.error(error.response.data.message);
});


const getAuthToken = async () => {
  try {
    const result = await axios.post(`${process.env.PORTAINER_URL}/api/auth`,{
      "Username": process.env.PORTAINER_ADMIN_USERNAME,
      "Password": process.env.PORTAINER_ADMIN_PASSWORD
    });
    return result.data.jwt;
  } catch(e){
    console.error(`Error on getting jwt auth token due:${e.response.data.message}`);
  }
};

exports.axios = instance;