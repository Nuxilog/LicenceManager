import LicenseNavigation from "@/components/LicenseNavigation";

export default function NuxiSavLicenses() {
  return (
    <div className="container mx-auto px-4 py-6">
      <LicenseNavigation currentType="nuxisav" />
      <div className="p-8 text-center bg-slate-100 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Gestion des licences NuxiSAV</h2>
        <p className="text-lg">Cette section sera implémentée ultérieurement.</p>
        <p className="text-sm text-slate-500 mt-4">Les licences NuxiSAV sont stockées dans une base différente et auront une configuration spécifique.</p>
      </div>
    </div>
  );
}