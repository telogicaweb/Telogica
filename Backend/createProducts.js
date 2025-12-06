require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI);

const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  images: [String],
  price: Number,
  retailerPrice: Number,
  category: String,
  isTelecom: Boolean,
  stock: Number,
  offlineStock: Number,
  isRecommended: Boolean,
  requiresQuote: Boolean,
  specifications: { type: Map, of: String },
  warrantyPeriodMonths: Number,
  extendedWarrantyAvailable: Boolean,
  extendedWarrantyMonths: Number,
  extendedWarrantyPrice: Number,
  modelNumberPrefix: String,
  features: [String],
  technicalSpecs: { type: Map, of: String }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

// Sample images from placeholder services
const getProductImages = (category, index) => {
  const seed = `${category}-${index}`;
  return [
    `https://picsum.photos/seed/${seed}-1/800/600`,
    `https://picsum.photos/seed/${seed}-2/800/600`,
    `https://picsum.photos/seed/${seed}-3/800/600`,
    `https://picsum.photos/seed/${seed}-4/800/600`
  ];
};

const telecomProducts = [
  {
    name: 'Fiber Optic Cable 24-Core Single Mode',
    description: 'High-performance 24-core single-mode fiber optic cable designed for long-distance telecommunications infrastructure. Features low attenuation and high bandwidth capacity.',
    category: 'Telecommunication',
    isTelecom: true,
    price: 12500,
    retailerPrice: 10000,
    stock: 150,
    offlineStock: 50,
    modelNumberPrefix: 'TEL-FOC-24SM',
    features: ['24-core configuration', 'Single-mode fiber', 'Low attenuation', 'Weather resistant', 'Armored protection'],
    specifications: new Map([
      ['Core Count', '24'],
      ['Fiber Type', 'Single Mode'],
      ['Cable Length', '2000m'],
      ['Operating Temperature', '-40°C to +70°C'],
      ['Attenuation', '0.35 dB/km @ 1550nm']
    ])
  },
  {
    name: '48-Port Gigabit Ethernet Switch',
    description: 'Enterprise-grade managed Ethernet switch with 48 Gigabit ports and 4 SFP+ uplinks. Ideal for data centers and large network deployments.',
    category: 'Telecommunication',
    isTelecom: true,
    price: 35000,
    retailerPrice: 28000,
    stock: 75,
    offlineStock: 25,
    modelNumberPrefix: 'TEL-SW-48G',
    features: ['48 Gigabit ports', '4 SFP+ 10G uplinks', 'Layer 3 routing', 'VLAN support', 'QoS management'],
    specifications: new Map([
      ['Port Count', '48 x 1GbE + 4 x 10G SFP+'],
      ['Switching Capacity', '176 Gbps'],
      ['Forwarding Rate', '130.9 Mpps'],
      ['RAM', '512 MB'],
      ['Flash Memory', '128 MB']
    ])
  },
  {
    name: 'Outdoor Wireless Access Point 5GHz',
    description: 'Weatherproof outdoor wireless access point supporting 802.11ac Wave 2. Perfect for outdoor coverage in harsh environments.',
    category: 'Telecommunication',
    isTelecom: true,
    price: 18500,
    retailerPrice: 15000,
    stock: 120,
    offlineStock: 40,
    modelNumberPrefix: 'TEL-WAP-5G',
    features: ['IP67 waterproof', 'Dual-band 2.4/5GHz', 'MU-MIMO', 'PoE powered', 'Extended range'],
    specifications: new Map([
      ['Wireless Standard', '802.11ac Wave 2'],
      ['Max Data Rate', '1.7 Gbps'],
      ['Coverage', 'Up to 200m radius'],
      ['Operating Temperature', '-40°C to +65°C'],
      ['Power Input', 'PoE+ (802.3at)']
    ])
  },
  {
    name: 'Optical Line Terminal (OLT) 16-Port GPON',
    description: 'Carrier-grade OLT system for GPON fiber-to-the-home deployments. Supports up to 2048 ONT connections with advanced traffic management.',
    category: 'Telecommunication',
    isTelecom: true,
    price: 285000,
    retailerPrice: 250000,
    stock: 30,
    offlineStock: 10,
    modelNumberPrefix: 'TEL-OLT-16GP',
    features: ['16 GPON ports', 'Hot-swappable modules', 'Redundant power', 'Advanced OAM', 'Cloud management'],
    specifications: new Map([
      ['GPON Ports', '16'],
      ['Split Ratio', '1:128'],
      ['Max ONTs', '2048'],
      ['Uplink', '4 x 10GE SFP+'],
      ['Power Consumption', '450W']
    ])
  },
  {
    name: 'VoIP Gateway 32-Port FXS',
    description: 'Enterprise VoIP gateway with 32 FXS ports for analog phone integration. Supports SIP and H.323 protocols.',
    category: 'Telecommunication',
    isTelecom: true,
    price: 52000,
    retailerPrice: 45000,
    stock: 60,
    offlineStock: 20,
    modelNumberPrefix: 'TEL-VG-32FXS',
    features: ['32 FXS ports', 'SIP/H.323 support', 'Fax over IP', 'Echo cancellation', 'Built-in DSP'],
    specifications: new Map([
      ['FXS Ports', '32'],
      ['Protocols', 'SIP, H.323'],
      ['Voice Codecs', 'G.711, G.729, G.723'],
      ['Network Interface', '2 x 1GbE'],
      ['Concurrent Calls', '32']
    ])
  },
  {
    name: 'Network Time Protocol (NTP) Server GPS',
    description: 'Precision NTP time server with GPS synchronization for critical telecom infrastructure timing requirements.',
    category: 'Telecommunication',
    isTelecom: true,
    price: 95000,
    retailerPrice: 85000,
    stock: 45,
    offlineStock: 15,
    modelNumberPrefix: 'TEL-NTP-GPS',
    features: ['GPS synchronization', 'Stratum 1 accuracy', 'Dual power supply', 'Web interface', 'SNMP monitoring'],
    specifications: new Map([
      ['Accuracy', '±100 nanoseconds'],
      ['Stratum Level', 'Stratum 1'],
      ['Network Ports', '4 x 1GbE'],
      ['GPS Antenna', 'External with 20m cable'],
      ['Protocol Support', 'NTP, SNTP, PTP']
    ])
  },
  {
    name: 'SDH/SONET Multiplexer STM-16',
    description: 'High-capacity SDH multiplexer for carrier-grade optical networks. Supports STM-16 with comprehensive network management.',
    category: 'Telecommunication',
    isTelecom: true,
    price: 425000,
    retailerPrice: 380000,
    stock: 20,
    offlineStock: 5,
    modelNumberPrefix: 'TEL-SDH-STM16',
    features: ['STM-16 capacity', 'Ring protection', 'Hot-swappable cards', 'SNCP/MS-Spring', 'Full TMN support'],
    specifications: new Map([
      ['Line Rate', 'STM-16 (2.5 Gbps)'],
      ['Tributary', 'STM-1, STM-4'],
      ['Protection', '1+1, SNCP, MS-Spring'],
      ['Optical Interface', 'LC/UPC'],
      ['Power', '-48VDC redundant']
    ])
  },
  {
    name: 'Passive Optical Splitter 1:32 SC/APC',
    description: 'High-quality PLC-based optical splitter for FTTH networks. Low insertion loss and uniform splitting ratio.',
    category: 'Telecommunication',
    isTelecom: true,
    price: 3500,
    retailerPrice: 2800,
    stock: 500,
    offlineStock: 200,
    modelNumberPrefix: 'TEL-SPL-32SC',
    features: ['1:32 split ratio', 'SC/APC connectors', 'PLC technology', 'Compact size', 'Low PDL'],
    specifications: new Map([
      ['Split Ratio', '1:32'],
      ['Insertion Loss', '17.5 dB typ.'],
      ['Uniformity', '±0.8 dB'],
      ['Wavelength', '1260-1650 nm'],
      ['Connector Type', 'SC/APC']
    ])
  },
  {
    name: 'Microwave Radio Link 23GHz Full Outdoor',
    description: 'Point-to-point microwave radio system for wireless backhaul. All-outdoor design with integrated antenna.',
    category: 'Telecommunication',
    isTelecom: true,
    price: 195000,
    retailerPrice: 175000,
    stock: 35,
    offlineStock: 10,
    modelNumberPrefix: 'TEL-MW-23G',
    features: ['23GHz operation', 'Integrated antenna', 'Up to 1Gbps', 'XPIC support', 'Adaptive modulation'],
    specifications: new Map([
      ['Frequency', '23 GHz'],
      ['Capacity', 'Up to 1 Gbps'],
      ['Antenna Gain', '35 dBi'],
      ['Modulation', '4QAM to 1024QAM'],
      ['Max Distance', '15 km']
    ])
  },
  {
    name: 'SFP+ 10G Transceiver Module LR 10km',
    description: 'Hot-pluggable SFP+ optical transceiver module for 10 Gigabit Ethernet long-range applications.',
    category: 'Telecommunication',
    isTelecom: true,
    price: 8500,
    retailerPrice: 7000,
    stock: 300,
    offlineStock: 100,
    modelNumberPrefix: 'TEL-SFP-10GLR',
    features: ['10GBASE-LR', 'Single-mode fiber', '10km reach', 'Hot-pluggable', 'DDM support'],
    specifications: new Map([
      ['Data Rate', '10.3 Gbps'],
      ['Wavelength', '1310 nm'],
      ['Distance', '10 km'],
      ['Connector', 'LC duplex'],
      ['Power Consumption', '1.0W max']
    ])
  },
  {
    name: 'IP PBX System 500 Users',
    description: 'Scalable IP PBX system supporting up to 500 concurrent users. Features include call routing, voicemail, and conferencing.',
    category: 'Telecommunication',
    isTelecom: true,
    price: 165000,
    retailerPrice: 145000,
    stock: 25,
    offlineStock: 8,
    modelNumberPrefix: 'TEL-PBX-500',
    features: ['500 user capacity', 'Auto attendant', 'Call recording', 'Video conferencing', 'Mobile integration'],
    specifications: new Map([
      ['Max Users', '500'],
      ['Concurrent Calls', '200'],
      ['Protocols', 'SIP, IAX2'],
      ['Storage', '2TB HDD'],
      ['Network', '2 x 1GbE']
    ])
  },
  {
    name: 'Ethernet Demarcation Device Layer 2',
    description: 'Carrier Ethernet demarcation device providing service activation, performance monitoring, and fault isolation.',
    category: 'Telecommunication',
    isTelecom: true,
    price: 28000,
    retailerPrice: 24000,
    stock: 80,
    offlineStock: 30,
    modelNumberPrefix: 'TEL-EDD-L2',
    features: ['MEF CE 2.0 compliant', 'Y.1731 OAM', 'RFC 2544 testing', 'Service mapping', 'Zero-touch provisioning'],
    specifications: new Map([
      ['Ports', '2 x GbE electrical + 2 x SFP'],
      ['Throughput', '2 Gbps'],
      ['Services', 'Up to 4094 VLANs'],
      ['Timing', 'SyncE, 1588v2'],
      ['Power', 'AC or -48VDC']
    ])
  },
  {
    name: 'DWDM Optical Multiplexer 40-Channel',
    description: 'Dense wavelength division multiplexing system with 40 channels for high-capacity long-haul networks.',
    category: 'Telecommunication',
    isTelecom: true,
    price: 685000,
    retailerPrice: 620000,
    stock: 12,
    offlineStock: 3,
    modelNumberPrefix: 'TEL-DWDM-40CH',
    features: ['40 DWDM channels', 'C-band ITU grid', 'EDFA amplifiers', 'OADM capability', 'Network management'],
    specifications: new Map([
      ['Channels', '40 (100 GHz spacing)'],
      ['Wavelength Range', 'C-band 1530-1565 nm'],
      ['Per Channel Rate', 'Up to 100 Gbps'],
      ['Total Capacity', '4 Tbps'],
      ['Amplification', 'Dual-stage EDFA']
    ])
  },
  {
    name: 'Session Border Controller 10K Sessions',
    description: 'Enterprise-grade SBC for VoIP security, interoperability, and session management. Supports up to 10,000 concurrent sessions.',
    category: 'Telecommunication',
    isTelecom: true,
    price: 225000,
    retailerPrice: 200000,
    stock: 18,
    offlineStock: 6,
    modelNumberPrefix: 'TEL-SBC-10K',
    features: ['10K sessions', 'SIP normalization', 'Topology hiding', 'Fraud prevention', 'QoS enforcement'],
    specifications: new Map([
      ['Max Sessions', '10,000'],
      ['Throughput', '5 Gbps'],
      ['Protocols', 'SIP, H.323, MGCP'],
      ['Transcoding', 'Hardware-accelerated'],
      ['Redundancy', 'Active-active HA']
    ])
  },
  {
    name: 'Outdoor Fiber Distribution Cabinet 288-Core',
    description: 'Weather-resistant fiber optic distribution cabinet for outside plant installations. Supports up to 288 fiber terminations.',
    category: 'Telecommunication',
    isTelecom: true,
    price: 45000,
    retailerPrice: 38000,
    stock: 40,
    offlineStock: 15,
    modelNumberPrefix: 'TEL-FDC-288',
    features: ['288 fiber capacity', 'IP65 rated', 'Cable management', 'Splice trays', 'Modular design'],
    specifications: new Map([
      ['Fiber Capacity', '288 cores'],
      ['Ingress Protection', 'IP65'],
      ['Material', 'Stainless steel'],
      ['Dimensions', '800x600x300 mm'],
      ['Mounting', 'Pole or wall mount']
    ])
  },
  {
    name: 'LTE Small Cell Base Station',
    description: 'Compact 4G LTE small cell for indoor/outdoor coverage enhancement. Supports all LTE bands with integrated backhaul.',
    category: 'Telecommunication',
    isTelecom: true,
    price: 155000,
    retailerPrice: 135000,
    stock: 28,
    offlineStock: 10,
    modelNumberPrefix: 'TEL-LTE-SC',
    features: ['Multi-band LTE', 'SON capabilities', 'Gigabit backhaul', 'GPS sync', 'Remote management'],
    specifications: new Map([
      ['LTE Bands', 'B1, B3, B7, B20, B28'],
      ['Max Users', '128'],
      ['Output Power', '250 mW (24 dBm)'],
      ['Backhaul', '1GbE or fiber'],
      ['Coverage', 'Up to 500m outdoor']
    ])
  }
];

