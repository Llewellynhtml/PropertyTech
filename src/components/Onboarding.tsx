import React, { useState } from 'react';
import { 
  Sparkles, 
  Target, 
  Zap, 
  CheckCircle2, 
  ArrowRight,
  ChevronRight,
  User,
  Building2,
  Rocket
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Onboarding({ onComplete }: any) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);

  const steps = [
    {
      title: "Welcome to PropPost",
      description: "The AI-powered command center for South African real estate professionals.",
      icon: Sparkles,
      color: "bg-indigo-600",
      content: (
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 bg-indigo-600 text-white rounded-[2rem] flex items-center justify-center mb-8 shadow-xl shadow-indigo-100 rotate-6">
            <Rocket className="w-10 h-10" />
          </div>
          <p className="text-center text-gray-500 font-medium px-8">
            We've built everything you need to manage listings, generate content, and capture leads automatically.
          </p>
        </div>
      )
    },
    {
      title: "AI Marketing",
      description: "Post to Instagram, Facebook, and more in seconds.",
      icon: Zap,
      color: "bg-amber-500",
      content: (
        <div className="space-y-4">
          {[
            "Select any of your live listings",
            "Gemini generates professional captions",
            "Schedule for peak engagement times"
          ].map((text, i) => (
            <div key={i} className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <div className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-gray-700">{text}</span>
            </div>
          ))}
        </div>
      )
    },
    {
      title: "Lead Capture",
      description: "Never miss a prospect again.",
      icon: Target,
      color: "bg-emerald-500",
      content: (
        <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[2rem] flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
            <Target className="w-8 h-8 text-emerald-600" />
          </div>
          <h4 className="font-black text-emerald-900 text-lg">Centralised Inbox</h4>
          <p className="text-xs text-emerald-600 font-bold mt-2 leading-relaxed">
            All your leads from WhatsApp, Socials, and Portals flow into one smart dashboard.
          </p>
        </div>
      )
    }
  ];

  const currentStep = steps[step - 1];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-900/40 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg bg-white rounded-[3rem] shadow-2xl overflow-hidden relative"
      >
        <div className={cn("h-40 transition-colors duration-500 flex items-center justify-center relative overflow-hidden", currentStep.color)}>
           <div className="absolute inset-0 opacity-10">
             <div className="grid grid-cols-6 gap-4 rotate-12 -translate-y-20">
               {Array.from({ length: 48 }).map((_, i) => (
                 <div key={i} className="w-12 h-12 border border-white rounded-lg" />
               ))}
             </div>
           </div>
           <currentStep.icon className="w-16 h-16 text-white relative z-10" />
        </div>

        <div className="p-10">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-gray-900 mb-2">{currentStep.title}</h2>
            <p className="text-gray-500 font-medium">{currentStep.description}</p>
          </div>

          <div className="min-h-[220px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {currentStep.content}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-12 flex items-center justify-between">
            <div className="flex gap-2">
              {steps.map((_, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    step === i + 1 ? "w-8 bg-indigo-600" : "w-3 bg-gray-200"
                  )}
                />
              ))}
            </div>
            
            <button
              onClick={() => {
                if (step < steps.length) setStep(s => s + 1);
                else onComplete(user?.role);
              }}
              className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-3 active:scale-95"
            >
              {step === steps.length ? "Get Started" : "Continue"}
              <ChevronRight className="w-5 h-5 stroke-[3px]" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
