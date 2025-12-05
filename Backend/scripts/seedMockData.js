const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

// Adjust path to .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');

const BlogPost = require('../models/BlogPost');
const TeamMember = require('../models/TeamMember');
const Event = require('../models/Event');
const Report = require('../models/Report');
const Content = require('../models/Content');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Quote = require('../models/Quote');
const Invoice = require('../models/Invoice');
const ProductUnit = require('../models/ProductUnit');
const RetailerInventory = require('../models/RetailerInventory');
const Warranty = require('../models/Warranty');

const run = async () => {
  try {
    await connectDB();

    console.log('Connected to DB. Clearing existing data...');

    // Clear existing data
    await Promise.all([
      BlogPost.deleteMany({}),
      TeamMember.deleteMany({}),
      Event.deleteMany({}),
      Report.deleteMany({}),
      Content.deleteMany({}),
      Product.deleteMany({}),
      Order.deleteMany({}),
      User.deleteMany({}),
      Quote.deleteMany({}),
      Invoice.deleteMany({}),
      ProductUnit.deleteMany({}),
      RetailerInventory.deleteMany({}),
      Warranty.deleteMany({})
    ]);

    console.log('Data cleared. Seeding new data...');

    // --- Users ---
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt);

    const users = await User.insertMany([
      {
        name: 'Admin User',
        email: 'admin@telogica.com',
        password: hashedPassword,
        role: 'admin',
        isApproved: true,
        phone: '9999999999',
        address: 'Telogica HQ, Bangalore'
      },
      {
        name: 'Regular User',
        email: 'user@telogica.com',
        password: hashedPassword,
        role: 'user',
        isApproved: true,
        phone: '8888888888',
        address: '123 User Street, Mumbai'
      },
      {
        name: 'Retailer User',
        email: 'retailer@telogica.com',
        password: hashedPassword,
        role: 'retailer',
        isApproved: true,
        phone: '7777777777',
        address: '456 Retail Shop, Delhi'
      }
    ]);

    console.log('Users seeded.');

    // --- Products ---
    // Telecom products have prices. Others do not.
    const productData = [
      {
        name: '5G Network Infrastructure',
        category: 'telecom',
        images: ['https://images.pexels.com/photos/4458420/pexels-photo-4458420.jpeg?auto=compress&cs=tinysrgb&w=800'],
        description: 'Next-generation telecommunications infrastructure providing ultra-low latency and high bandwidth.',
        price: 150000,
        retailerPrice: 120000,
        isRecommended: true,
        requiresQuote: false,
        stock: 50,
        specifications: { 'Bandwidth': '10Gbps', 'Latency': '<1ms' }
      },
      {
        name: 'Fiber Optic Solutions',
        category: 'telecom',
        images: ['https://images.pexels.com/photos/4508751/pexels-photo-4508751.jpeg?auto=compress&cs=tinysrgb&w=800'],
        description: 'High-speed fiber optic network systems for long-distance data transmission.',
        price: 5000,
        retailerPrice: 4000,
        isRecommended: false,
        requiresQuote: false,
        stock: 200,
        specifications: { 'Type': 'Single Mode', 'Length': '1000m' }
      },
      {
        name: 'Satellite Communication',
        category: 'telecom',
        images: ['https://images.pexels.com/photos/586056/pexels-photo-586056.jpeg?auto=compress&cs=tinysrgb&w=800'],
        description: 'Global satellite communication solutions for remote connectivity.',
        price: 250000,
        retailerPrice: 200000,
        isRecommended: true,
        requiresQuote: false,
        stock: 20,
        specifications: { 'Frequency': 'Ka-Band', 'Coverage': 'Global' }
      },
      {
        name: 'Tactical Communication Systems',
        category: 'defence',
        images: ['https://images.pexels.com/photos/60504/security-protection-anti-virus-software-60504.jpeg?auto=compress&cs=tinysrgb&w=800'],
        description: 'Secure military-grade communication systems designed for harsh environments.',
        // No price -> Requires Quote
        isRecommended: true,
        requiresQuote: true,
        stock: 10,
        specifications: { 'Encryption': 'AES-256', 'Durability': 'Mil-Spec' }
      },
      {
        name: 'Surveillance & Monitoring',
        category: 'defence',
        images: ['https://images.pexels.com/photos/430208/pexels-photo-430208.jpeg?auto=compress&cs=tinysrgb&w=800'],
        description: 'Advanced security and surveillance systems with AI-powered analytics.',
        // No price -> Requires Quote
        isRecommended: false,
        requiresQuote: true,
        stock: 15,
        specifications: { 'Resolution': '4K', 'Night Vision': 'Yes' }
      },
      {
        name: 'Cybersecurity Solutions',
        category: 'defence',
        images: ['https://images.pexels.com/photos/5380664/pexels-photo-5380664.jpeg?auto=compress&cs=tinysrgb&w=800'],
        description: 'Enterprise-grade cybersecurity systems to protect critical infrastructure.',
        // No price -> Requires Quote
        isRecommended: true,
        requiresQuote: true,
        stock: 100, // Licenses?
        specifications: { 'Type': 'Firewall/IPS', 'Throughput': '100Gbps' }
      },
      {
        name: 'Railway Signaling Systems',
        category: 'railway',
        images: ['https://images.pexels.com/photos/1484800/pexels-photo-1484800.jpeg?auto=compress&cs=tinysrgb&w=800'],
        description: 'Modern railway signaling technology for enhanced safety and efficiency.',
        // No price -> Requires Quote
        isRecommended: true,
        requiresQuote: true,
        stock: 5,
        specifications: { 'Standard': 'ETCS Level 2', 'Safety': 'SIL 4' }
      },
      {
        name: 'Train Control & Management',
        category: 'railway',
        images: ['https://images.pexels.com/photos/3779786/pexels-photo-3779786.jpeg?auto=compress&cs=tinysrgb&w=800'],
        description: 'Integrated train control systems for real-time monitoring and management.',
        // No price -> Requires Quote
        isRecommended: false,
        requiresQuote: true,
        stock: 8,
        specifications: { 'Interface': 'HMI', 'Protocol': 'MVB' }
      }
    ];

    const products = await Product.insertMany(productData);
    console.log('Products seeded.');

    // --- Product Units ---
    const productUnits = [];
    for (const product of products) {
      const count = product.stock || 10;
      for (let i = 0; i < count; i++) {
        productUnits.push({
          product: product._id,
          serialNumber: `SN-${product.category.substring(0, 3).toUpperCase()}-${product._id.toString().substring(20)}-${i + 1000}`,
          modelNumber: `MDL-${product.category.substring(0, 3).toUpperCase()}-001`,
          status: 'available',
          stockType: 'both',
          manufacturingDate: new Date()
        });
      }
    }
    await ProductUnit.insertMany(productUnits);
    console.log('Product Units seeded.');

    // --- Blog Posts ---
    const blogs = [
      {
        title: 'Getting Started with 5G Technology',
        excerpt: 'An introduction to 5G technology and its applications in telecommunications',
        content: '5G technology represents the fifth generation of cellular network technology. It offers significantly faster data speeds, lower latency, and the ability to connect more devices simultaneously compared to previous generations. This makes it ideal for applications like IoT, autonomous vehicles, and smart cities.',
        author: 'Telogica Team',
        category: 'Telecom',
        image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200',
        readTime: '5 min read',
        tags: ['5G', 'Telecom', 'Innovation'],
        isPublished: true,
        isFeatured: true
      },
      {
        title: 'Smart Railways: The Future of Transport',
        excerpt: 'How digital signalling and IoT are reshaping railways',
        content: 'Rail networks are adopting sensors, edge computing and predictive analytics to increase safety and reliability. Telogica is helping operators deploy connected solutions that reduce downtime and improve passenger experience.',
        author: 'Product Team',
        category: 'Railway',
        image: 'https://images.unsplash.com/photo-1509395176047-4a66953fd231?w=1200',
        readTime: '6 min read',
        tags: ['Railway', 'IoT'],
        isPublished: true,
        isFeatured: false
      },
      {
        title: 'Cyber-Physical Systems in Defence',
        excerpt: 'Secure, resilient systems for critical infrastructure',
        content: 'Defence-grade systems require hardened communications, redundancy and strong security practices. Our solutions combine secure wireless links with real-time monitoring.',
        author: 'Security Team',
        category: 'Defence',
        image: 'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=1200',
        readTime: '7 min read',
        tags: ['Defence', 'Security'],
        isPublished: true,
        isFeatured: false
      }
    ];
    await BlogPost.insertMany(blogs);
    console.log('Blogs seeded.');

    // --- Team Members ---
    const team = [
      {
        name: 'Aarti Singh',
        role: 'CEO',
        department: 'Leadership',
        image: 'https://randomuser.me/api/portraits/women/44.jpg',
        bio: 'Founder and CEO with 15 years in telecom and IoT.',
        email: 'aarti@telogica.com',
        linkedin: 'https://www.linkedin.com/in/aartisingh',
        order: 1,
        isActive: true
      },
      {
        name: 'Rahul Mehta',
        role: 'CTO',
        department: 'Engineering',
        image: 'https://randomuser.me/api/portraits/men/46.jpg',
        bio: 'Leads platform engineering and cloud services.',
        email: 'rahul@telogica.com',
        linkedin: 'https://www.linkedin.com/in/rahulmehta',
        order: 2,
        isActive: true
      },
      {
        name: 'Sara Lopez',
        role: 'Head of Sales',
        department: 'Sales',
        image: 'https://randomuser.me/api/portraits/women/47.jpg',
        bio: 'Drives partner and enterprise sales.',
        email: 'sara@telogica.com',
        linkedin: 'https://www.linkedin.com/in/saralopez',
        order: 3,
        isActive: true
      }
    ];
    await TeamMember.insertMany(team);
    console.log('Team seeded.');

    // --- Events ---
    const now = new Date();
    const events = [
      {
        title: 'Telogica Annual Investor Meeting',
        description: 'Annual meeting to present financials and strategy.',
        eventDate: new Date(now.getFullYear(), now.getMonth() + 1, 15),
        eventTime: '10:00 AM',
        location: 'Mumbai Convention Center',
        type: 'AGM',
        isActive: true
      },
      {
        title: '5G Innovation Webinar',
        description: 'A deep dive into 5G use-cases for IoT.',
        eventDate: new Date(now.getFullYear(), now.getMonth() + 2, 8),
        eventTime: '3:00 PM',
        location: 'Online',
        type: 'Webinar',
        isActive: true
      }
    ];
    await Event.insertMany(events);
    console.log('Events seeded.');

    // --- Reports ---
    const reports = [
      {
        title: 'Q3 2025 Results',
        reportType: 'Quarterly Results',
        fileUrl: 'https://example.com/reports/q3-2025.pdf',
        fileSize: '1.2 MB',
        fileType: 'PDF',
        reportDate: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        isActive: true
      },
      {
        title: 'Annual Report 2024',
        reportType: 'Annual Report',
        fileUrl: 'https://example.com/reports/annual-2024.pdf',
        fileSize: '3.4 MB',
        fileType: 'PDF',
        reportDate: new Date(2024, 11, 31),
        isActive: true
      }
    ];
    await Report.insertMany(reports);
    console.log('Reports seeded.');

    console.log('Mock data seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
};

run();
