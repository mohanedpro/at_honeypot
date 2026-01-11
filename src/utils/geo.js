import axios from 'axios';

export const getGeoLocation = async (ip) => {

  const localIPs = ['::1', '127.0.0.1', '::ffff:127.0.0.1'];
  if (!ip || localIPs.includes(ip) || ip.startsWith('172.') ||ip.startsWith('192.') || ip.startsWith('10.')){
    return "Internal Network (localhost)";
  }

  try{
    const response = await axios.get(`http://ip-api.com/json/${ip}?fields=status,country,city,isp`);

    if (response.data.status === 'success') {
        return `${response.data.city}, ${response.data.country}, ${response.data.isp}`
    }
    return "Location Unknown";
  }catch (err) {
    // Fallback if the internet is down or API is blocked
    return "Geo-Service Unavailable";
  }
}