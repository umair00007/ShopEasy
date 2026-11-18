// Usage: npm run seed  → wipes products and inserts sample sanitary / electrical / building-material items.
// NOTE: names, brands and prices are SAMPLE data. Edit them in the admin panel to match real stock.
// Products have no images yet: the UI shows a category icon until real photos are uploaded to S3.
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import Product from '../models/Product.js';

// [name, description, price, category, brand, stock, rating]
const data = [
  // Sanitaryware
  ['Western Commode (S-Trap), White', 'Floor-mounted ceramic water closet with S-trap outlet and smooth glazed finish. Seat cover sold separately.', 6490, 'Sanitaryware', 'Cera', 18, 4.5],
  ['Wall-Hung Wash Basin 450 mm', 'Compact ceramic wall-hung basin with single tap hole and overflow. Ideal for small bathrooms.', 1890, 'Sanitaryware', 'Cera', 30, 4.4],
  ['Pedestal Wash Basin with Stand', 'Full pedestal basin that hides the plumbing. Stain-resistant glazed ceramic.', 2650, 'Sanitaryware', 'Jaquar', 14, 4.3],
  ['Soft-Close Toilet Seat Cover', 'Slow-close hinge, easy-clean surface and quick-release fitting.', 1150, 'Sanitaryware', 'Jaquar', 40, 4.2],
  // Bath Fittings
  ['Single-Lever Basin Mixer', 'Chrome-finished brass mixer for hot and cold water with ceramic cartridge.', 3890, 'Bath Fittings', 'Jaquar', 22, 4.6],
  ['Health Faucet with 1 m Hose', 'Chrome ABS health faucet with flexible PVC hose and wall hook.', 790, 'Bath Fittings', 'Jaquar', 60, 4.4],
  ['Overhead Shower 100 mm Round', 'Chrome-plated round overhead shower with anti-scale nozzles.', 1650, 'Bath Fittings', 'Jaquar', 25, 4.3],
  ['Pillar Cock Tap, Chrome', 'Quarter-turn brass pillar cock with a durable chrome finish.', 620, 'Bath Fittings', 'Cera', 75, 4.1],
  // Pipes & Fittings
  ['CPVC Pipe 1 inch (3 m)', 'Hot and cold water CPVC pipe, suitable for residential plumbing.', 540, 'Pipes & Fittings', 'Astral', 120, 4.5],
  ['CPVC Elbow 1 inch', '90° CPVC elbow fitting for hot and cold water lines.', 38, 'Pipes & Fittings', 'Astral', 500, 4.4],
  ['PVC SWR Pipe 4 inch (3 m)', 'Soil, waste and rainwater drainage pipe with ring-fit joints.', 780, 'Pipes & Fittings', 'Sudhakar', 80, 4.3],
  ['Brass Ball Valve 1/2 inch', 'Full-bore brass ball valve with lever handle, for water lines.', 245, 'Pipes & Fittings', 'Noway', 150, 4.2],
  // Water Tanks
  ['Water Storage Tank 500 L', 'Multi-layer plastic overhead water tank with lid and fittings provision.', 4600, 'Water Tanks', 'Sintex', 12, 4.5],
  ['Water Storage Tank 1000 L', 'Multi-layer plastic overhead water tank, UV-stabilised and food grade.', 8200, 'Water Tanks', 'Sintex', 8, 4.6],
  // Wires & Cables
  ['House Wire 1.5 sq mm (90 m coil)', 'FR copper wire for lighting circuits. Choose red, black, green or blue on order.', 1850, 'Wires & Cables', 'Polycab', 40, 4.6],
  ['House Wire 2.5 sq mm (90 m coil)', 'FR copper wire for power sockets and appliance circuits.', 3050, 'Wires & Cables', 'Polycab', 35, 4.6],
  ['House Wire 4 sq mm (90 m coil)', 'FR copper wire for AC and heavy-load circuits.', 4900, 'Wires & Cables', 'Havells', 20, 4.5],
  // Lighting
  ['9W LED Bulb, Cool White (Pack of 4)', 'Energy-saving B22 LED bulbs, 6500K daylight, wide voltage range.', 349, 'Lighting', 'Havells', 200, 4.3],
  ['15W Round LED Panel Light', 'Slim surface-mount LED panel for false ceilings and offices.', 420, 'Lighting', 'Havells', 90, 4.4],
  ['20W LED Batten 4 ft', 'Slim LED tube light replacement, bright and flicker-free.', 360, 'Lighting', 'Philips', 110, 4.4],
  // Electricals
  ['MCB 32A Single Pole', 'Miniature circuit breaker, C-curve, for overload and short-circuit protection.', 285, 'Electricals', 'Havells', 100, 4.5],
  ['Modular Switch 6A (1 Way)', 'White modular switch with a secure terminal grip.', 55, 'Electricals', 'Anchor', 400, 4.2],
  ['Extension Board 4 Socket, 5 m', 'Surge-protected extension board with individual switches and 5 m cord.', 540, 'Electricals', 'Anchor', 65, 4.1],
  // Building Materials
  ['Portland Cement 50 kg Bag', 'General-purpose cement for plastering, concrete and masonry.', 410, 'Building Materials', 'UltraTech', 300, 4.5],
  ['Tile Adhesive 20 kg', 'Polymer-modified adhesive for fixing floor and wall tiles.', 640, 'Building Materials', 'Astral', 55, 4.3],
  ['PTFE Thread Seal Tape (Pack of 10)', 'Teflon tape for leak-free threaded pipe joints.', 120, 'Building Materials', 'Noway', 0, 4.0],
];

const products = data.map(([name, description, price, category, brand, stock, rating], i) => ({
  name, description, price, category, brand, stock, rating,
  numReviews: 8 + ((i * 13) % 80),
  images: [],
}));

await mongoose.connect(env.MONGO_URI);
await Product.deleteMany({});
await Product.insertMany(products);
console.log(`✅ Seeded ${products.length} products`);
await mongoose.disconnect();
