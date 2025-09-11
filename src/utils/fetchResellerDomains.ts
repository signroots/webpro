import axios from 'axios';

export const fetchResellerDomains = async () => {
  try {
    const response = await axios.get('https://test.httpapi.com/api/domains/search.json', {
      params: {
        'auth-userid': '199005',
        'api-key': 'LW7HyKZANSCRqcTmCM3wcjRCAxSLsLzZ',
        'no-of-records': 10,
        'page-no': 1
      },
      headers: {
        'User-Agent': 'Mozilla/5.0', // ✅ Pretend to be a browser
        'Accept': 'application/json',
      }
    });

    console.log('✅ ResellerClub Response:', response.data);
    return Object.values(response.data).map((item: any) => ({
      domainName: item.domainname,
      status: item.currentstatus,
      managedBy: 'Signroots',
      registrationDate: new Date(item.creationdt),
      expiryDate: new Date(item.endtime),
      nameServers: item.ns || [],
      dnsDetails: [],
      lockStatus: item.lockstatus || 'unknown',
    }));
  } catch (error: any) {
    console.error('❌ Error fetching domains:', error.response?.data || error.message);
    return [];
  }
};
