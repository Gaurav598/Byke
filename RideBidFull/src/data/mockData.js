export const MOCK_OTP = '4829';

export const POPULAR_PLACES = [
  { id: '1', name: 'Manyata Tech Park', address: 'Nagavara, Bangalore', distanceKm: 18, type: 'work' },
  { id: '2', name: 'MG Road Metro', address: 'MG Road, Bangalore', distanceKm: 6, type: 'transit' },
  { id: '3', name: 'Indiranagar', address: '100ft Road, Indiranagar', distanceKm: 4, type: 'area' },
  { id: '4', name: 'Whitefield IT Park', address: 'Whitefield, Bangalore', distanceKm: 22, type: 'work' },
  { id: '5', name: 'Koramangala', address: '5th Block, Koramangala', distanceKm: 3, type: 'area' },
  { id: '6', name: 'Kempegowda Airport', address: 'Devanahalli, Bangalore', distanceKm: 38, type: 'airport' },
];

export const SEARCH_RESULTS = [
  { id: 's1', name: 'Manyata Tech Park Gate 1', address: 'Nagavara Main Road', distanceKm: 18 },
  { id: 's2', name: 'Manyata Embassy Business Park', address: 'Outer Ring Road', distanceKm: 19 },
  { id: 's3', name: 'Manyata Tech Park Gate 2', address: 'Rachenahalli', distanceKm: 18.5 },
];

export const VEHICLE_TYPES = [
  { id: 'bike',  label: 'Bike',  icon: '🏍', baseMin: 60,  baseMax: 120, etaMin: 15, desc: 'Fastest' },
  { id: 'auto',  label: 'Auto',  icon: '🛺', baseMin: 100, baseMax: 200, etaMin: 20, desc: 'Comfortable' },
  { id: 'cab',   label: 'Cab',   icon: '🚗', baseMin: 200, baseMax: 380, etaMin: 25, desc: 'Premium' },
  { id: 'share', label: 'Share', icon: '🚌', baseMin: 40,  baseMax: 80,  etaMin: 30, desc: 'Cheapest' },
];

export const MOCK_BIDS = [
  { id: 'b1', name: 'Ramesh K.', initials: 'RK', avatarColor: '#E1F5EE', avatarTextColor: '#0F6E56', rating: 4.8, vehicle: 'Auto', vehicleNumber: 'KA05 MN 3421', etaMin: 2, totalRides: 234, bidAmount: 175, isVerified: true, isTopRated: false, isWomenPreferred: false, timerPercent: 75, timerColor: '#639922', phone: '+91 98765 43210' },
  { id: 'b2', name: 'Priya M.',  initials: 'PM', avatarColor: '#EEEDFE', avatarTextColor: '#3C3489', rating: 4.9, vehicle: 'Auto', vehicleNumber: 'KA03 PQ 8821', etaMin: 1, totalRides: 412, bidAmount: 195, isVerified: true, isTopRated: true,  isWomenPreferred: true,  timerPercent: 90, timerColor: '#639922', phone: '+91 91234 56789' },
  { id: 'b3', name: 'Suresh K.', initials: 'SK', avatarColor: '#E6F1FB', avatarTextColor: '#185FA5', rating: 4.6, vehicle: 'Bike',  vehicleNumber: 'KA01 AB 1234', etaMin: 4, totalRides: 89,  bidAmount: 155, isVerified: true, isTopRated: false, isWomenPreferred: false, timerPercent: 55, timerColor: '#BA7517', phone: '+91 90000 12345' },
  { id: 'b4', name: 'Ajay J.',   initials: 'AJ', avatarColor: '#FAEEDA', avatarTextColor: '#854F0B', rating: 4.5, vehicle: 'Bike',  vehicleNumber: 'KA07 XY 5678', etaMin: 6, totalRides: 56,  bidAmount: 140, isVerified: true, isTopRated: false, isWomenPreferred: false, timerPercent: 35, timerColor: '#E24B4A', phone: '+91 88888 99999' },
];

export const RIDER_REQUESTS = [
  { id: 'r1', userName: 'Arjun R.', userInitials: 'AR', userRating: 4.7, from: 'Koramangala 5th', to: 'Manyata Tech Park', fromFull: 'Koramangala 5th Block, Bangalore', toFull: 'Manyata Tech Park, Nagavara', distanceKm: 18, estimatedMins: 25, maxFare: 220, currentBids: 3, quickBids: [160, 175, 190, 205], defaultBidIndex: 2 },
  { id: 'r2', userName: 'Sneha P.', userInitials: 'SP', userRating: 4.9, from: 'HSR Layout', to: 'Whitefield', fromFull: 'HSR Layout Sector 2', toFull: 'Whitefield IT Park', distanceKm: 14, estimatedMins: 20, maxFare: 180, currentBids: 2, quickBids: [140, 155, 165, 175], defaultBidIndex: 2 },
  { id: 'r3', userName: 'Vikram S.', userInitials: 'VS', userRating: 4.5, from: 'BTM Layout', to: 'MG Road', fromFull: 'BTM Layout 2nd Stage', toFull: 'MG Road Metro Station', distanceKm: 9, estimatedMins: 15, maxFare: 140, currentBids: 5, quickBids: [110, 120, 130, 138], defaultBidIndex: 2 },
  { id: 'r4', userName: 'Meera K.', userInitials: 'MK', userRating: 4.8, from: 'Indiranagar', to: 'Airport', fromFull: 'Indiranagar 100ft Road', toFull: 'Kempegowda International Airport', distanceKm: 32, estimatedMins: 45, maxFare: 520, currentBids: 1, quickBids: [420, 450, 480, 510], defaultBidIndex: 1 },
];
