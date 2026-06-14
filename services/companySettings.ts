export interface BranchOffice {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export interface CompanySettings {
  companyName: string;
  email: string;
  phone: string;
  website: string;
  headOfficeAddress: string;
  branches: BranchOffice[];
}

const STORAGE_KEY = 'company_info_settings';

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  companyName: "PT Perdana Adi Yuda",
  email: "info@perada.net",
  phone: "0858 9366 1683",
  website: "https://perada.net",
  headOfficeAddress: `Plaza Summarecon Bekasi Lt. 7\nJl. Bulevar Ahmad Yani, Marga Mulya\nBekasi Utara, Kota Bekasi - 17142`,
  branches: [
    {
      id: "branch-morowali",
      name: "Kantor Cabang / Perwakilan Morowali",
      address: `Jl. Trans Sulawesi, Desa Labota, Kec. Bahodopi\nKabupaten Morowali, Sulawesi Tengah - 94974`,
      lat: -2.8227,
      lng: 122.1462
    }
  ]
};

export const getCompanySettings = (): CompanySettings => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      // Ensure we have correct keys and array structure
      if (parsed && typeof parsed === 'object') {
        return {
          companyName: parsed.companyName || DEFAULT_COMPANY_SETTINGS.companyName,
          email: parsed.email || DEFAULT_COMPANY_SETTINGS.email,
          phone: parsed.phone || DEFAULT_COMPANY_SETTINGS.phone,
          website: parsed.website || DEFAULT_COMPANY_SETTINGS.website,
          headOfficeAddress: parsed.headOfficeAddress || DEFAULT_COMPANY_SETTINGS.headOfficeAddress,
          branches: Array.isArray(parsed.branches) ? parsed.branches : DEFAULT_COMPANY_SETTINGS.branches,
        };
      }
    }
  } catch (e) {
    console.error('Error loading company settings', e);
  }
  return DEFAULT_COMPANY_SETTINGS;
};

export const saveCompanySettings = (settings: CompanySettings): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    // Trigger custom event to notify other components to update
    window.dispatchEvent(new Event('company-settings-updated'));
  } catch (e) {
    console.error('Error saving company settings', e);
  }
};