const defenseProducts = [
  {
    name: 'Tactical Radio Communication System VHF/UHF',
    description: 'Military-grade portable tactical radio with encryption capabilities. Operates in VHF/UHF bands with frequency hopping.',
    category: 'Defense',
    isTelecom: false,
    price: 125000,
    retailerPrice: 110000,
    stock: 85,
    offlineStock: 30,
    modelNumberPrefix: 'DEF-TRS-VU',
    features: ['Dual-band VHF/UHF', 'AES-256 encryption', 'Frequency hopping', 'GPS integrated', 'Water resistant IP67'],
    specifications: new Map([
      ['Frequency Range', '30-512 MHz'],
      ['Output Power', '5W'],
      ['Channels', '2000'],
      ['Battery Life', '16 hours'],
      ['Encryption', 'AES-256']
    ])
  },
  {
    name: 'Ballistic Protection Vest Level IV',
    description: 'Advanced ballistic protection vest with ceramic composite plates. NIJ Level IV rated for maximum protection.',
    category: 'Defense',
    isTelecom: false,
    price: 95000,
    retailerPrice: 85000,
    stock: 200,
    offlineStock: 80,
    modelNumberPrefix: 'DEF-BPV-L4',
    features: ['NIJ Level IV', 'Ceramic composite', 'MOLLE compatible', 'Quick release', 'Multi-threat protection'],
    specifications: new Map([
      ['Protection Level', 'NIJ Level IV'],
      ['Weight', '3.6 kg (plates only)'],
      ['Coverage Area', '0.13 m²'],
      ['Material', 'Ceramic composite + Kevlar'],
      ['Size Range', 'S, M, L, XL']
    ])
  },
  {
    name: 'Night Vision Monocular Gen 3+',
    description: 'Third-generation night vision device with high-resolution image intensifier tube. Multi-coated optics for superior clarity.',
    category: 'Defense',
    isTelecom: false,
    price: 185000,
    retailerPrice: 165000,
    stock: 60,
    offlineStock: 20,
    modelNumberPrefix: 'DEF-NVM-G3',
    features: ['Gen 3+ tube', 'Auto-gating', 'IR illuminator', 'Head/weapon mount', 'Waterproof'],
    specifications: new Map([
      ['Generation', '3+'],
      ['Resolution', '64-72 lp/mm'],
      ['Magnification', '1x'],
      ['Field of View', '40°'],
      ['Battery Life', '50 hours']
    ])
  },
  {
    name: 'Secure Military Laptop Ruggedized',
    description: 'Fully ruggedized military-grade laptop with TPM 2.0 and TEMPEST protection. MIL-STD-810G certified.',
    category: 'Defense',
    isTelecom: false,
    price: 215000,
    retailerPrice: 195000,
    stock: 45,
    offlineStock: 15,
    modelNumberPrefix: 'DEF-SML-RG',
    features: ['MIL-STD-810G', 'TPM 2.0', 'Sunlight readable display', 'Hot-swappable battery', 'TEMPEST Level B'],
    specifications: new Map([
      ['Processor', 'Intel Core i7-11th Gen'],
      ['RAM', '32 GB DDR4'],
      ['Storage', '1TB NVMe SSD'],
      ['Display', '15.6" FHD 1000 nits'],
      ['Operating Temp', '-29°C to +63°C']
    ])
  },
  {
    name: 'Surveillance Drone Quadcopter Professional',
    description: 'Professional-grade surveillance quadcopter with thermal imaging and 30x optical zoom camera. 45-minute flight time.',
    category: 'Defense',
    isTelecom: false,
    price: 285000,
    retailerPrice: 255000,
    stock: 35,
    offlineStock: 12,
    modelNumberPrefix: 'DEF-SDQ-PR',
    features: ['30x optical zoom', 'Thermal camera', 'Auto-tracking', 'Encrypted link', '45-min flight time'],
    specifications: new Map([
      ['Flight Time', '45 minutes'],
      ['Camera', '4K + thermal (640x512)'],
      ['Range', '10 km'],
      ['Wind Resistance', '15 m/s'],
      ['Weight', '4.8 kg']
    ])
  },
  {
    name: 'Portable Jamming System Multi-Band',
    description: 'Man-portable frequency jamming system for counter-IED operations. Covers cellular, WiFi, and GPS frequencies.',
    category: 'Defense',
    isTelecom: false,
    price: 385000,
    retailerPrice: 350000,
    stock: 25,
    offlineStock: 8,
    modelNumberPrefix: 'DEF-PJS-MB',
    features: ['Multi-band coverage', 'Backpack portable', 'Remote activation', 'Battery powered', 'Directional antennas'],
    specifications: new Map([
      ['Frequency Range', '20 MHz - 6 GHz'],
      ['Jamming Radius', '50-100m adjustable'],
      ['Power Output', '50W total'],
      ['Battery Life', '4 hours continuous'],
      ['Weight', '12 kg complete system']
    ])
  },
  {
    name: 'Tactical Helmet Advanced Combat',
    description: 'Lightweight advanced combat helmet with integrated rail system. Ballistic protection against fragmentation and handgun threats.',
    category: 'Defense',
    isTelecom: false,
    price: 45000,
    retailerPrice: 38000,
    stock: 250,
    offlineStock: 100,
    modelNumberPrefix: 'DEF-TAH-AC',
    features: ['NIJ Level IIIA', 'Integrated rails', 'NVG mount', 'Comfort padding', 'Quick-adjust retention'],
    specifications: new Map([
      ['Protection Level', 'NIJ Level IIIA'],
      ['Weight', '1.4 kg'],
      ['Material', 'UHMWPE composite'],
      ['Size Range', 'S, M, L, XL'],
      ['Color Options', 'Black, Tan, OD Green']
    ])
  },
  {
    name: 'Handheld Thermal Imager 640x480',
    description: 'High-resolution thermal imaging camera for surveillance and search operations. 640x480 detector with recording capability.',
    category: 'Defense',
    isTelecom: false,
    price: 165000,
    retailerPrice: 145000,
    stock: 40,
    offlineStock: 15,
    modelNumberPrefix: 'DEF-HTI-640',
    features: ['640x480 resolution', 'Video recording', 'Image enhancement', 'Laser pointer', 'WiFi streaming'],
    specifications: new Map([
      ['Detector Resolution', '640 x 480'],
      ['Thermal Sensitivity', '<40 mK'],
      ['Detection Range', '2500m (vehicle)'],
      ['Display', '5" OLED'],
      ['Battery Life', '8 hours']
    ])
  },
  {
    name: 'Tactical Flashlight High-Intensity LED',
    description: 'Military-grade tactical flashlight with 1200 lumens output. Aircraft-grade aluminum construction with multiple modes.',
    category: 'Defense',
    isTelecom: false,
    price: 8500,
    retailerPrice: 7000,
    stock: 400,
    offlineStock: 150,
    modelNumberPrefix: 'DEF-TFL-LED',
    features: ['1200 lumens', 'Strobe mode', 'Weapon mountable', 'Rechargeable', 'Impact resistant'],
    specifications: new Map([
      ['Max Output', '1200 lumens'],
      ['Beam Distance', '350m'],
      ['Runtime', '2-90 hours (mode dependent)'],
      ['Material', 'Aircraft aluminum'],
      ['Water Rating', 'IPX8 (2m)']
    ])
  },
  {
    name: 'GPS Tracker Military-Grade Rugged',
    description: 'Ruggedized GPS tracking device with worldwide coverage. Long battery life and encrypted data transmission.',
    category: 'Defense',
    isTelecom: false,
    price: 35000,
    retailerPrice: 30000,
    stock: 100,
    offlineStock: 35,
    modelNumberPrefix: 'DEF-GPS-MG',
    features: ['Global coverage', 'Encrypted transmission', 'Geofencing', '1-year battery', 'Shock resistant'],
    specifications: new Map([
      ['GPS Accuracy', '2.5m CEP'],
      ['Update Rate', 'Configurable 10s-24h'],
      ['Battery Life', 'Up to 1 year'],
      ['Communication', 'Satellite + Cellular'],
      ['Operating Temp', '-40°C to +85°C']
    ])
  },
  {
    name: 'Biometric Access Control System Military',
    description: 'Multi-modal biometric system with fingerprint, iris, and facial recognition. Ruggedized for field deployment.',
    category: 'Defense',
    isTelecom: false,
    price: 145000,
    retailerPrice: 130000,
    stock: 30,
    offlineStock: 10,
    modelNumberPrefix: 'DEF-BAC-MM',
    features: ['Multi-modal biometrics', 'Offline capability', 'Encrypted database', 'Rugged design', 'Fast recognition'],
    specifications: new Map([
      ['Modalities', 'Fingerprint, Iris, Face'],
      ['Database Capacity', '100,000 users'],
      ['Recognition Time', '<1 second'],
      ['Operating Temp', '-20°C to +60°C'],
      ['Interface', 'Ethernet, USB, RS-485']
    ])
  },
  {
    name: 'Portable Explosive Detector Trace',
    description: 'Handheld trace explosive detector using ion mobility spectrometry. Detects military and commercial explosives.',
    category: 'Defense',
    isTelecom: false,
    price: 325000,
    retailerPrice: 295000,
    stock: 20,
    offlineStock: 7,
    modelNumberPrefix: 'DEF-PED-TR',
    features: ['IMS technology', 'Multiple explosive types', 'Fast analysis', 'Low false alarm', 'Portable design'],
    specifications: new Map([
      ['Detection Method', 'Ion Mobility Spectrometry'],
      ['Analysis Time', '8 seconds'],
      ['Weight', '2.5 kg'],
      ['Battery Life', '8 hours'],
      ['Detectable Explosives', '40+ types']
    ])
  },
  {
    name: 'Tactical Communication Headset Digital',
    description: 'Advanced tactical headset with active noise cancellation and ambient sound passthrough. Compatible with multiple radio systems.',
    category: 'Defense',
    isTelecom: false,
    price: 28000,
    retailerPrice: 24000,
    stock: 150,
    offlineStock: 60,
    modelNumberPrefix: 'DEF-TCH-DG',
    features: ['Active noise cancellation', 'Sound localization', 'PTT compatibility', 'Gel ear seals', 'Modular design'],
    specifications: new Map([
      ['NRR', '23 dB'],
      ['Frequency Response', '20 Hz - 20 kHz'],
      ['Battery Life', '80 hours'],
      ['Connectors', 'Multi-pin tactical'],
      ['Weight', '340g']
    ])
  },
  {
    name: 'Range Finder Laser Military 10km',
    description: 'Precision laser rangefinder with 10km range capability. Includes compass, inclinometer, and ballistic calculator.',
    category: 'Defense',
    isTelecom: false,
    price: 195000,
    retailerPrice: 175000,
    stock: 35,
    offlineStock: 12,
    modelNumberPrefix: 'DEF-RFL-10K',
    features: ['10km range', 'Ballistic calculator', 'GPS/compass', 'Scan mode', 'Export controlled'],
    specifications: new Map([
      ['Max Range', '10,000m'],
      ['Accuracy', '±1m'],
      ['Magnification', '7x'],
      ['Laser Class', 'Class 1 eye-safe'],
      ['Operating Temp', '-40°C to +60°C']
    ])
  },
  {
    name: 'Field Hardened Network Switch 24-Port',
    description: 'Military-grade managed Ethernet switch for tactical networks. MIL-STD-810G and MIL-STD-461F compliant.',
    category: 'Defense',
    isTelecom: false,
    price: 125000,
    retailerPrice: 110000,
    stock: 40,
    offlineStock: 15,
    modelNumberPrefix: 'DEF-NHS-24P',
    features: ['MIL-STD compliant', '24 Gigabit ports', 'Fanless design', 'Wide temp range', 'Layer 3 routing'],
    specifications: new Map([
      ['Ports', '24 x GbE + 4 x SFP'],
      ['Standards', 'MIL-STD-810G, 461F'],
      ['Operating Temp', '-40°C to +75°C'],
      ['Power Input', '10-32VDC'],
      ['MTBF', '>100,000 hours']
    ])
  },
  {
    name: 'Personal Locator Beacon Military Edition',
    description: 'Emergency personnel locator beacon with GPS and satellite communication. NATO compatible with encrypted transmission.',
    category: 'Defense',
    isTelecom: false,
    price: 45000,
    retailerPrice: 38000,
    stock: 120,
    offlineStock: 50,
    modelNumberPrefix: 'DEF-PLB-ME',
    features: ['Satellite SOS', 'GPS tracking', 'NATO compatible', 'Encrypted', 'Water resistant'],
    specifications: new Map([
      ['Frequency', '406 MHz + GPS'],
      ['Battery Life', '5 years standby'],
      ['Transmission Power', '5W'],
      ['Water Rating', 'IP68 (10m)'],
      ['Weight', '180g']
    ])
  },
  {
    name: 'Tactical Shield Ballistic Transparent Level IIIA',
    description: 'Lightweight transparent ballistic shield for tactical operations. NIJ Level IIIA rated with integrated lighting.',
    category: 'Defense',
    isTelecom: false,
    price: 135000,
    retailerPrice: 120000,
    stock: 50,
    offlineStock: 20,
    modelNumberPrefix: 'DEF-TSB-L3A',
    features: ['NIJ Level IIIA', 'Transparent polycarbonate', 'LED lighting', 'Ergonomic handles', 'Viewport shield'],
    specifications: new Map([
      ['Protection Level', 'NIJ Level IIIA'],
      ['Viewing Area', '600 x 450 mm'],
      ['Weight', '7.5 kg'],
      ['Material', 'Multi-layer polycarbonate'],
      ['Thickness', '40 mm']
    ])
  }
];

