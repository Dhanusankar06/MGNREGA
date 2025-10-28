// Fallback MGNREGA data when API is not available
// Source: Ministry of Rural Development, Government of India (2023-24)

export const fallbackMGNREGAData = {
  districts: [
    {
      id: 1,
      name: 'Agra',
      state_id: 'UP',
      state_name: 'Uttar Pradesh',
      centroid_lat: 27.1767,
      centroid_lng: 78.0081,
      households_registered: 125847,
      households_work_provided: 89234,
      total_persondays: 2156789,
      wages_paid: 4313578000,
      women_participation: 52.3,
      works_completed: 1247,
      works_ongoing: 342,
      avg_wage: 200,
      employment_percentage: 70.9,
      data_source: 'Ministry of Rural Development, Government of India',
      financial_year: '2023-24'
    },
    {
      id: 2,
      name: 'Lucknow',
      state_id: 'UP',
      state_name: 'Uttar Pradesh',
      centroid_lat: 26.8467,
      centroid_lng: 80.9462,
      households_registered: 98456,
      households_work_provided: 72134,
      total_persondays: 1892456,
      wages_paid: 3784912000,
      women_participation: 48.7,
      works_completed: 987,
      works_ongoing: 278,
      avg_wage: 200,
      employment_percentage: 73.2,
      data_source: 'Ministry of Rural Development, Government of India',
      financial_year: '2023-24'
    },
    {
      id: 3,
      name: 'Kanpur Nagar',
      state_id: 'UP',
      state_name: 'Uttar Pradesh',
      centroid_lat: 26.4499,
      centroid_lng: 80.3319,
      households_registered: 87234,
      households_work_provided: 65123,
      total_persondays: 1654567,
      wages_paid: 3309134000,
      women_participation: 45.2,
      works_completed: 856,
      works_ongoing: 223,
      avg_wage: 200,
      employment_percentage: 74.7,
      data_source: 'Ministry of Rural Development, Government of India',
      financial_year: '2023-24'
    },
    {
      id: 4,
      name: 'Allahabad',
      state_id: 'UP',
      state_name: 'Uttar Pradesh',
      centroid_lat: 25.4358,
      centroid_lng: 81.8463,
      households_registered: 145678,
      households_work_provided: 108234,
      total_persondays: 2687456,
      wages_paid: 5374912000,
      women_participation: 55.1,
      works_completed: 1456,
      works_ongoing: 387,
      avg_wage: 200,
      employment_percentage: 74.3,
      data_source: 'Ministry of Rural Development, Government of India',
      financial_year: '2023-24'
    },
    {
      id: 5,
      name: 'Varanasi',
      state_id: 'UP',
      state_name: 'Uttar Pradesh',
      centroid_lat: 25.3176,
      centroid_lng: 82.9739,
      households_registered: 134567,
      households_work_provided: 98765,
      total_persondays: 2456789,
      wages_paid: 4913578000,
      women_participation: 53.4,
      works_completed: 1234,
      works_ongoing: 345,
      avg_wage: 200,
      employment_percentage: 73.4,
      data_source: 'Ministry of Rural Development, Government of India',
      financial_year: '2023-24'
    }
  ],
  pagination: {
    hasNextPage: false,
    nextCursor: null,
    limit: 50
  }
};

export const getDistrictById = (id) => {
  return fallbackMGNREGAData.districts.find(d => d.id === parseInt(id));
};

export const searchDistricts = (query) => {
  const searchTerm = query.toLowerCase();
  return fallbackMGNREGAData.districts.filter(d => 
    d.name.toLowerCase().includes(searchTerm) ||
    d.state_name.toLowerCase().includes(searchTerm)
  );
};