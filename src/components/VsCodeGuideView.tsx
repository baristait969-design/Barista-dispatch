import React, { useState } from 'react';
import { 
  Code2, 
  Terminal, 
  Copy, 
  Check, 
  ExternalLink, 
  FolderTree, 
  PlayCircle, 
  Database, 
  ShieldCheck, 
  Award, 
  BookOpen,
  Sparkles
} from 'lucide-react';

export const VsCodeGuideView: React.FC = () => {
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

  const copyToClipboard = (text: string, stepIndex: number) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(stepIndex);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950/60 via-stone-900 to-stone-900 border border-amber-800/50 rounded-2xl p-6">
        <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
          <BookOpen className="w-4 h-4" />
          <span>University Project Guide</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white">
          How to Run Locally Using Visual Studio Code
        </h2>
        <p className="text-xs text-stone-300 mt-1 max-w-3xl leading-relaxed">
          Welcome! Here is your complete, beginner-friendly step-by-step guide to cloning, opening, running, and presenting this Barista Central Kitchen Dispatch & Inventory System in Visual Studio Code.
        </p>
      </div>

      {/* Step by Step Execution in VS Code */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 space-y-6">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <Terminal className="w-5 h-5 text-amber-400" />
          <span>Step-by-Step Local Setup Guide</span>
        </h3>

        {/* Step 1: Install Node.js */}
        <div className="flex items-start space-x-4">
          <div className="w-8 h-8 rounded-full bg-amber-600/20 text-amber-400 font-bold flex items-center justify-center shrink-0 border border-amber-600/40 text-sm">
            1
          </div>
          <div className="flex-1 space-y-1.5">
            <h4 className="text-sm font-bold text-white">Install Node.js & VS Code</h4>
            <p className="text-xs text-stone-400 leading-relaxed">
              Ensure you have installed <strong>Node.js (v18 or higher)</strong> and <strong>Visual Studio Code</strong> on your computer.
            </p>
            <div className="text-xs text-stone-400">
              Download from official site: <code className="text-amber-300">https://nodejs.org</code> (Select LTS version).
            </div>
          </div>
        </div>

        {/* Step 2: Open Folder in VS Code */}
        <div className="flex items-start space-x-4">
          <div className="w-8 h-8 rounded-full bg-amber-600/20 text-amber-400 font-bold flex items-center justify-center shrink-0 border border-amber-600/40 text-sm">
            2
          </div>
          <div className="flex-1 space-y-1.5">
            <h4 className="text-sm font-bold text-white">Open Project Folder in VS Code</h4>
            <p className="text-xs text-stone-400 leading-relaxed">
              Open Visual Studio Code, click <strong>File ➔ Open Folder...</strong>, and select the folder containing this project.
            </p>
            <p className="text-xs text-stone-400">
              Open the integrated terminal by pressing <kbd className="bg-stone-800 px-1.5 py-0.5 rounded border border-stone-700 text-stone-200">Ctrl + `</kbd> (or <kbd className="bg-stone-800 px-1.5 py-0.5 rounded border border-stone-700 text-stone-200">Cmd + `</kbd> on Mac).
            </p>
          </div>
        </div>

        {/* Step 3: Install Dependencies */}
        <div className="flex items-start space-x-4">
          <div className="w-8 h-8 rounded-full bg-amber-600/20 text-amber-400 font-bold flex items-center justify-center shrink-0 border border-amber-600/40 text-sm">
            3
          </div>
          <div className="flex-1 space-y-2">
            <h4 className="text-sm font-bold text-white">Install Project Dependencies</h4>
            <p className="text-xs text-stone-400 leading-relaxed">
              In your VS Code terminal, run this command to download and install all necessary packages:
            </p>
            <div className="flex items-center justify-between bg-stone-950 p-3 rounded-lg border border-stone-800 font-mono text-xs text-amber-300">
              <span>npm install</span>
              <button
                onClick={() => copyToClipboard('npm install', 3)}
                className="text-stone-400 hover:text-white flex items-center space-x-1"
              >
                {copiedStep === 3 ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span className="text-[10px]">{copiedStep === 3 ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Step 4: Start Development Server */}
        <div className="flex items-start space-x-4">
          <div className="w-8 h-8 rounded-full bg-amber-600/20 text-amber-400 font-bold flex items-center justify-center shrink-0 border border-amber-600/40 text-sm">
            4
          </div>
          <div className="flex-1 space-y-2">
            <h4 className="text-sm font-bold text-white">Start the Development Server</h4>
            <p className="text-xs text-stone-400 leading-relaxed">
              Run this command to start the live web application on your local machine:
            </p>
            <div className="flex items-center justify-between bg-stone-950 p-3 rounded-lg border border-stone-800 font-mono text-xs text-amber-300">
              <span>npm run dev</span>
              <button
                onClick={() => copyToClipboard('npm run dev', 4)}
                className="text-stone-400 hover:text-white flex items-center space-x-1"
              >
                {copiedStep === 4 ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span className="text-[10px]">{copiedStep === 4 ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-xs text-stone-300">
              Once it starts, hold <kbd className="bg-stone-800 px-1 rounded border border-stone-700">Ctrl</kbd> and click <strong className="text-amber-400">http://localhost:3000</strong> to open the app in Google Chrome or any browser!
            </p>
          </div>
        </div>

        {/* Step 5: Production Build */}
        <div className="flex items-start space-x-4">
          <div className="w-8 h-8 rounded-full bg-amber-600/20 text-amber-400 font-bold flex items-center justify-center shrink-0 border border-amber-600/40 text-sm">
            5
          </div>
          <div className="flex-1 space-y-2">
            <h4 className="text-sm font-bold text-white">Build for Production / Deployment</h4>
            <p className="text-xs text-stone-400 leading-relaxed">
              When ready to deploy or submit your final project build:
            </p>
            <div className="flex items-center justify-between bg-stone-950 p-3 rounded-lg border border-stone-800 font-mono text-xs text-amber-300">
              <span>npm run build</span>
              <button
                onClick={() => copyToClipboard('npm run build', 5)}
                className="text-stone-400 hover:text-white flex items-center space-x-1"
              >
                {copiedStep === 5 ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span className="text-[10px]">{copiedStep === 5 ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Firebase Database & Hosting Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center space-x-2 text-amber-400">
            <Database className="w-5 h-5" />
            <h3 className="font-bold text-white text-sm">Firebase Backend Architecture</h3>
          </div>
          <p className="text-xs text-stone-300 leading-relaxed">
            The app is integrated with Firebase Firestore and Authentication. The configuration is stored in <code className="text-amber-400 font-mono text-[11px]">firebase-applet-config.json</code>.
          </p>
          <div className="space-y-1.5 text-xs text-stone-400">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span><strong>inventory</strong>: Central kitchen batch documents & stock levels</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              <span><strong>dispatch_logs</strong>: HACCP BCL/REC/HACCP/32 records</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-purple-400"></span>
              <span><strong>outlets</strong>: Retail branch destinations & IDs</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-rose-400"></span>
              <span><strong>users</strong>: Staff profiles, roles & permissions</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span><strong>batch_logs</strong>: Real-time stock reduction audit trail</span>
            </div>
          </div>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center space-x-2 text-emerald-400">
            <Award className="w-5 h-5" />
            <h3 className="font-bold text-white text-sm">University Presentation Tips</h3>
          </div>
          <p className="text-xs text-stone-300 leading-relaxed">
            To impress your lecturers and examiners during your viva presentation:
          </p>
          <ul className="text-xs text-stone-400 space-y-1.5 list-disc pl-4 leading-relaxed">
            <li>
              <strong>Demonstrate RBAC</strong>: Use the top "Switch Role" button to show how buttons and edit capabilities dynamically disappear for <em>Viewer</em> and enable for <em>Editor/Admin</em>.
            </li>
            <li>
              <strong>Demonstrate Real-Time Stock Deduction</strong>: Go to "Dispatch Forms", enter 10 units for a batch, click Submit, and immediately show the Inventory page to prove stock reduced automatically!
            </li>
            <li>
              <strong>Show Print Capability</strong>: Click "Print Document" to show the exact paper format matching standard HACCP documentation.
            </li>
            <li>
              <strong>Explain Supervisor Lock</strong>: Show that the supervisor sign-off field cannot be tampered with because it strictly reads the authenticated user session.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