const railwayProducts = [
  {
    name: 'Railway Track Circuit Transmitter/Receiver',
    description: 'Audio frequency track circuit system for train detection and signaling. Fail-safe design with vital relay outputs.',
    category: 'Railway',
    isTelecom: false,
    price: 85000,
    retailerPrice: 75000,
    stock: 70,
    offlineStock: 25,
    modelNumberPrefix: 'RLW-TRC-AF',
    features: ['Fail-safe design', 'Audio frequency', 'Vital relay outputs', 'Lightning protection', 'Remote monitoring'],
    specifications: new Map([
      ['Frequency Range', '1.7 - 2.6 kHz'],
      ['Track Length', 'Up to 2000m'],
      ['Power Supply', '24VDC'],
      ['Output', 'Vital relay contacts'],
      ['Standards', 'EN 50129 SIL-4']
    ])
  },
  {
    name: 'Electronic Interlocking System Modular',
    description: 'Modern electronic interlocking system for railway signaling. Microprocessor-based with redundancy and SIL-4 certification.',
    category: 'Railway',
    isTelecom: false,
    price: 1250000,
    retailerPrice: 1150000,
    stock: 8,
    offlineStock: 2,
    modelNumberPrefix: 'RLW-EIS-MOD',
    features: ['SIL-4 certified', 'Redundant architecture', 'Modular design', 'Remote diagnostics', 'Hot standby'],
    specifications: new Map([
      ['Max Points', '128'],
      ['Max Signals', '256'],
      ['Max Track Circuits', '512'],
      ['Redundancy', '2oo2 architecture'],
      ['MTBF', '>50 years']
    ])
  },
  {
    name: 'Axle Counter System Wheel Sensor',
    description: 'Inductive wheel sensor system for train detection. Weather-resistant design suitable for all track types.',
    category: 'Railway',
    isTelecom: false,
    price: 42000,
    retailerPrice: 36000,
    stock: 150,
    offlineStock: 60,
    modelNumberPrefix: 'RLW-AXC-WS',
    features: ['Inductive sensor', 'All-weather', 'Self-monitoring', 'Fail-safe', 'Easy installation'],
    specifications: new Map([
      ['Detection Principle', 'Inductive'],
      ['Max Speed', '500 km/h'],
      ['Operating Temp', '-50°C to +70°C'],
      ['Installation', 'Sleeper mounted'],
      ['SIL Rating', 'SIL-4']
    ])
  },
  {
    name: 'LED Signal Light Red/Yellow/Green',
    description: 'High-intensity LED railway signal light with modular design. Long service life with minimal maintenance requirements.',
    category: 'Railway',
    isTelecom: false,
    price: 35000,
    retailerPrice: 30000,
    stock: 200,
    offlineStock: 80,
    modelNumberPrefix: 'RLW-SIG-LED3',
    features: ['High-intensity LED', 'Modular design', 'Long life (>10 years)', 'Low power', 'Sun phantom protection'],
    specifications: new Map([
      ['LED Type', 'High-power RGB'],
      ['Luminous Intensity', '40,000 cd minimum'],
      ['Viewing Distance', '1500m minimum'],
      ['Power Consumption', '12W max'],
      ['Expected Life', '>100,000 hours']
    ])
  },
  {
    name: 'Point Machine Electric 230VAC',
    description: 'Heavy-duty electric point machine for railway turnout control. Suitable for standard and high-speed applications.',
    category: 'Railway',
    isTelecom: false,
    price: 125000,
    retailerPrice: 110000,
    stock: 60,
    offlineStock: 20,
    modelNumberPrefix: 'RLW-PM-E230',
    features: ['High reliability', 'Detection contacts', 'Manual operation', 'Weather resistant', 'Lock/detect mechanism'],
    specifications: new Map([
      ['Operating Voltage', '230VAC'],
      ['Operating Time', '<6 seconds'],
      ['Max Switching Force', '10 kN'],
      ['Detection', 'Cam-operated contacts'],
      ['Temperature Range', '-40°C to +70°C']
    ])
  },
  {
    name: 'Railway Telephone System Lineside',
    description: 'Ruggedized lineside emergency telephone system. Provides direct communication with control center.',
    category: 'Railway',
    isTelecom: false,
    price: 28000,
    retailerPrice: 24000,
    stock: 100,
    offlineStock: 40,
    modelNumberPrefix: 'RLW-TEL-LS',
    features: ['Vandal-resistant', 'Auto-dial', 'Hands-free', 'Weather proof', 'LED indication'],
    specifications: new Map([
      ['Type', 'Auto-dial emergency'],
      ['Interface', 'Analog line'],
      ['Housing', 'Stainless steel IP65'],
      ['Operating Temp', '-40°C to +55°C'],
      ['Mounting', 'Pole or wall mount']
    ])
  },
  {
    name: 'Level Crossing Barrier Gate Automatic',
    description: 'Automated barrier gate system for railway level crossings. Includes sensors, control unit, and warning lights.',
    category: 'Railway',
    isTelecom: false,
    price: 195000,
    retailerPrice: 175000,
    stock: 35,
    offlineStock: 12,
    modelNumberPrefix: 'RLW-LXB-AUTO',
    features: ['Automatic operation', 'Obstacle detection', 'Emergency release', 'LED warning lights', 'Battery backup'],
    specifications: new Map([
      ['Boom Length', '3-8 meters'],
      ['Operating Time', '3-8 seconds'],
      ['Power Supply', '230VAC + 24VDC backup'],
      ['Obstacle Detection', 'Photoelectric'],
      ['Duty Cycle', 'Continuous']
    ])
  },
  {
    name: 'Train Detection Radar Doppler',
    description: 'Radar-based train detection system using Doppler effect. Suitable for tunnels and adverse weather conditions.',
    category: 'Railway',
    isTelecom: false,
    price: 165000,
    retailerPrice: 145000,
    stock: 40,
    offlineStock: 15,
    modelNumberPrefix: 'RLW-TDR-DOP',
    features: ['Weather independent', 'Tunnel capable', 'Long range', 'Speed measurement', 'Fail-safe outputs'],
    specifications: new Map([
      ['Frequency', '24 GHz'],
      ['Detection Range', '300m'],
      ['Speed Range', '5-500 km/h'],
      ['Output', 'Relay + digital'],
      ['Power', '24VDC 5W']
    ])
  },
  {
    name: 'Railway Power Supply UPS 3kVA Redundant',
    description: 'Uninterruptible power supply system for critical railway signaling equipment. Redundant design with extended runtime.',
    category: 'Railway',
    isTelecom: false,
    price: 145000,
    retailerPrice: 130000,
    stock: 45,
    offlineStock: 15,
    modelNumberPrefix: 'RLW-UPS-3KVA',
    features: ['Redundant design', 'Hot-swappable batteries', 'Remote monitoring', 'Railway certified', 'Extended runtime'],
    specifications: new Map([
      ['Capacity', '3 kVA / 2.4 kW'],
      ['Topology', 'Double conversion'],
      ['Runtime', '4 hours @ full load'],
      ['Input Voltage', '230VAC ±20%'],
      ['Battery Type', 'VRLA (12V 100Ah)']
    ])
  },
  {
    name: 'CCTV Camera Railway Platform Vandal-Proof',
    description: 'Heavy-duty surveillance camera for railway platforms. Vandal-proof housing with day/night capability and analytics.',
    category: 'Railway',
    isTelecom: false,
    price: 45000,
    retailerPrice: 38000,
    stock: 120,
    offlineStock: 50,
    modelNumberPrefix: 'RLW-CCTV-VP',
    features: ['Vandal-proof IK10', 'Full HD 1080p', 'Wide dynamic range', 'Video analytics', 'PoE powered'],
    specifications: new Map([
      ['Resolution', '1920x1080 @ 30fps'],
      ['Sensor', '1/2.8" CMOS'],
      ['Lens', '2.8-12mm varifocal'],
      ['IR Range', '30 meters'],
      ['Vandal Rating', 'IK10']
    ])
  },
  {
    name: 'Signaling Cable Railway Grade Armored',
    description: 'Multi-core armored cable for railway signaling applications. Flame retardant and rodent resistant construction.',
    category: 'Railway',
    isTelecom: false,
    price: 185,
    retailerPrice: 150,
    stock: 5000,
    offlineStock: 2000,
    modelNumberPrefix: 'RLW-CBL-SIG',
    features: ['Armored construction', 'Flame retardant', 'Low smoke', 'Color coded', 'Weather resistant'],
    specifications: new Map([
      ['Core Count', '4-48 cores'],
      ['Conductor', '0.6mm copper'],
      ['Armor', 'Galvanized steel tape'],
      ['Temperature Rating', '-40°C to +70°C'],
      ['Standards', 'EN 50288-7']
    ])
  },
  {
    name: 'Hot Box Detector Wayside System',
    description: 'Wayside hot box detector system for monitoring bearing temperatures on passing trains. Early warning system for failures.',
    category: 'Railway',
    isTelecom: false,
    price: 385000,
    retailerPrice: 350000,
    stock: 20,
    offlineStock: 7,
    modelNumberPrefix: 'RLW-HBD-WS',
    features: ['IR sensor array', 'Real-time alerts', 'Train ID integration', 'Data logging', 'Remote access'],
    specifications: new Map([
      ['Sensor Type', 'Infrared thermopile array'],
      ['Detection Speed', 'Up to 200 km/h'],
      ['Temperature Range', '-40°C to +400°C'],
      ['Accuracy', '±2°C'],
      ['Communication', 'Ethernet, 4G modem']
    ])
  },
  {
    name: 'Railway Gateway Router Cellular/Fiber',
    description: 'Industrial railway router with dual cellular and fiber connectivity. Designed for trackside installations.',
    category: 'Railway',
    isTelecom: false,
    price: 55000,
    retailerPrice: 48000,
    stock: 80,
    offlineStock: 30,
    modelNumberPrefix: 'RLW-GWR-CF',
    features: ['Dual SIM 4G/LTE', 'Fiber SFP ports', 'VPN support', 'DIN rail mount', 'Wide temp range'],
    specifications: new Map([
      ['Cellular', 'Dual SIM 4G LTE Cat-6'],
      ['Ethernet', '4 x GbE + 2 x SFP'],
      ['VPN', 'IPsec, OpenVPN, L2TP'],
      ['Operating Temp', '-40°C to +75°C'],
      ['Certifications', 'EN 50155, EN 50121']
    ])
  },
  {
    name: 'Automatic Train Protection ATP Onboard Unit',
    description: 'Onboard ATP system for continuous train protection. ETCS Level 1 compatible with balise reader and DMI interface.',
    category: 'Railway',
    isTelecom: false,
    price: 625000,
    retailerPrice: 575000,
    stock: 15,
    offlineStock: 5,
    modelNumberPrefix: 'RLW-ATP-OBU',
    features: ['ETCS Level 1/2', 'Balise reader', 'Brake interface', 'DMI interface', 'SIL-4 certified'],
    specifications: new Map([
      ['ETCS Level', 'Level 1 & 2'],
      ['Balise Reader', 'Integrated'],
      ['Speed Range', '0-500 km/h'],
      ['SIL Rating', 'SIL-4'],
      ['Interfaces', 'MVB, Ethernet, CAN']
    ])
  },
  {
    name: 'Platform Information Display LED Matrix',
    description: 'Large LED matrix display for platform passenger information. Multi-line display with graphics capability.',
    category: 'Railway',
    isTelecom: false,
    price: 95000,
    retailerPrice: 85000,
    stock: 50,
    offlineStock: 20,
    modelNumberPrefix: 'RLW-PID-LED',
    features: ['Full-color LED', 'Multi-language', 'Real-time updates', 'Weather resistant', 'Remote management'],
    specifications: new Map([
      ['Display Size', '2400 x 400 mm'],
      ['Pixel Pitch', '10mm'],
      ['Brightness', '8000 nits'],
      ['Viewing Angle', '140° H / 90° V'],
      ['Interface', 'Ethernet, RS-485']
    ])
  },
  {
    name: 'Track Geometry Measurement System Portable',
    description: 'Portable track geometry measurement system for maintenance operations. GPS-referenced with real-time recording.',
    category: 'Railway',
    isTelecom: false,
    price: 485000,
    retailerPrice: 450000,
    stock: 12,
    offlineStock: 4,
    modelNumberPrefix: 'RLW-TGM-PORT',
    features: ['GPS referenced', 'Real-time display', 'Data logging', 'Exceedance alerts', 'Post-processing software'],
    specifications: new Map([
      ['Measurement Speed', 'Up to 80 km/h'],
      ['Parameters', 'Gauge, Alignment, Cant, Twist'],
      ['Accuracy', '±1mm'],
      ['Data Storage', '500 km @ 0.25m intervals'],
      ['Output', 'CSV, PDF reports']
    ])
  },
  {
    name: 'Railway Station PA System 500W Amplifier',
    description: 'Public address system amplifier for railway stations. Multi-zone with priority paging and emergency override.',
    category: 'Railway',
    isTelecom: false,
    price: 125000,
    retailerPrice: 110000,
    stock: 35,
    offlineStock: 12,
    modelNumberPrefix: 'RLW-PA-500W',
    features: ['500W output', 'Multi-zone (8 zones)', 'Priority paging', 'Emergency override', 'Redundant PSU'],
    specifications: new Map([
      ['Output Power', '500W RMS'],
      ['Zones', '8 independently controlled'],
      ['Input Sources', '6 x mic, 4 x line'],
      ['THD', '<0.5%'],
      ['Compliance', 'EN 60849']
    ])
  },
  {
    name: 'Fiber Optic Transmission System Railway CWDM',
    description: 'CWDM optical transmission system for railway communication networks. Supports voice, data, and video services.',
    category: 'Railway',
    isTelecom: false,
    price: 285000,
    retailerPrice: 255000,
    stock: 25,
    offlineStock: 8,
    modelNumberPrefix: 'RLW-FOTS-CWDM',
    features: ['18 CWDM channels', 'Hot-swappable SFPs', 'Network management', 'Redundant PSU', 'EN 50155 certified'],
    specifications: new Map([
      ['Channels', '18 (CWDM ITU grid)'],
      ['Distance', 'Up to 80 km'],
      ['Services', 'GbE, E1, Video, Audio'],
      ['Operating Temp', '-40°C to +70°C'],
      ['MTBF', '>100,000 hours']
    ])
  }
];

async function createProducts() {
  try {
    const allProducts = [...telecomProducts, ...defenseProducts, ...railwayProducts];
    
    console.log(`Creating ${allProducts.length} products...\n`);
    
    let created = 0;
    let skipped = 0;
    
    for (let i = 0; i < allProducts.length; i++) {
      const productData = allProducts[i];
      
      // Add images
      productData.images = getProductImages(productData.category, i);
      
      // Check if product already exists
      const existingProduct = await Product.findOne({ name: productData.name });
      
      if (existingProduct) {
        console.log(`⚠️  Product "${productData.name}" already exists - skipping`);
        skipped++;
      } else {
        await Product.create(productData);
        console.log(`✅ Created: ${productData.name} (${productData.category})`);
        created++;
      }
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📦 Product Creation Summary');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Created: ${created} products`);
    console.log(`⚠️  Skipped: ${skipped} products (already exist)`);
    console.log(`📊 Total: ${allProducts.length} products`);
    console.log('\n📁 Products by Category:');
    console.log(`   Telecommunication: ${telecomProducts.length} products`);
    console.log(`   Defense: ${defenseProducts.length} products`);
    console.log(`   Railway: ${railwayProducts.length} products`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating products:', error);
    process.exit(1);
  }
}

createProducts();
