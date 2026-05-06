// Generates jets.json, empty-legs.json, coupons.json with new Asia-Pacific data + USD prices + jet images.
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const SEED = 'seed-data';
const ops = JSON.parse(readFileSync(join(SEED, 'operators.json'), 'utf8'));
const curatedImages = JSON.parse(readFileSync(join(SEED, 'jet-images-curated.json'), 'utf8'));

// Tail prefix by country (ICAO/civil registry letters)
const TAIL_PREFIX = {
  'Singapore': '9V',
  'Japan': 'JA',
  'Hong Kong': 'B-H',
  'UAE': 'A6',
  'China': 'B',
  'South Korea': 'HL',
  'Thailand': 'HS',
  'Malaysia': '9M',
  'Philippines': 'RP-C',
  'India': 'VT',
  'Indonesia': 'PK',
  'Taiwan': 'B',
  'Vietnam': 'VN',
  'Macau': 'B-M'
};

// Realistic USD basePrice ranges per jet category & model
const MODEL_INFO = {
  'Phenom 300E':     { manufacturer: 'Embraer',    category: 'Light',         seats: 8,  range: 3700, speed: 834, basePrice: 3200, hasWifi: true,  hasCatering: true,  hasBedroom: false, conf: 'Instant', desc: 'The Embraer Phenom 300E pairs class-leading single-pilot performance with a six-foot stand-up cabin, Bossa Nova interior options and the latest Prodigy Touch avionics — a benchmark in the light jet class.' },
  'PC-24':           { manufacturer: 'Pilatus',    category: 'Light',         seats: 8,  range: 3700, speed: 815, basePrice: 3500, hasWifi: true,  hasCatering: true,  hasBedroom: false, conf: 'ManualApproval', desc: 'The Pilatus PC-24 — the world\'s only Super Versatile Jet — combines short, unpaved-runway capability with executive jet luxury, ideal for accessing remote Asian destinations.' },
  'King Air 350ER':  { manufacturer: 'Beechcraft', category: 'VeryLight',     seats: 11, range: 3300, speed: 580, basePrice: 2400, hasWifi: false, hasCatering: true,  hasBedroom: false, conf: 'Instant', desc: 'The Beechcraft King Air 350ER is the world\'s most popular twin-turboprop, prized for its eleven-seat cabin, exceptional range with extended fuel tanks and unmatched runway flexibility.' },
  'Global 6000':     { manufacturer: 'Bombardier', category: 'UltraLong',     seats: 13, range: 11100,speed: 950, basePrice: 12500,hasWifi: true,  hasCatering: true,  hasBedroom: true,  conf: 'ManualApproval', desc: 'The Bombardier Global 6000 delivers 6,000-nautical-mile non-stop performance with a stand-up three-zone cabin, full-size galley and private master suite — the long-range business jet of choice.' },
  'G550':            { manufacturer: 'Gulfstream', category: 'UltraLong',     seats: 14, range: 12500,speed: 940, basePrice: 13500,hasWifi: true,  hasCatering: true,  hasBedroom: true,  conf: 'ManualApproval', desc: 'The Gulfstream G550 is a four-zone, ultra-long-range icon with 100 percent fresh-air cabin, panoramic oval windows and a heritage of crossing oceans non-stop in unparalleled comfort.' },
  'G280':            { manufacturer: 'Gulfstream', category: 'SuperMidsize', seats: 10, range: 6700, speed: 893, basePrice: 5800, hasWifi: true,  hasCatering: true,  hasBedroom: false, conf: 'Instant', desc: 'The Gulfstream G280 super-midsize defines the segment — the longest range and largest cabin in its class with high-speed cruise and Gulfstream\'s signature build quality.' },
  'Falcon 2000LX':   { manufacturer: 'Dassault',   category: 'SuperMidsize', seats: 10, range: 7400, speed: 882, basePrice: 6200, hasWifi: true,  hasCatering: true,  hasBedroom: false, conf: 'ManualApproval', desc: 'The Dassault Falcon 2000LX combines French refinement with a tri-zone wide-body cabin, twin Pratt & Whitney engines and steep-approach certification for short-runway access.' },
  'Citation XLS+':   { manufacturer: 'Cessna',     category: 'Light',         seats: 9,  range: 3500, speed: 815, basePrice: 3000, hasWifi: true,  hasCatering: true,  hasBedroom: false, conf: 'Instant', desc: 'The Cessna Citation XLS+ is the best-selling midsize jet of all time — a refreshed cabin, Collins Pro Line 21 avionics and class-leading short-field performance.' },
  'Citation CJ3+':   { manufacturer: 'Cessna',     category: 'Light',         seats: 7,  range: 3700, speed: 786, basePrice: 2700, hasWifi: true,  hasCatering: false, hasBedroom: false, conf: 'Instant', desc: 'The Cessna Citation CJ3+ delivers single-pilot light jet efficiency with a six-foot cabin, Garmin G3000 avionics and the lowest operating costs in its class.' },
  'Challenger 350':  { manufacturer: 'Bombardier', category: 'SuperMidsize', seats: 10, range: 5900, speed: 870, basePrice: 5500, hasWifi: true,  hasCatering: true,  hasBedroom: false, conf: 'ManualApproval', desc: 'The Bombardier Challenger 350 is the most-delivered super-midsize on the market — a flat-floor cabin, transcontinental range and signature Bombardier ride quality.' }
};

