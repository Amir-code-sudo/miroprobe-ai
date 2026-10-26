/**
 * MiroProbe AI — AegisVPN Geo-Identity Integration Adapter
 * Bridges AegisVPN Residential Identity Profiles & Carrier-Grade Nodes
 * with MiroProbe AI Autonomous Traffic Simulator.
 */

const AEGIS_NODES = [
  {
    id: 'us-ny',
    countryCode: 'US',
    countryAr: 'الولايات المتحدة (نيويورك)',
    countryEn: 'United States - New York',
    cityNameAr: 'نيويورك، مانهاتن',
    cityNameEn: 'New York, NY',
    flag: '🇺🇸',
    publicIpPool: ['104.244.72.115', '198.51.100.42', '45.33.32.156', '64.233.160.91'],
    dnsPrimary: '10.64.0.1 (NYC-Core-DNS)',
    dnsSecondary: '1.1.1.1 (Cloudflare US)',
    wireguardEndpoint: 'us-nyc-01.aegisvpn.net:51820',
    identities: [
      {
        fullName: 'Michael R. Vance',
        streetAddress: '350 Fifth Avenue',
        apartmentSuite: 'Suite 4810',
        city: 'New York',
        stateOrProvince: 'NY',
        postalCode: '10118',
        countryName: 'United States',
        countryCode: 'US',
        phoneNumber: '+1 (212) 555-0194',
        latitude: 40.7484,
        longitude: -73.9857,
        timezone: 'America/New_York',
        locale: 'en-US',
        ispName: 'Verizon Fios Business / Cogent US',
        asnNumber: 'AS701'
      },
      {
        fullName: 'Sarah Jenkins',
        streetAddress: '725 Broadway',
        apartmentSuite: 'Apt 12B',
        city: 'New York',
        stateOrProvince: 'NY',
        postalCode: '10003',
        countryName: 'United States',
        countryCode: 'US',
        phoneNumber: '+1 (646) 555-0148',
        latitude: 40.7295,
        longitude: -73.9936,
        timezone: 'America/New_York',
        locale: 'en-US',
        ispName: 'AT&T Fiber Enterprise',
        asnNumber: 'AS7018'
      },
      {
        fullName: 'David K. Miller',
        streetAddress: '114 West 47th Street',
        apartmentSuite: 'Floor 19',
        city: 'New York',
        stateOrProvince: 'NY',
        postalCode: '10036',
        countryName: 'United States',
        countryCode: 'US',
        phoneNumber: '+1 (917) 555-0172',
        latitude: 40.7581,
        longitude: -73.9826,
        timezone: 'America/New_York',
        locale: 'en-US',
        ispName: 'Zayo Bandwidth NYC',
        asnNumber: 'AS6461'
      }
    ]
  },
  {
    id: 'us-la',
    countryCode: 'US',
    countryAr: 'الولايات المتحدة (لوس أنجلوس)',
    countryEn: 'United States - Los Angeles',
    cityNameAr: 'لوس أنجلوس، كاليفورنيا',
    cityNameEn: 'Los Angeles, CA',
    flag: '🇺🇸',
    publicIpPool: ['172.67.210.84', '208.67.222.140', '104.16.132.229'],
    dnsPrimary: '10.65.0.1 (LAX-Core-DNS)',
    dnsSecondary: '8.8.8.8 (Google US-West)',
    wireguardEndpoint: 'us-lax-02.aegisvpn.net:51820',
    identities: [
      {
        fullName: 'Brandon T. Brooks',
        streetAddress: '633 West Fifth Street',
        apartmentSuite: 'Suite 2600',
        city: 'Los Angeles',
        stateOrProvince: 'CA',
        postalCode: '90071',
        countryName: 'United States',
        countryCode: 'US',
        phoneNumber: '+1 (213) 555-0182',
        latitude: 34.0511,
        longitude: -118.2544,
        timezone: 'America/Los_Angeles',
        locale: 'en-US',
        ispName: 'Spectrum Enterprise Fiber',
        asnNumber: 'AS20001'
      },
      {
        fullName: 'Elena Rostova',
        streetAddress: '9601 Wilshire Boulevard',
        apartmentSuite: 'Penthouse 4',
        city: 'Beverly Hills',
        stateOrProvince: 'CA',
        postalCode: '90210',
        countryName: 'United States',
        countryCode: 'US',
        phoneNumber: '+1 (310) 555-0166',
        latitude: 34.0696,
        longitude: -118.4053,
        timezone: 'America/Los_Angeles',
        locale: 'en-US',
        ispName: 'Sonic Telecom Fiber CA',
        asnNumber: 'AS46375'
      }
    ]
  },
  {
    id: 'de-fra',
    countryCode: 'DE',
    countryAr: 'ألمانيا (فرانكفورت)',
    countryEn: 'Germany - Frankfurt',
    cityNameAr: 'فرانكفورت أم ماين',
    cityNameEn: 'Frankfurt am Main',
    flag: '🇩🇪',
    publicIpPool: ['89.163.214.58', '138.201.88.19', '185.220.101.44'],
    dnsPrimary: '10.70.0.1 (FRA-DE-CIX)',
    dnsSecondary: '9.9.9.9 (Quad9 Frankfurt)',
    wireguardEndpoint: 'de-fra-01.aegisvpn.net:51820',
    identities: [
      {
        fullName: 'Lukas Schneider',
        streetAddress: 'Mainzer Landstraße 50',
        apartmentSuite: 'Etage 14',
        city: 'Frankfurt am Main',
        stateOrProvince: 'Hessen',
        postalCode: '60325',
        countryName: 'Germany',
        countryCode: 'DE',
        phoneNumber: '+49 69 5550 1829',
        latitude: 50.1155,
        longitude: 8.6632,
        timezone: 'Europe/Berlin',
        locale: 'de-DE',
        ispName: 'Deutsche Telekom AG / DE-CIX',
        asnNumber: 'AS3320'
      }
    ]
  },
  {
    id: 'gb-lon',
    countryCode: 'GB',
    countryAr: 'بريطانيا (لندن)',
    countryEn: 'United Kingdom - London',
    cityNameAr: 'لندن، كناري وارف',
    cityNameEn: 'London, Docklands',
    flag: '🇬🇧',
    publicIpPool: ['185.199.108.153', '51.140.82.19', '81.2.69.142'],
    dnsPrimary: '10.74.0.1 (LON-LINX-DNS)',
    dnsSecondary: '1.0.0.1 (Cloudflare UK)',
    wireguardEndpoint: 'uk-lon-01.aegisvpn.net:51820',
    identities: [
      {
        fullName: 'Oliver J. Sterling',
        streetAddress: '221B Baker Street',
        apartmentSuite: 'Flat 3',
        city: 'London',
        stateOrProvince: 'Greater London',
        postalCode: 'NW1 6XE',
        countryName: 'United Kingdom',
        countryCode: 'GB',
        phoneNumber: '+44 20 7946 0921',
        latitude: 51.5237,
        longitude: -0.1585,
        timezone: 'Europe/London',
        locale: 'en-GB',
        ispName: 'British Telecommunications PLC (BT)',
        asnNumber: 'AS2856'
      }
    ]
  },
  {
    id: 'nl-ams',
    countryCode: 'NL',
    countryAr: 'هولندا (أمستردام)',
    countryEn: 'Netherlands - Amsterdam',
    cityNameAr: 'أمستردام (AMS-IX)',
    cityNameEn: 'Amsterdam',
    flag: '🇳🇱',
    publicIpPool: ['94.242.246.23', '145.40.68.110', '185.107.56.88'],
    dnsPrimary: '10.76.0.1 (AMS-IX-DNS)',
    dnsSecondary: '8.8.4.4 (Google EU)',
    wireguardEndpoint: 'nl-ams-01.aegisvpn.net:51820',
    identities: [
      {
        fullName: 'Bram van der Berg',
        streetAddress: 'Keizersgracht 482',
        apartmentSuite: '2-Hoog',
        city: 'Amsterdam',
        stateOrProvince: 'Noord-Holland',
        postalCode: '1017 EG',
        countryName: 'Netherlands',
        countryCode: 'NL',
        phoneNumber: '+31 20 794 0811',
        latitude: 52.3649,
        longitude: 4.8856,
        timezone: 'Europe/Amsterdam',
        locale: 'nl-NL',
        ispName: 'KPN B.V. / AMS-IX Backbone',
        asnNumber: 'AS1136'
      }
    ]
  },
  {
    id: 'jp-tok',
    countryCode: 'JP',
    countryAr: 'اليابان (طوكيو)',
    countryEn: 'Japan - Tokyo',
    cityNameAr: 'طوكيو، شينجوكو',
    cityNameEn: 'Tokyo, Shinjuku',
    flag: '🇯🇵',
    publicIpPool: ['103.152.220.41', '133.242.18.95', '210.140.92.118'],
    dnsPrimary: '10.82.0.1 (TYO-JPIX-DNS)',
    dnsSecondary: '1.1.1.1 (Cloudflare TYO)',
    wireguardEndpoint: 'jp-tyo-01.aegisvpn.net:51820',
    identities: [
      {
        fullName: 'Kenji Sato (佐藤 健二)',
        streetAddress: '3-14-1 Shinjuku',
        apartmentSuite: 'Room 802',
        city: 'Tokyo',
        stateOrProvince: 'Tokyo Prefecture',
        postalCode: '160-0022',
        countryName: 'Japan',
        countryCode: 'JP',
        phoneNumber: '+81 3 5550 4921',
        latitude: 35.6909,
        longitude: 139.7041,
        timezone: 'Asia/Tokyo',
        locale: 'ja-JP',
        ispName: 'NTT Communications / OCN Japan',
        asnNumber: 'AS4713'
      }
    ]
  }
];

