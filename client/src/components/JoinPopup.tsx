"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X, User, Briefcase } from "lucide-react";
import AuthModal from "@/components/AuthModal";
import { useLanguage } from "@/context/LanguageContext";

// Session key — popup only shows once per browser session (tab).
const SESSION_KEY = "engezhaly_join_popup_dismissed";
// Shared key — set by MainHeader (or any auth trigger) when AuthModal opens
const AUTH_OPENED_KEY = "engezhaly_auth_modal_opened";
// Delay in ms before the popup appears
const POPUP_DELAY_MS = 5000;

export default function JoinPopup() {
  const { lang, isRTL } = useLanguage();
  const ar = lang === 'ar';
  const [visible, setVisible] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authStep, setAuthStep] = useState<
    "role-selection" | "client-auth" | "freelancer-step-1" | "login" | "forgot-password"
  >("role-selection");

  useEffect(() => {
    // Do not show if the user is already logged in (any role)
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    if (token && userStr) {
      // User is authenticated — skip popup entirely
      return;
    }

    // Do not show if already dismissed this session
    if (sessionStorage.getItem(SESSION_KEY)) {
      return;
    }

    const timer = setTimeout(() => {
      // Don't show the popup if the user already opened the AuthModal manually
      if (sessionStorage.getItem(AUTH_OPENED_KEY)) {
        return;
      }
      setVisible(true);
    }, POPUP_DELAY_MS);

    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    setVisible(false);
    sessionStorage.setItem(SESSION_KEY, "1");
    sessionStorage.setItem(AUTH_OPENED_KEY, "1");
  };

  const openClientAuth = () => {
    dismiss();
    setAuthStep("client-auth");
    setAuthModalOpen(true);
  };

  const openFreelancer = () => {
    dismiss();
    setAuthStep("freelancer-step-1");
    setAuthModalOpen(true);
  };

  const openLogin = () => {
    dismiss();
    setAuthStep("login");
    setAuthModalOpen(true);
  };

  if (!visible && !authModalOpen) return null;

  return (
    <>
      {/* Timed join popup */}
      {visible && (
        <div
          dir={isRTL ? 'rtl' : 'ltr'}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => {
            // Close when clicking the backdrop
            if (e.target === e.currentTarget) dismiss();
          }}
        >
          {/* Modal card — styled to match AuthModal role-selection step exactly */}
          <div className="relative w-full bg-white rounded-2xl md:rounded-3xl shadow-2xl max-w-2xl mx-auto animate-in zoom-in-95 fade-in duration-300">
            <div className="px-4 md:px-8 pb-6 md:pb-8 pt-2">

              {/* Header — matches AuthModal role-selection header */}
              <div className="text-center py-2 md:py-4">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex-1" />
                  <div className="flex items-center justify-center gap-3">
                    <h2 className="text-2xl md:text-4xl font-black text-gray-900">{ar ? 'انضم' : 'Join'}</h2>
                    <Image
                      src="/logos/logo-green.png"
                      alt="Engezhaly"
                      width={240}
                      height={66}
                      className="h-14 md:h-20 w-auto"
                      priority
                    />
                  </div>
                  <div className="flex-1 flex justify-end">
                    <button
                      onClick={dismiss}
                      className="p-2 rounded-full hover:bg-gray-100 transition-colors -m-2"
                      aria-label="Close"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                </div>

                <p className="text-base md:text-xl text-gray-600 mb-6 md:mb-12">
                  {ar ? 'كيف تريد استخدام المنصة؟' : 'How do you want to use the platform?'}
                </p>

                {/* Role cards — matches AuthModal grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {/* Business owner */}
                  <button
                    type="button"
                    onClick={openClientAuth}
                    className="group flex flex-col items-center justify-center p-6 md:p-10 border-2 border-gray-100 rounded-2xl md:rounded-3xl hover:border-[#09BF44] hover:bg-green-50/50 transition-all duration-300"
                  >
                    <div className="w-16 h-16 md:w-24 md:h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4 md:mb-6 group-hover:bg-[#09BF44] transition-colors">
                      <User className="w-8 h-8 md:w-12 md:h-12 text-gray-600 group-hover:text-white" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-gray-900">{ar ? 'أنا صاحب عمل' : 'I am a Businessowner'}</h3>
                    <p className="text-sm md:text-base text-gray-500 mt-2 font-medium">{ar ? 'اعثر على المواهب وأنجز أعمالك' : 'Find talent & get work done'}</p>
                  </button>

                  {/* I Want to Freelance */}
                  <button
                    type="button"
                    onClick={openFreelancer}
                    className="group flex flex-col items-center justify-center p-6 md:p-10 border-2 border-gray-100 rounded-2xl md:rounded-3xl hover:border-[#09BF44] hover:bg-green-50/50 transition-all duration-300"
                  >
                    <div className="w-16 h-16 md:w-24 md:h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4 md:mb-6 group-hover:bg-[#09BF44] transition-colors">
                      <Briefcase className="w-8 h-8 md:w-12 md:h-12 text-gray-600 group-hover:text-white" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-gray-900">{ar ? 'أريد العمل كمستقل' : 'I Want to Freelance'}</h3>
                    <p className="text-sm md:text-base text-gray-500 mt-2 font-medium">{ar ? 'قدّم خدماتك واكسب المال' : 'Sell your services & earn'}</p>
                  </button>
                </div>

                {/* Footer — matches AuthModal footer */}
                <div className="mt-6 md:mt-8 space-y-3">
                  <p className="text-gray-600">
                    {ar ? 'لديك حساب بالفعل؟' : 'Already have an account?'}{" "}
                    <button
                      onClick={openLogin}
                      className="text-[#09BF44] font-bold hover:underline"
                    >
                      {ar ? 'تسجيل الدخول' : 'Log In'}
                    </button>
                  </p>
                  <div>
                    <button
                      onClick={dismiss}
                      className="text-gray-400 text-sm font-medium hover:text-gray-600 transition-colors"
                    >
                      {ar ? 'لاحقاً' : 'Later'}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* AuthModal triggered from this popup */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialStep={authStep}
      />
    </>
  );
}