// 200 jets: 20 of each model. Distribute roughly evenly across 20 operators.
const MODELS = Object.keys(MODEL_INFO);
const jets = [];
let jetId = 1;
for (const model of MODELS) {
  for (let i = 0; i < 20; i++) {
    // Distribute jets across operators in a stable order
    const operatorId = ((jetId - 1) % 20) + 1;
    const op = ops[operatorId - 1];
    const tailPrefix = TAIL_PREFIX[op.country] || 'PS';
    // Tail: prefix + 4-char alphanumeric, deterministic per jet
    const tail = `${tailPrefix}-${String.fromCharCode(65 + ((jetId * 7) % 26))}${String.fromCharCode(65 + ((jetId * 13) % 26))}${String((jetId * 31) % 1000).padStart(3, '0')}`;
    const info = MODEL_INFO[model];
    // basePrice: model base + small per-jet variance
    const variance = 1 + ((jetId % 5) - 2) * 0.04; // ±8 % spread
    const basePrice = Math.round((info.basePrice * variance) / 100) * 100;
    // Image set: 4 images per model, cycle through so adjacent jets get different leading image
    const modelImages = curatedImages[model];
    const offset = (jetId - 1) % modelImages.length;
    const images = [];
    for (let k = 0; k < modelImages.length; k++) {
      images.push(modelImages[(offset + k) % modelImages.length]);
    }
    const exterior = images.find(img => img.type === 'ext') || images[0];
    const interior = images.find(img => img.type === 'int') || images[images.length - 1];
    jets.push({
      id: jetId,
      operatorId,
      manufacturer: info.manufacturer,
      modelName: model,
      category: info.category,
      tailNumber: tail,
      yearOfManufacture: 2018 + ((jetId * 3) % 7), // 2018-2024
      seatingCapacity: info.seats,
      rangeKm: info.range,
      speedKmh: info.speed,
      description: info.desc,
      mainImageUrl: exterior.url,
      interiorImageUrl: interior.url,
      images: images.map((img, idx) => ({ url: img.url, isInterior: img.type === 'int', displayOrder: idx, caption: img.caption })),
      basePrice,
      status: 'Active',
      confirmationMode: info.conf,
      hasWifi: info.hasWifi,
      hasCatering: info.hasCatering,
      hasBedroom: info.hasBedroom
    });
    jetId++;
  }
}
writeFileSync(join(SEED, 'jets.json'), JSON.stringify(jets, null, 2) + '\n');
console.log(`jets.json: ${jets.length} jets written`);

