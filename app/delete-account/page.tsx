'use client';

import { useRouter } from 'next/navigation';
import { useSidebar } from '@/contexts/SidebarContext';
import Sidebar from '@/components/Sidebar';
import { 
  ArrowLeft, 
  Mail, 
  Trash2,
  Shield,
  Clock,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Globe
} from 'lucide-react';

export default function DeleteAccountPage() {
  const router = useRouter();
  const { isCollapsed } = useSidebar();

  const handleEmail = () => {
    window.location.href = 'mailto:admin@africartz.ng?subject=Account Deletion Request';
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
            <div className="flex items-center gap-3 mb-2">
              <Trash2 className="text-red-500" size={32} />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Delete Your AfriBooking Account
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
              We respect your privacy and your right to control your personal data.
            </p>
          </div>

          <div className="space-y-6">
            {/* Introduction */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
              <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                You can delete your AfriBooking account directly from the app (recommended) or request deletion via email. Both methods are detailed below.
              </p>
            </div>

            {/* What happens section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="text-orange-500" size={20} />
                What happens when your account is deleted?
              </h2>
              <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base mb-3">
                When you request account deletion:
              </p>
              <ul className="space-y-2 ml-4">
                <li className="text-gray-700 dark:text-gray-300 text-sm sm:text-base flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Your user profile will be permanently removed</span>
                </li>
                <li className="text-gray-700 dark:text-gray-300 text-sm sm:text-base flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>All business data linked to your account may be deleted or deactivated (depending on regulatory requirements)</span>
                </li>
                <li className="text-gray-700 dark:text-gray-300 text-sm sm:text-base flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>You will no longer be able to log in</span>
                </li>
                <li className="text-gray-700 dark:text-gray-300 text-sm sm:text-base flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>The action cannot be reversed</span>
                </li>
                <li className="text-gray-700 dark:text-gray-300 text-sm sm:text-base flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>We may retain certain transaction or financial records if required by law</span>
                </li>
              </ul>
            </div>

            {/* How to delete section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">
                How to Delete Your Account
              </h2>

              {/* Recommended: In-App */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 sm:p-5 mb-6">
                <div className="flex items-start gap-3 mb-3">
                  <CheckCircle2 className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" size={20} />
                  <h3 className="text-base sm:text-lg font-semibold text-green-800 dark:text-green-300">
                    Recommended: Delete from the App
                  </h3>
                </div>
                <p className="text-green-700 dark:text-green-300 text-sm sm:text-base mb-4 font-medium">
                  The easiest way to delete your account is directly from the AfriBooking app:
                </p>
                <ol className="space-y-2 ml-4">
                  <li className="text-green-700 dark:text-green-300 text-sm sm:text-base flex items-start gap-2">
                    <span className="font-semibold">1.</span>
                    <span>Open the AfriBooking app on your device</span>
                  </li>
                  <li className="text-green-700 dark:text-green-300 text-sm sm:text-base flex items-start gap-2">
                    <span className="font-semibold">2.</span>
                    <span>Go to <strong>Profile</strong> → <strong>Settings</strong> → <strong>Profile Settings</strong></span>
                  </li>
                  <li className="text-green-700 dark:text-green-300 text-sm sm:text-base flex items-start gap-2">
                    <span className="font-semibold">3.</span>
                    <span>Scroll down and tap <strong>"Delete Account"</strong></span>
                  </li>
                  <li className="text-green-700 dark:text-green-300 text-sm sm:text-base flex items-start gap-2">
                    <span className="font-semibold">4.</span>
                    <span>Enter your password to confirm</span>
                  </li>
                  <li className="text-green-700 dark:text-green-300 text-sm sm:text-base flex items-start gap-2">
                    <span className="font-semibold">5.</span>
                    <span>Your account will be deleted immediately</span>
                  </li>
                </ol>
                <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <p className="text-green-800 dark:text-green-300 text-sm sm:text-base font-semibold">
                    ✨ This method is instant and requires no waiting period.
                  </p>
                </div>
              </div>

              {/* Alternative: Email */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Alternative: Request via Email
                </h3>
                <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base mb-4">
                  If you cannot access the app or prefer to request deletion via email, please send an email to:
                </p>
                
                <div className="bg-gray-50 dark:bg-gray-900 border-l-4 border-red-500 rounded-lg p-4 sm:p-5 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="text-red-500" size={20} />
                    <strong className="text-gray-900 dark:text-white text-sm sm:text-base">Email:</strong>
                  </div>
                  <a 
                    href="mailto:admin@africartz.ng?subject=Account Deletion Request"
                    className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 text-base sm:text-lg font-semibold break-all"
                  >
                    admin@africartz.ng
                  </a>
                </div>
                
                <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base mb-3">
                  Include the following details in your email:
                </p>
                <ul className="space-y-2 ml-4">
                  <li className="text-gray-700 dark:text-gray-300 text-sm sm:text-base flex items-start gap-2">
                    <span className="text-gray-500 mt-1">•</span>
                    <span><strong>Full Name</strong> (registered on the app)</span>
                  </li>
                  <li className="text-gray-700 dark:text-gray-300 text-sm sm:text-base flex items-start gap-2">
                    <span className="text-gray-500 mt-1">•</span>
                    <span><strong>Email Address</strong> used for your AfriBooking account</span>
                  </li>
                  <li className="text-gray-700 dark:text-gray-300 text-sm sm:text-base flex items-start gap-2">
                    <span className="text-gray-500 mt-1">•</span>
                    <span><strong>Phone Number</strong></span>
                  </li>
                  <li className="text-gray-700 dark:text-gray-300 text-sm sm:text-base flex items-start gap-2">
                    <span className="text-gray-500 mt-1">•</span>
                    <span><strong>Business or Company Name</strong> (if any)</span>
                  </li>
                  <li className="text-gray-700 dark:text-gray-300 text-sm sm:text-base flex items-start gap-2">
                    <span className="text-gray-500 mt-1">•</span>
                    <span><strong>Optional:</strong> Reason for deleting your account</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Processing time */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 sm:p-6">
              <div className="flex items-start gap-3 mb-3">
                <Clock className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" size={20} />
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                  Processing Time
                </h2>
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base mb-3 font-medium">
                Processing times vary by method:
              </p>
              <ul className="space-y-2 ml-4">
                <li className="text-gray-700 dark:text-gray-300 text-sm sm:text-base flex items-start gap-2">
                  <span className="text-yellow-600 mt-1">•</span>
                  <span><strong>In-App Deletion:</strong> Immediate (account deleted instantly)</span>
                </li>
                <li className="text-gray-700 dark:text-gray-300 text-sm sm:text-base flex items-start gap-2">
                  <span className="text-yellow-600 mt-1">•</span>
                  <span><strong>Email Requests:</strong> Processed within <strong>7 working days</strong></span>
                </li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base mt-4">
                If you request deletion via email, you will receive a confirmation email once your request has been completed.
              </p>
            </div>

            {/* Data security */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 sm:p-6">
              <div className="flex items-start gap-3 mb-3">
                <Shield className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" size={20} />
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                  Data Security Notice
                </h2>
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base mb-3 font-medium">
                All data transmitted from the AfriBooking app is encrypted using HTTPS.
              </p>
              <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base mb-3">
                We do not sell or share your personal information with third parties.
              </p>
              <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                Your privacy and data protection are important to us.
              </p>
            </div>

            {/* Need help */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-start gap-3 mb-4">
                <HelpCircle className="text-primary flex-shrink-0 mt-0.5" size={20} />
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                  Need Help?
                </h2>
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base mb-4">
                If you have additional questions about your account or data privacy, contact our support team:
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="text-primary" size={18} />
                  <span className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                    <strong>Email:</strong>{' '}
                    <a 
                      href="mailto:admin@africartz.ng"
                      className="text-primary hover:underline"
                    >
                      admin@africartz.ng
                    </a>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="text-primary" size={18} />
                  <span className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                    <strong>Website:</strong>{' '}
                    <a 
                      href="https://africartz.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      africartz.com
                    </a>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

