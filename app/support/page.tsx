'use client';

import { useRouter } from 'next/navigation';
import { useSidebar } from '@/contexts/SidebarContext';
import Sidebar from '@/components/Sidebar';
import { 
  ArrowLeft, 
  Mail, 
  MessageCircle, 
  Facebook, 
  Twitter, 
  Instagram,
  ChevronRight,
  HelpCircle
} from 'lucide-react';

interface ContactOptionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  iconBgColor: string;
}

const ContactOption = ({ icon, title, description, onClick, iconBgColor }: ContactOptionProps) => {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow text-left"
    >
      <div className={`${iconBgColor} w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
          {title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
          {description}
        </p>
      </div>
      <ChevronRight size={20} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
    </button>
  );
};

interface SocialLinkProps {
  icon: React.ReactNode;
  href: string;
  bgColor: string;
  label: string;
}

const SocialLink = ({ icon, href, bgColor, label }: SocialLinkProps) => {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${bgColor} w-12 h-12 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow`}
      aria-label={label}
    >
      {icon}
    </a>
  );
};

export default function SupportPage() {
  const router = useRouter();
  const { isCollapsed } = useSidebar();

  const handleEmail = () => {
    window.location.href = 'mailto:customercare@africartz.ng';
  };

  const handleWhatsApp = () => {
    window.open('https://wa.me/2348089195366?text=', '_blank');
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <main className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
          {/* Header */}
          <div className="mb-4 sm:mb-6">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
            >
              <ArrowLeft size={20} />
              <span className="text-sm sm:text-base">Back</span>
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Support</h1>
          </div>

          {/* Logo Section */}
          <div className="flex flex-col items-center mb-8 sm:mb-12">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-primary flex items-center justify-center mb-6">
              <span className="text-white text-4xl sm:text-5xl font-bold">A</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white text-center mb-2">
              We're Here to Help
            </h2>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 text-center max-w-md">
              Get in touch with our support team for any assistance you need
            </p>
          </div>

          {/* Contact Options */}
          <div className="mb-8 sm:mb-12">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">
              Contact Us
            </h3>
            <div className="space-y-3 sm:space-y-4">
              <ContactOption
                icon={<Mail size={24} className="text-white" />}
                title="Send us an email"
                description="customercare@africartz.ng"
                onClick={handleEmail}
                iconBgColor="bg-blue-500"
              />
              <ContactOption
                icon={<MessageCircle size={24} className="text-white" />}
                title="Chat with us"
                description="Quick response on WhatsApp"
                onClick={handleWhatsApp}
                iconBgColor="bg-green-500"
              />
            </div>
          </div>

          {/* Social Media Section */}
          <div className="text-center mb-8 sm:mb-12">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2 sm:mb-4">
              Follow Us
            </h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6 sm:mb-8">
              Stay connected and get the latest updates
            </p>
            <div className="flex justify-center gap-4 sm:gap-6">
              <SocialLink
                icon={<Facebook size={20} className="text-white" />}
                href="https://www.facebook.com/africartz"
                bgColor="bg-blue-600 hover:bg-blue-700"
                label="Facebook"
              />
              <SocialLink
                icon={<Twitter size={20} className="text-white" />}
                href="https://x.com/africartz?s=11&t=ZS3honurObRiAtEkNnQbcQ"
                bgColor="bg-black hover:bg-gray-800"
                label="Twitter/X"
              />
              <SocialLink
                icon={<Instagram size={20} className="text-white" />}
                href="https://www.instagram.com/africartz?igsh=MTgyMjd1cXVzcjQ4"
                bgColor="bg-pink-500 hover:bg-pink-600"
                label="Instagram"
              />
            </div>
          </div>

          {/* Help Information */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-3 mb-4">
              <HelpCircle size={24} className="text-primary flex-shrink-0 mt-0.5" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                Need Quick Help?
              </h3>
            </div>
            <div className="space-y-2 sm:space-y-3 pl-9">
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                • Response time: Within 24 hours
              </p>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                • WhatsApp: Instant support during business hours
              </p>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                • Email: Detailed assistance for complex issues
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}