// ──────────────── Empty Legs (Asian city pairs, USD prices) ────────────────
// City catalog with airport codes and lat/long pairs for Haversine-ish distance
const CITIES = [
  { name: 'Singapore',          code: 'SIN', lat: 1.359,  lng: 103.989 },
  { name: 'Hong Kong',          code: 'HKG', lat: 22.308, lng: 113.918 },
  { name: 'Tokyo',              code: 'HND', lat: 35.553, lng: 139.781 },
  { name: 'Seoul',              code: 'ICN', lat: 37.460, lng: 126.440 },
  { name: 'Shanghai',           code: 'PVG', lat: 31.143, lng: 121.805 },
  { name: 'Beijing',            code: 'PEK', lat: 40.080, lng: 116.585 },
  { name: 'Bangkok',            code: 'BKK', lat: 13.689, lng: 100.749 },
  { name: 'Kuala Lumpur',       code: 'KUL', lat: 2.745,  lng: 101.707 },
  { name: 'Jakarta',            code: 'CGK', lat: -6.125, lng: 106.655 },
  { name: 'Manila',             code: 'MNL', lat: 14.508, lng: 121.019 },
  { name: 'Dubai',              code: 'DXB', lat: 25.252, lng: 55.364  },
  { name: 'Mumbai',             code: 'BOM', lat: 19.088, lng: 72.867  },
  { name: 'New Delhi',          code: 'DEL', lat: 28.556, lng: 77.100  },
  { name: 'Bangalore',          code: 'BLR', lat: 13.198, lng: 77.706  },
  { name: 'Taipei',             code: 'TPE', lat: 25.077, lng: 121.232 },
  { name: 'Ho Chi Minh City',   code: 'SGN', lat: 10.818, lng: 106.652 },
  { name: 'Denpasar',           code: 'DPS', lat: -8.748, lng: 115.167 },
  { name: 'Phuket',             code: 'HKT', lat: 8.110,  lng: 98.317  },
  { name: 'Macau',              code: 'MFM', lat: 22.149, lng: 113.591 },
  { name: 'Colombo',            code: 'CMB', lat: 7.181,  lng: 79.884  }
];

function distKm(a, b) {
  const R = 6371;
  const toRad = x => x * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const x = Math.sin(dLat/2)**2 + Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLng/2)**2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

// Pricing: empty-leg charter rate (in USD) ≈ jet category $/hr × hours, then 50% empty-leg discount.
// $/hr per category: Turboprop 1800, Light 2400, SuperMidsize 5500, UltraLong 11000.
// Speed (km/h) from MODEL_INFO. Hours = distance/speed. Discount factor 0.45–0.65 random.
const HOURLY = { VeryLight: 1800, Light: 2400, Midsize: 4200, SuperMidsize: 5500, Heavy: 9000, UltraLong: 11000 };
function legPrice(model, distance) {
  const info = MODEL_INFO[model];
  const hours = distance / info.speed;
  const charter = HOURLY[info.category] * hours;
  const discount = 0.50 + ((Math.sin(distance) + 1) / 2) * 0.18; // 0.50–0.68 quasi-random
  return Math.round((charter * discount) / 100) * 100; // round to nearest $100
}

// Generate 60 empty legs across all operators+jets
console.log('Generating empty-legs...');
const emptyLegs = [];
let elId = 1;
const baseDate = new Date('2026-05-15T00:00:00Z');
// Pick 60 jets distributed across all 200 (every ~3rd jet)
const jetsForLegs = [];
for (let k = 0; k < 60; k++) {
  jetsForLegs.push(jets[(k * 3) % jets.length]);
}
for (const jet of jetsForLegs) {
  console.log('  leg', elId, 'jet', jet.id, 'model', jet.modelName);
  // Pick origin/destination — prefer origin near operator's HQ city when possible
  const opCity = ops[jet.operatorId - 1].city;
  let origin = CITIES.find(c => c.name === opCity)
            || CITIES[(elId * 3) % CITIES.length];
  let dest = CITIES[(elId * 7 + 3) % CITIES.length];
  if (dest.code === origin.code) dest = CITIES[(elId * 7 + 5) % CITIES.length];
  if (dest.code === origin.code) dest = CITIES[(elId * 11 + 9) % CITIES.length];
  const d = distKm(origin, dest);
  const price = legPrice(jet.modelName, d);
  const flightHours = d / MODEL_INFO[jet.modelName].speed;
  const dep = new Date(baseDate.getTime() + (elId * 4 + (elId % 7) * 3) * 3600 * 1000);
  const arr = new Date(dep.getTime() + flightHours * 3600 * 1000);
  const seats = Math.max(2, Math.min(jet.seatingCapacity - 1, jet.seatingCapacity - (elId % 4)));
  emptyLegs.push({
    id: elId,
    operatorId: jet.operatorId,
    jetId: jet.id,
    origin: origin.name,
    originCode: origin.code,
    destination: dest.name,
    destinationCode: dest.code,
    departureUtc: dep.toISOString(),
    arrivalUtc: arr.toISOString(),
    availableSeats: seats,
    price,
    taxPercent: 8,
    status: elId % 11 === 0 ? 'Blocked' : 'Available',
    lockDurationMinutes: 15,
    notes: elId % 4 === 0 ? 'Repositioning flight after charter' : (elId % 3 === 0 ? 'Catering and Wi-Fi included' : 'Last-minute empty leg deal')
  });
  elId++;
}
writeFileSync(join(SEED, 'empty-legs.json'), JSON.stringify(emptyLegs, null, 2) + '\n');
console.log(`empty-legs.json: ${emptyLegs.length} legs written`);

