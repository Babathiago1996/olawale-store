"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  TrendingUp,
  Shield,
  Zap,
  Clock,
  Bell,
  ShoppingCart,
  BarChart3,
  Users,
  FolderKanban,
  FileBarChart,
  Sparkles,
  ChevronDown,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";

export default function HomePage() {
  const router = useRouter();
  const [activeFeature, setActiveFeature] = useState(0);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-x-hidden">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Manrope:wght@400;500;600;700;800&display=swap');
        
        * {
          -webkit-tap-highlight-color: transparent;
        }
        
        body {
          font-family: 'Manrope', sans-serif;
        }
        
        .serif {
          font-family: 'Instrument Serif', serif;
        }

        .grain {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          opacity: 0.02;
          z-index: 100;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
        }

        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .animated-gradient {
          background: linear-gradient(
            135deg,
            #3b82f6 0%,
            #8b5cf6 25%,
            #06b6d4 50%,
            #3b82f6 75%,
            #8b5cf6 100%
          );
          background-size: 200% 200%;
          animation: gradient-shift 8s ease infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        @keyframes pulse-glow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
      `}</style>

      {/* Grain Overlay */}
      <div className="grain" />

      {/* ================= HEADER ================= */}
      <header className="fixed top-0 w-full z-50 border-b border-white/5 backdrop-blur-xl bg-slate-950/80">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden border border-blue-500/30 ring-1 ring-blue-500/20">
              <Image
                src="/olawale-store2.png"
                alt="Olawale Store"
                width={48}
                height={48}
                className="object-cover"
                priority
              />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight serif">
                Olawale Store
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-400 tracking-wider uppercase hidden xs:block">
                Retail Intelligence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              className="text-white hover:bg-white/10 text-sm sm:text-base px-3 sm:px-4"
              onClick={() => router.push("/login")}
            >
              Login
            </Button>
            <Button
              className="bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-500 hover:to-blue-400 font-medium text-sm sm:text-base px-3 sm:px-5"
              onClick={() => router.push("/register")}
            >
              <span className="hidden sm:inline">Get Started</span>
              <span className="sm:hidden">Start</span>
              <ArrowRight className="ml-1 sm:ml-2 w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-blue-600 rounded-full blur-[100px] sm:blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-purple-600 rounded-full blur-[100px] sm:blur-[120px]" style={{ animation: 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite', animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 sm:w-[600px] sm:h-[600px] bg-cyan-500 rounded-full blur-[120px] sm:blur-[150px]" style={{ animation: 'pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite', animationDelay: '2s' }} />
        </div>

        <motion.div
          style={{ opacity, scale }}
          className="container mx-auto px-4 sm:px-6 text-center relative z-10 pt-24 sm:pt-32 pb-12"
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-blue-500/30 bg-blue-500/10 backdrop-blur-sm mb-6 sm:mb-8">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
              <span className="text-xs sm:text-sm text-blue-300 font-medium">
                Next-Generation Retail Platform
              </span>
            </div>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-4 sm:mb-6 md:mb-8 serif leading-[1.1] px-2"
          >
            Where Retail
            <br />
            <span className="animated-gradient bg-clip-text text-transparent">
              Meets Intelligence
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-base sm:text-lg md:text-xl text-slate-300 mb-8 sm:mb-10 md:mb-12 max-w-2xl mx-auto leading-relaxed px-4"
          >
            Sophisticated inventory management, real-time analytics, and
            operational excellence — engineered for the modern retailer.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-12 sm:mb-16 px-4"
          >
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-500 hover:to-blue-400 font-semibold text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 shadow-lg shadow-blue-500/25 w-full sm:w-auto"
              onClick={() => router.push("/register")}
            >
              Launch Platform
              <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="border-slate-700 bg-slate-800/50 text-white hover:bg-slate-800 hover:border-slate-600 text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 backdrop-blur-sm w-full sm:w-auto"
              onClick={() => router.push("/login")}
            >
              Sign In
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="flex justify-center"
          >
            <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6 text-slate-500 animate-bounce" />
          </motion.div>
        </motion.div>

        {/* Decorative Elements */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
      </section>

      {/* ================= STATS BANNER ================= */}
      <section className="border-y border-white/5 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold serif bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-slate-400 uppercase tracking-wider">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FEATURES SHOWCASE ================= */}
      <section className="container mx-auto px-4 sm:px-6 py-16 sm:py-24 md:py-32">
        <div className="text-center mb-12 sm:mb-16 md:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold serif mb-4 sm:mb-6 px-4">
              Engineered for Excellence
            </h3>
            <p className="text-base sm:text-lg md:text-xl text-slate-400 max-w-2xl mx-auto px-4">
              Every feature designed to elevate your retail operations to new heights
            </p>
          </motion.div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              onMouseEnter={() => setActiveFeature(i)}
              className="group"
            >
              <Card className="bg-slate-800/30 border-slate-700/50 backdrop-blur-sm hover:bg-slate-800/50 hover:border-blue-500/30 transition-all duration-500 h-full hover:shadow-xl hover:shadow-blue-500/10">
                <CardContent className="p-6 sm:p-8">
                  <div className="mb-4 sm:mb-6">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center group-hover:from-blue-500/30 group-hover:to-cyan-500/30 transition-all duration-500 border border-blue-500/20">
                      <feature.icon className="w-6 h-6 sm:w-7 sm:h-7 text-blue-400" />
                    </div>
                  </div>
                  
                  <h4 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 serif">
                    {feature.title}
                  </h4>
                  
                  <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>

                  <div className="mt-4 sm:mt-6 flex items-center text-blue-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    Learn more
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ================= VISUAL BREAK ================= */}
      <section className="relative py-16 sm:py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-purple-600/10" />
        
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid md:grid-cols-2 gap-8 sm:gap-12 md:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-2 md:order-1"
            >
              <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold serif mb-4 sm:mb-6">
                Built for Scale.
                <br />
                Designed for Clarity.
              </h3>
              <p className="text-base sm:text-lg text-slate-300 mb-6 sm:mb-8 leading-relaxed">
                From single-location operations to multi-store enterprises,
                Olawale Store adapts to your ambitions. Real-time insights,
                automated workflows, and intelligent forecasting — all in one
                elegant interface.
              </p>
              <div className="space-y-3 sm:space-y-4">
                {benefits.map((benefit, i) => (
                  <motion.div
                    key={benefit}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-slate-300 text-sm sm:text-base">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative order-1 md:order-2"
            >
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-cyan-500/20 backdrop-blur-xl border border-slate-700/50 p-6 sm:p-8">
                <div className="w-full h-full rounded-xl bg-slate-900/60 border border-slate-700/50 flex items-center justify-center backdrop-blur-sm">
                  <ShoppingCart className="w-24 h-24 sm:w-32 sm:h-32 text-blue-500/40" />
                </div>
              </div>
              
              {/* Decorative floating elements */}
              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-4 -right-4 sm:-top-6 sm:-right-6 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-blue-600/30 blur-xl"
              />
              <motion.div
                animate={{ y: [0, 20, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-4 -left-4 sm:-bottom-6 sm:-left-6 w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-purple-600/30 blur-xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="container mx-auto px-4 sm:px-6 py-16 sm:py-24 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-2xl sm:rounded-3xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500" />
          
          <div className="relative z-10 text-center py-16 sm:py-20 md:py-24 px-6 sm:px-8 text-white">
            <h3 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold serif mb-4 sm:mb-6">
              Ready to Transform
              <br className="hidden sm:block" />
              <span className="sm:inline"> </span>Your Retail Operations?
            </h3>
            
            <p className="text-base sm:text-lg md:text-xl mb-8 sm:mb-10 max-w-2xl mx-auto opacity-95">
              Join the future of intelligent inventory management.
              Start your journey today — no credit card required.
            </p>

            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-slate-100 font-semibold text-base sm:text-lg px-8 sm:px-10 py-6 sm:py-7 shadow-xl w-full sm:w-auto"
              onClick={() => router.push("/register")}
            >
              Launch Your Dashboard
              <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>

          {/* Decorative pattern overlay */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </motion.div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-white/5 py-8 sm:py-12 bg-slate-900/50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl overflow-hidden border border-blue-500/30">
                <Image
                  src="/olawale-store2.png"
                  alt="Olawale Store"
                  width={40}
                  height={40}
                  className="object-cover"
                />
              </div>
              <div>
                <div className="font-semibold serif text-sm sm:text-base">Olawale Store</div>
                <div className="text-[10px] sm:text-xs text-slate-500">Retail Intelligence Platform</div>
              </div>
            </div>

            <div className="text-xs sm:text-sm text-slate-500 text-center md:text-right">
              © {new Date().getFullYear()} Olawale Store. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ----------------------------
// Data
// ----------------------------
const stats = [
  { value: "99.9%", label: "Uptime" },
  { value: "<100ms", label: "Response Time" },
  { value: "Real-time", label: "Analytics" },
  { value: "24/7", label: "Support" },
];

const features = [
  {
    icon: FolderKanban,
    title: "Smart Categorization",
    description:
      "Intelligent product organization with dynamic tagging and advanced search capabilities.",
  },
  {
    icon: BarChart3,
    title: "Live Analytics",
    description:
      "Real-time business intelligence with predictive insights and trend analysis.",
  },
  {
    icon: Users,
    title: "Team Management",
    description:
      "Granular access controls and role-based permissions for your entire team.",
  },
  {
    icon: ShoppingCart,
    title: "Sales Engine",
    description:
      "Streamlined transaction processing with integrated revenue tracking.",
  },
  {
    icon: Bell,
    title: "Smart Alerts",
    description:
      "Proactive notifications for inventory levels, sales patterns, and anomalies.",
  },
  {
    icon: FileBarChart,
    title: "Advanced Reporting",
    description:
      "Comprehensive business reports with customizable metrics and exports.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description:
      "Bank-grade encryption and compliance with industry security standards.",
  },
  {
    icon: Zap,
    title: "Workflow Automation",
    description:
      "Eliminate repetitive tasks with intelligent automation and triggers.",
  },
];

const benefits = [
  "Unlimited product catalog capacity",
  "Multi-location inventory sync",
  "Advanced forecasting algorithms",
  "Customizable dashboards & reports",
  "API integration capabilities",
];