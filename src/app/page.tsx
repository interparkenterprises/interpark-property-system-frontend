'use client';
import Link from 'next/link';
import { Building2, Users, Home, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion'; // Optional, for smooth animations

// Optional: Add framer-motion for subtle entrance effects


export default function HomePage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-[#005478] to-[#58595B] relative overflow-hidden text-white">
      {/* Optional decorative background shape */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/2 rounded-full -translate-y-1/4 translate-x-1/4 blur-3xl"></div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold text-brand-black mb-6 tracking-tight"
          >
            INTERPARK ENTERPRISES LIMITED
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg md:text-xl text-secondary mb-10 leading-relaxed"
          >
            Professional Property Management System — Streamline operations, empower landlords, and delight tenants.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link
              href="/login"
              className="px-8 py-3.5 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-[#b9cbd3] transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              Login to Dashboard
            </Link>
            <Link
              href="/register"
              className="px-8 py-3.5 border-2 border-primary text-primary font-semibold rounded-lg hover:bg-primary/5 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              Register Your Account
            </Link>
          </motion.div>
        </div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8"
        >
          <FeatureCard
            icon={<Building2 className="w-10 h-10 text-primary" />}
            title="Properties"
            description="Manage multiple properties with ease, from acquisition to performance tracking."
          />
          <FeatureCard
            icon={<Home className="w-10 h-10 text-primary" />}
            title="Units"
            description="Organize and monitor all rental units across your portfolio."
          />
          <FeatureCard
            icon={<Users className="w-10 h-10 text-primary" />}
            title="Tenants"
            description="Maintain tenant profiles, leases, and communication logs seamlessly."
          />
          <FeatureCard
            icon={<TrendingUp className="w-10 h-10 text-primary" />}
            title="Analytics"
            description="Gain real-time insights into occupancy, income, and property performance."
          />
        </motion.div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -8 }}
      className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300"
    >
      <div className="mb-4 flex justify-center">{icon}</div>
      <h3 className="text-xl font-semibold text-brand-black mb-2 text-center">{title}</h3>
      <p className="text-secondary text-center text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
}