// ──────────────── Coupons (USD round numbers) ────────────────
const coupons = [
  { code: 'WELCOME500',  description: 'Welcome bonus — $500 off your first booking',          discountType: 'Fixed',      discountValue: 500,   minBookingAmount: 3000,  maxDiscountAmount: null,  expiryDate: '2026-12-31T23:59:59', maxUses: 1000, currentUses: 87,  isActive: true  },
  { code: 'SAVE10',      description: '10% off any empty leg flight',                         discountType: 'Percentage', discountValue: 10,    minBookingAmount: 5000,  maxDiscountAmount: 2000,  expiryDate: '2026-12-31T23:59:59', maxUses: 500,  currentUses: 142, isActive: true  },
  { code: 'SUMMER25',    description: '25% off summer flights (over $10,000)',                discountType: 'Percentage', discountValue: 25,    minBookingAmount: 10000, maxDiscountAmount: 5000,  expiryDate: '2026-09-30T23:59:59', maxUses: 200,  currentUses: 33,  isActive: true  },
  { code: 'BUSINESS1K',  description: 'Flat $1,000 off business jet bookings',                discountType: 'Fixed',      discountValue: 1000,  minBookingAmount: 8000,  maxDiscountAmount: null,  expiryDate: '2026-12-31T23:59:59', maxUses: 300,  currentUses: 58,  isActive: true  },
  { code: 'EARLY15',     description: '15% off bookings made 14+ days in advance',            discountType: 'Percentage', discountValue: 15,    minBookingAmount: 4000,  maxDiscountAmount: 3000,  expiryDate: '2026-12-31T23:59:59', maxUses: 1000, currentUses: 211, isActive: true  },
  { code: 'PEARL2K',     description: 'PearlSky Loyalty — $2,000 off premium charters',       discountType: 'Fixed',      discountValue: 2000,  minBookingAmount: 15000, maxDiscountAmount: null,  expiryDate: '2026-12-31T23:59:59', maxUses: 100,  currentUses: 12,  isActive: true  },
  { code: 'ASIATRIP',    description: '20% off intra-Asia routes',                            discountType: 'Percentage', discountValue: 20,    minBookingAmount: 6000,  maxDiscountAmount: 4000,  expiryDate: '2026-12-31T23:59:59', maxUses: 250,  currentUses: 41,  isActive: true  },
  { code: 'WEEKEND300',  description: '$300 off weekend departures',                          discountType: 'Fixed',      discountValue: 300,   minBookingAmount: 2500,  maxDiscountAmount: null,  expiryDate: '2026-12-31T23:59:59', maxUses: 500,  currentUses: 96,  isActive: true  },
  { code: 'EXPIRED',     description: 'Expired test coupon (will not apply)',                 discountType: 'Percentage', discountValue: 50,    minBookingAmount: null,  maxDiscountAmount: null,  expiryDate: '2025-12-31T23:59:59', maxUses: 100,  currentUses: 5,   isActive: true  },
  { code: 'MAXUSED',     description: 'Fully used coupon (cap reached)',                      discountType: 'Fixed',      discountValue: 250,   minBookingAmount: null,  maxDiscountAmount: null,  expiryDate: '2026-12-31T23:59:59', maxUses: 50,   currentUses: 50,  isActive: true  }
];
writeFileSync(join(SEED, 'coupons.json'), JSON.stringify(coupons, null, 2) + '\n');
console.log(`coupons.json: ${coupons.length} coupons written`);

console.log('Done.');
