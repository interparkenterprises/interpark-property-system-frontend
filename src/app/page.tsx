'use client';
import Link from 'next/link';
import { Building2, Users, Home, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-[#005478] to-[#1C2B3A] relative overflow-hidden">
      <div className="absolute inset-0 bg-black/40"></div>

      <div className="container mx-auto px-4 py-12 md:py-20 relative z-10">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight"
          >
            INTERPARK ENTERPRISES LIMITED
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
            className="text-lg md:text-xl text-gray-200 mb-10 leading-relaxed"
          >
            A Modern Property Management System Built for Efficiency & Growth.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="flex flex-col sm:flex-row gap-5 justify-center items-center"
          >
            {/* Primary Button */}
            <Link
              href="/login"
              className="px-7 py-3 bg-[#00A8C6] text-white font-semibold rounded-xl 
                        hover:bg-[#E6F8FA] hover:text-[#005478]
                        transition-all duration-300 shadow-lg hover:shadow-xl
                        transform hover:-translate-y-1"
            >
              Login to Dashboard
            </Link>

            {/* Secondary Button */}
            <Link
              href="/register"
              className="px-7 py-3 rounded-xl font-semibold border-2 border-white 
                        text-white bg-transparent
                        hover:bg-white hover:text-[#005478] hover:shadow-xl
                        transition-all duration-300 transform hover:-translate-y-1"
            >
              Register Your Account
            </Link>
          </motion.div>
        </div>

        {/* Features Grid */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.15, delayChildren: 0.3 }
            }
          }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <FeatureCard
            icon={<Building2 className="w-10 h-10 text-[#005478]" />}
            title="Properties"
            description="Complete oversight — performance tracking, documentation & compliance."
          />
          <FeatureCard
            icon={<Home className="w-10 h-10 text-[#005478]" />}
            title="Units"
            description="Organize and monitor all units with clarity and control."
          />
          <FeatureCard
            icon={<Users className="w-10 h-10 text-[#005478]" />}
            title="Tenants"
            description="Manage tenant relations with communication and tracking tools."
          />
          <FeatureCard
            icon={<TrendingUp className="w-10 h-10 text-[#005478]" />}
            title="Analytics"
            description="Gain actionable insights to increase profitability and occupancy."
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
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, ease: "easeOut" }
        }
      }}
      whileHover={{
        y: -6,
        transition: { duration: 0.3, ease: "easeInOut" }
      }}
      className="bg-white rounded-2xl p-6 shadow-lg
                 hover:shadow-2xl transition-all duration-300
                 border border-gray-100"
    >
      <div className="mb-4 flex justify-center">{icon}</div>
      <h3 className="text-xl font-bold text-[#231F20] text-center mb-2">{title}</h3>
      <p className="text-sm text-gray-600 text-center leading-relaxed">{description}</p>
    </motion.div>
  );
}