function getAegisPersona(targetCountry = 'US') {
  const code = (targetCountry || 'US').toUpperCase();
  let matchingNodes = AEGIS_NODES.filter(n => n.countryCode === code);
  
  if (matchingNodes.length === 0) {
    matchingNodes = AEGIS_NODES; // Fallback to any node
  }
  
  const node = matchingNodes[Math.floor(Math.random() * matchingNodes.length)];
  const identity = node.identities[Math.floor(Math.random() * node.identities.length)];
  const assignedIp = node.publicIpPool[Math.floor(Math.random() * node.publicIpPool.length)];

  return {
    nodeId: node.id,
    countryCode: node.countryCode,
    countryName: node.countryEn,
    cityName: node.cityNameEn,
    cityNameAr: node.cityNameAr,
    flag: node.flag,
    fullName: identity.fullName,
    streetAddress: `${identity.streetAddress}, ${identity.apartmentSuite}`,
    city: identity.city,
    state: identity.stateOrProvince,
    postalCode: identity.postalCode,
    phoneNumber: identity.phoneNumber,
    latitude: identity.latitude,
    longitude: identity.longitude,
    timezone: identity.timezone,
    locale: identity.locale,
    ispName: identity.ispName,
    asnNumber: identity.asnNumber,
    assignedIp: assignedIp,
    dnsPrimary: node.dnsPrimary,
    dnsSecondary: node.dnsSecondary
  };
}

module.exports = {
  AEGIS_NODES,
  getAegisPersona
};
