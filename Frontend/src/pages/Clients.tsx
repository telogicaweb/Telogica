import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../api';

interface Client {
  _id: string;
  name: string;
  logo: string;
  displayOrder: number;
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const response = await api.get('/api/clients');
      setClients(response.data);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title Section */}
        <div className="text-center mb-16">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-extrabold text-gray-900 tracking-tight uppercase"
          >
            Our Clients
          </motion.h1>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 96 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="h-1 mx-auto bg-gradient-to-r from-purple-600 to-pink-500 rounded mt-3"
          />
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Loading clients list...</p>
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-16 bg-white border border-gray-200 p-10">
            <p className="text-gray-500 font-medium">No clients are currently registered. Check back later.</p>
          </div>
        ) : (
          /* Clients Grid - Table style collapsed borders */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 border-t border-l border-gray-200 shadow-sm"
          >
            {clients.map((client, idx) => (
              <motion.div
                key={client._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="border-r border-b border-gray-200 bg-white p-5 flex flex-col items-center justify-center h-32 sm:h-36 hover:shadow-[inset_0_0_12px_rgba(0,0,0,0.02)] transition-shadow group"
              >
                <div className="flex-1 flex items-center justify-center w-full">
                  <img
                    src={client.logo}
                    alt={client.name}
                    className="max-h-16 max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 mt-2 text-center">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    {client.name}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
