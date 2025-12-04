const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('../config/db');

const BlogPost = require('../models/BlogPost');
const TeamMember = require('../models/TeamMember');
const Event = require('../models/Event');
const Report = require('../models/Report');
const Content = require('../models/Content');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

const run = async () => {
  try {
    await connectDB();

    console.log('Seeding mock data...');

    // Clear existing data (be careful in production!)
    await Promise.all([
      BlogPost.deleteMany({}),
      TeamMember.deleteMany({}),
      Event.deleteMany({}),
      Report.deleteMany({}),
      Content.deleteMany({}),
      Product.deleteMany({}),
      Order.deleteMany({})
    ]);

    // Blog posts
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

    // Team members
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

    // Events
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

    // Reports
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

    // Page content sections (a few examples)
    const contents = [
      {
        section: 'hero_home',
        title: 'Connecting the Future',
        subtitle: 'Telogica builds resilient wireless systems for critical industries',
        description: 'End-to-end solutions for telecom, railways, defence, and smart cities.',
        image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200',
        order: 0,
        isActive: true
      },
      {
        section: 'about_story',
        title: 'Our Story',
        description: 'Founded in 2010 with a mission to bridge connectivity gaps in mission-critical environments.',
        order: 1,
        isActive: true
      },
      {
        section: 'contact_info',
        title: 'Get in Touch',
        content: { phone: '+91-22-1234-5678', email: 'info@telogica.com', address: 'Mumbai, India' },
        order: 2,
        isActive: true
      }
    ];

    // Products
    const products = [
      {
        name: '5G Router',
        description: 'High-speed 5G router for home and office use.',
        price: 15000,
        stock: 50,
        category: 'Networking',
        image: 'https://images.unsplash.com/photo-1581091012184-7f6a1a1a1a1a?w=1200',
        isActive: true
      },
      {
        name: 'IoT Sensor',
        description: 'Smart sensor for industrial IoT applications.',
        price: 5000,
        stock: 200,
        category: 'IoT',
        image: 'https://images.unsplash.com/photo-1593642634367-d91a135587b5?w=1200',
        isActive: true
      },
      {
        name: 'Cybersecurity Appliance',
        description: 'Enterprise-grade firewall and intrusion detection system.',
        price: 75000,
        stock: 10,
        category: 'Security',
        image: 'https://images.unsplash.com/photo-1603791440384-56cd371ee9a7?w=1200',
        isActive: true
      }
    ];

    // Orders
    const orders = [
      {
        user: null, // Replace with a valid user ID after seeding users
        products: [
          { product: null, quantity: 2 }, // Replace with a valid product ID after seeding products
          { product: null, quantity: 1 }
        ],
        totalAmount: 20000,
        paymentStatus: 'completed',
        isQuoteBased: false,
        createdAt: new Date()
      },
      {
        user: null, // Replace with a valid user ID after seeding users
        products: [
          { product: null, quantity: 5 }
        ],
        totalAmount: 25000,
        paymentStatus: 'pending',
        isQuoteBased: true,
        createdAt: new Date()
      }
    ];

    // Insert data
    await BlogPost.insertMany(blogs);
    await TeamMember.insertMany(team);
    await Event.insertMany(events);
    await Report.insertMany(reports);
    await Content.insertMany(contents);
    await Product.insertMany(products);
    console.log('Products seeded successfully.');

    // Note: Orders require valid user and product IDs. Update the script to fetch these IDs after seeding users and products.
    console.log('Orders seeding skipped. Update the script to include valid user and product IDs.');

    console.log('Mock data seeded successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
};

run();
