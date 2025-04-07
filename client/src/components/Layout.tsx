import { ReactNode } from "react";
import logoPath from "../assets/logo.png";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <header className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={logoPath} alt="Logo Nuxilog" className="h-10 w-10" />
              <h1 className="text-2xl font-semibold text-slate-900">Gestion des licences Nuxilog</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Base de données active:</span>
              <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                <span className="mr-1 h-2 w-2 rounded-full bg-blue-500"></span>
                NuxiDev2018
              </span>
            </div>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
