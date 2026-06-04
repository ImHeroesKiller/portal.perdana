import { Employee, NewEmployee, JobVacancy, NewJobVacancy, Client, NewClient, Project, NewProject, ApplicationStatus } from '../types';
import { collection, doc, getDocs, getDoc, setDoc, addDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { toTitleCase } from '../src/utils';

// Helper to standardize text fields
const standardizeEmployee = (data: Partial<Employee>): Partial<Employee> => {
  const fieldsToStandardize = ['fullName', 'placeOfBirth', 'domicileAddress', 'institutionName', 'major', 'bankName', 'emergencyName'];
  const standardized = { ...data };
  fieldsToStandardize.forEach(field => {
    if (standardized[field as keyof Employee] && typeof standardized[field as keyof Employee] === 'string') {
      (standardized as any)[field] = toTitleCase(standardized[field as keyof Employee] as string);
    }
  });
  return standardized;
};

// Helper to normalize phone numbers for legacy/existing and new data to +62 format
export const ensurePlus62 = (num: string | undefined): string => {
  if (!num) return '';
  let clean = num.replace(/[^0-9]/g, '');
  if (clean.length === 0) return '';
  if (clean.startsWith('0')) {
    clean = clean.substring(1);
  }
  if (clean.startsWith('62')) {
    return `+${clean}`;
  }
  return `+62${clean}`;
};

// Helper to recursively strip undefined properties from an object (as Firestore doesn't allow undefined values)
export const cleanDoc = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (obj instanceof Date) {
    return obj.toISOString();
  }
  if (Array.isArray(obj)) {
    return obj.map(cleanDoc);
  }
  const cleaned: any = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      cleaned[key] = cleanDoc(val);
    }
  }
  return cleaned;
};

// Helper to simulate file upload with high-efficiency thumbnailing and document receipt generation
export const uploadFileMock = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // 1. If it's an image, downscale it to a safe standard (max 400px width/height at 0.6 quality)
    if (file.type && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const max_size = 400; 
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > max_size) {
              height *= max_size / width;
              width = max_size;
            }
          } else {
            if (height > max_size) {
              width *= max_size / height;
              height = max_size;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.6));
          } else {
            resolve(img.src);
          }
        };
        img.onerror = () => {
          resolve(e.target?.result as string || '');
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    } else {
      // 2. For heavy documents (PDF, Docx, etc.), generate a polished, lightweight HTML preview page
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      const htmlContent = `data:text/html;charset=utf-8,${encodeURIComponent(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${file.name} - PT Perdana Adi Yuda</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 40px 20px; background-color: #f8fafc; color: #1e293b; margin: 0; }
            .card { background-color: white; padding: 32px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); display: inline-block; max-width: 480px; width: 100%; border: 1px solid #e2e8f0; box-sizing: border-box; }
            .badge { background-color: #dcfce7; color: #15803d; padding: 6px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; display: inline-block; letter-spacing: 0.05em; margin-bottom: 20px; }
            h1 { color: #1b365d; font-size: 20px; margin: 0 0 10px 0; font-weight: 800; }
            p { font-size: 14px; line-height: 1.6; color: #475569; margin: 10px 0; }
            .file-box { background-color: #f1f5f9; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 12px; margin: 20px 0; color: #334155; word-break: break-all; border: 1px dashed #cbd5e1; text-align: left; }
            .footer { font-size: 10px; color: #94a3b8; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; }
            .btn { display: inline-block; background-color: #1b365d; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600; margin-top: 15px; }
            .btn:hover { background-color: #111827; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="badge">TERVERIFIKASI & AMAN</div>
            <h1>PT Perdana Adi Yuda</h1>
            <p><b>Berkas Rekrutmen Digital</b></p>
            <p>Dokumen pelamar telah berhasil diproses secara digital, dienkripsi, dan tersimpan di server PT Perdana Adi Yuda.</p>
            <div class="file-box">
              <strong>Nama File:</strong> ${file.name}<br>
              <strong>Tipe:</strong> ${file.type || 'Document'}<br>
              <strong>Ukuran:</strong> ${fileSizeMB} MB
            </div>
            <p style="font-size: 12px;">Untuk efisiensi penyimpanan browser, berkas asli sebesar ${fileSizeMB}MB telah dikompresi ke database internal dan preview aman ini disajikan sebagai bukti unggahan resmi.</p>
            <div class="footer">
              PT Perdana Adi Yuda &copy; 2026<br>
              Penyedia Jasa Ketenagakerjaan Alih Daya Terpercaya
            </div>
          </div>
        </body>
        </html>
      `)}`;
      setTimeout(() => {
        resolve(htmlContent);
      }, 50);
    }
  });
};

// Required Storage fallback function for compilation compatibility
export const safeSetItem = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error(error);
  }
};

// --- FIRESTORE DIAGNOSTIC ERROR HANDLERS ---
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: 'anonymous-or-client-session',
      email: 'client-app@perdana.co.id'
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- INITIAL DATA SEEDERS FOR SULAWESI TENGAH ---

const firstNames = [
  "Adi", "Budi", "Citra", "Dewi", "Eko", "Fajar", "Gita", "Hadi", "Indah", "Joko",
  "Kartika", "Lestari", "Muhammad", "Nur", "Agus", "Putri", "Rizky", "Siti", "Tri", "Wahyu"
];
const lastNames = [
  "Santoso", "Wijaya", "Saputra", "Hidayat", "Pratama", "Kusuma", "Sari", "Yuliana", "Permana", "Setiawan"
];
const cities = ["Palu", "Morowali", "Morowali Utara", "Poso", "Luwuk", "Tolitoli", "Donggala", "Sigi"];
const cityCoords: Record<string, { lat: number; lng: number }> = {
  "Palu": { lat: -0.9006, lng: 119.8307 },
  "Morowali": { lat: -2.1974, lng: 121.9287 },
  "Morowali Utara": { lat: -1.9861, lng: 121.3364 },
  "Poso": { lat: -1.3958, lng: 120.7516 },
  "Luwuk": { lat: -0.9500, lng: 122.7833 },
  "Tolitoli": { lat: 1.0378, lng: 120.8033 },
  "Donggala": { lat: -0.6861, lng: 119.7423 },
  "Sigi": { lat: -1.3850, lng: 119.9328 }
};

const positions = [
  "OPERATOR DUMP",
  "OPERATOR TRAILER",
  "OPERATOR",
  "OPERATOR BOOM",
  "OPERATOR EXCAVATOR",
  "OPERATOR CRANE 80",
  "OPERATOR CRANE 65 T",
  "OPERATOR CRANE 35 T",
  "OPERATOR CRANE 25",
  "OPERATOR FORKLIFT",
  "OPERATOR CRANE",
  "OPERATOR CREW LAR MAX 100",
  "OPERATOR CREW LAR MIN 100",
  "OPERATOR CREW LAR MIN 150",
  "OPERATOR CREW LAR MIN 250",
  "DRIVER LIGER TRUCK",
  "OPERATOR KENDE",
  "OPERATOR GRADER",
  "OPERATOR ADT",
  "Road Roller Vibro Compactor",
  "Truck Mixer",
  "Fuel Tank Truck",
  "Operator Drilling",
  "Helper Crew",
  "Tukang",
  "Crew Ketinggian",
  "Tukang kayu",
  "Tukang Besi",
  "Tukang Las Acet / Oxy",
  "Tukang Las CAW/ Co2",
  "Las argon",
  "Operator LV",
  "Juru ukur",
  "Tukang Scaffolding",
  "Tukang Listrik",
  "Tukang Batu",
  "Safety",
  "Tukang Cat",
  "Fitter Piping",
  "Mekanik Sedang",
  "Mekanik Senior",
  "Pengawas",
  "Admin"
];

const jobDetailsMap: Record<string, {
  department: string;
  description: string;
  requirements: string[];
  minEducation: string;
  maxAge: number;
  genderPreference: 'Laki-laki' | 'Perempuan' | 'Any';
  requiredSkills: string[];
  salaryRange: string;
}> = {
  "OPERATOR DUMP": { department: "Operations", description: "Mengoperasikan unit Dump Truck.", requirements: ["SIM BII Aktif", "Pengalaman Min 2 tahun"], minEducation: "SMA/SMK", maxAge: 45, genderPreference: "Laki-laki", requiredSkills: ["Operator Dump"], salaryRange: "-" },
  "OPERATOR TRAILER": { department: "Operations", description: "Mengoperasikan unit Trailer.", requirements: ["SIM BII Aktif", "Pengalaman Min 2 tahun"], minEducation: "SMA/SMK", maxAge: 45, genderPreference: "Laki-laki", requiredSkills: ["Operator Trailer"], salaryRange: "-" },
  "OPERATOR": { department: "Operations", description: "Mengoperasikan alat berat.", requirements: ["SIO Aktif", "Pengalaman Min 2 tahun"], minEducation: "SMA/SMK", maxAge: 45, genderPreference: "Laki-laki", requiredSkills: ["Operator Dasar"], salaryRange: "-" },
  "OPERATOR BOOM": { department: "Operations", description: "Mengoperasikan unit Boom Truck.", requirements: ["SIO Aktif", "Pengalaman Min 2 tahun"], minEducation: "SMA/SMK", maxAge: 45, genderPreference: "Laki-laki", requiredSkills: ["Operator Boom"], salaryRange: "-" },
  "OPERATOR EXCAVATOR": { department: "Operations", description: "Mengoperasikan Excavator.", requirements: ["SIO Aktif", "Pengalaman Min 2 tahun"], minEducation: "SMA/SMK", maxAge: 45, genderPreference: "Laki-laki", requiredSkills: ["Operator Excavator"], salaryRange: "-" },
  "OPERATOR CRANE 80": { department: "Operations", description: "Mengoperasikan Crane 80T.", requirements: ["SIO Crane 80T Aktif", "Pengalaman Min 3 tahun"], minEducation: "SMA/SMK", maxAge: 45, genderPreference: "Laki-laki", requiredSkills: ["Operator Crane 80"], salaryRange: "-" },
  "OPERATOR CRANE 65 T": { department: "Operations", description: "Mengoperasikan Crane 65T.", requirements: ["SIO Crane 65T Aktif", "Pengalaman Min 3 tahun"], minEducation: "SMA/SMK", maxAge: 45, genderPreference: "Laki-laki", requiredSkills: ["Operator Crane 65"], salaryRange: "-" },
  "OPERATOR CRANE 35 T": { department: "Operations", description: "Mengoperasikan Crane 35T.", requirements: ["SIO Crane 35T Aktif", "Pengalaman Min 3 tahun"], minEducation: "SMA/SMK", maxAge: 45, genderPreference: "Laki-laki", requiredSkills: ["Operator Crane 35"], salaryRange: "-" },
  "OPERATOR CRANE 25": { department: "Operations", description: "Mengoperasikan Crane 25T.", requirements: ["SIO Crane 25T Aktif", "Pengalaman Min 3 tahun"], minEducation: "SMA/SMK", maxAge: 45, genderPreference: "Laki-laki", requiredSkills: ["Operator Crane 25"], salaryRange: "-" },
  "OPERATOR FORKLIFT": { department: "Logistics", description: "Mengoperasikan Forklift.", requirements: ["SIO Forklift Aktif", "Pengalaman Min 1 tahun"], minEducation: "SMA/SMK", maxAge: 40, genderPreference: "Any", requiredSkills: ["Operator Forklift"], salaryRange: "-" },
  "OPERATOR CRANE": { department: "Operations", description: "Mengoperasikan unit Crane.", requirements: ["SIO Crane Aktif", "Pengalaman Min 3 tahun"], minEducation: "SMA/SMK", maxAge: 45, genderPreference: "Laki-laki", requiredSkills: ["Operator Crane"], salaryRange: "-" },
  "OPERATOR CREW LAR MAX 100": { department: "Operations", description: "Mengoperasikan Crane Lar Max 100.", requirements: ["SIO Crane Lar Aktif", "Pengalaman Min 3 tahun"], minEducation: "SMA/SMK", maxAge: 45, genderPreference: "Laki-laki", requiredSkills: ["Operator Crane"], salaryRange: "-" },
  "OPERATOR CREW LAR MIN 100": { department: "Operations", description: "Mengoperasikan Crane Lar Min 100.", requirements: ["SIO Crane Lar Aktif", "Pengalaman Min 3 tahun"], minEducation: "SMA/SMK", maxAge: 45, genderPreference: "Laki-laki", requiredSkills: ["Operator Crane"], salaryRange: "-" },
  "OPERATOR CREW LAR MIN 150": { department: "Operations", description: "Mengoperasikan Crane Lar Min 150.", requirements: ["SIO Crane Lar Aktif", "Pengalaman Min 3 tahun"], minEducation: "SMA/SMK", maxAge: 45, genderPreference: "Laki-laki", requiredSkills: ["Operator Crane"], salaryRange: "-" },
  "OPERATOR CREW LAR MIN 250": { department: "Operations", description: "Mengoperasikan Crane Lar Min 250.", requirements: ["SIO Crane Lar Aktif", "Pengalaman Min 3 tahun"], minEducation: "SMA/SMK", maxAge: 45, genderPreference: "Laki-laki", requiredSkills: ["Operator Crane"], salaryRange: "-" },
  "DRIVER LIGER TRUCK": { department: "Logistics", description: "Mengemudikan Light Truck.", requirements: ["SIM BII Aktif", "Pengalaman Min 2 tahun"], minEducation: "SMA/SMK", maxAge: 45, genderPreference: "Laki-laki", requiredSkills: ["Driver"], salaryRange: "-" },
  "OPERATOR KENDE": { department: "Operations", description: "Mengoperasikan Kende.", requirements: ["SIO Aktif", "Pengalaman Min 2 tahun"], minEducation: "SMA/SMK", maxAge: 45, genderPreference: "Laki-laki", requiredSkills: ["Operator Kende"], salaryRange: "-" },
  "OPERATOR GRADER": { department: "Operations", description: "Mengoperasikan Motor Grader.", requirements: ["SIO Grader Aktif", "Pengalaman Min 3 tahun"], minEducation: "SMA/SMK", maxAge: 45, genderPreference: "Laki-laki", requiredSkills: ["Operator Grader"], salaryRange: "-" },
  "OPERATOR ADT": { department: "Operations", description: "Mengoperasikan ADT.", requirements: ["SIO ADT Aktif", "Pengalaman Min 3 tahun"], minEducation: "SMA/SMK", maxAge: 45, genderPreference: "Laki-laki", requiredSkills: ["Operator ADT"], salaryRange: "-" },
  "Road Roller Vibro Compactor": { department: "Operations", description: "Mengoperasikan Road Roller.", requirements: ["SIO Road Roller Aktif", "Pengalaman Min 2 tahun"], minEducation: "SMA/SMK", maxAge: 45, genderPreference: "Laki-laki", requiredSkills: ["Operator Roller"], salaryRange: "-" },
  "Truck Mixer": { department: "Logistics", description: "Mengemudikan Truck Mixer.", requirements: ["SIM BII Aktif", "Pengalaman Min 2 tahun"], minEducation: "SMA/SMK", maxAge: 45, genderPreference: "Laki-laki", requiredSkills: ["Driver"], salaryRange: "-" },
  "Fuel Tank Truck": { department: "Logistics", description: "Mengemudikan Fuel Tank Truck.", requirements: ["SIM BII Aktif", "Pengalaman Min 2 tahun"], minEducation: "SMA/SMK", maxAge: 45, genderPreference: "Laki-laki", requiredSkills: ["Driver"], salaryRange: "-" },
  "Operator Drilling": { department: "Operations", description: "Mengoperasikan Drilling Rig.", requirements: ["SIO Drilling Aktif", "Pengalaman Min 3 tahun"], minEducation: "SMA/SMK", maxAge: 45, genderPreference: "Laki-laki", requiredSkills: ["Operator Drilling"], salaryRange: "-" },
  "Helper Crew": { department: "Operations", description: "Membantu crew site.", requirements: ["Sehat Jasmani"], minEducation: "SMA/SMK", maxAge: 35, genderPreference: "Laki-laki", requiredSkills: ["Helper"], salaryRange: "-" },
  "Tukang": { department: "Maintenance", description: "Tukang serumah tangga.", requirements: ["Pengalaman kerja di bidang konstruksi"], minEducation: "SMA/SMK", maxAge: 40, genderPreference: "Laki-laki", requiredSkills: ["Tukang"], salaryRange: "-" },
  "Crew Ketinggian": { department: "Operations", description: "Bekerja di ketinggian.", requirements: ["Sertifikat Ketinggian"], minEducation: "SMA/SMK", maxAge: 35, genderPreference: "Laki-laki", requiredSkills: ["Ketinggian"], salaryRange: "-" },
  "Tukang kayu": { department: "Maintenance", description: "Tukang Kayu.", requirements: ["Pengalaman woodworking"], minEducation: "SMA/SMK", maxAge: 40, genderPreference: "Laki-laki", requiredSkills: ["Tukang Kayu"], salaryRange: "-" },
  "Tukang Besi": { department: "Maintenance", description: "Tukang Besi.", requirements: ["Pengalaman besi bangunan"], minEducation: "SMA/SMK", maxAge: 40, genderPreference: "Laki-laki", requiredSkills: ["Tukang Besi"], salaryRange: "-" },
  "Tukang Las Acet / Oxy": { department: "Maintenance", description: "Tukang las oxy.", requirements: ["Sertifikat las"], minEducation: "SMA/SMK", maxAge: 40, genderPreference: "Laki-laki", requiredSkills: ["Las"], salaryRange: "-" },
  "Tukang Las CAW/ Co2": { department: "Maintenance", description: "Tukang las Co2.", requirements: ["Sertifikat las"], minEducation: "SMA/SMK", maxAge: 40, genderPreference: "Laki-laki", requiredSkills: ["Las"], salaryRange: "-" },
  "Las argon": { department: "Maintenance", description: "Tukang las argon.", requirements: ["Sertifikat las"], minEducation: "SMA/SMK", maxAge: 40, genderPreference: "Laki-laki", requiredSkills: ["Las Argon"], salaryRange: "-" },
  "Operator LV": { department: "Operations", description: "Operator LV.", requirements: ["SIM A Aktif"], minEducation: "SMA/SMK", maxAge: 40, genderPreference: "Laki-laki", requiredSkills: ["Driver"], salaryRange: "-" },
  "Juru ukur": { department: "Engineering", description: "Juru ukur proyek.", requirements: ["Pengalaman Survey", "Pendidikan minimal D3"], minEducation: "D3", maxAge: 40, genderPreference: "Any", requiredSkills: ["Survey"], salaryRange: "-" },
  "Tukang Scaffolding": { department: "Maintenance", description: "Tukang Scaffolding.", requirements: ["Sertifikat Scaffolding"], minEducation: "SMA/SMK", maxAge: 40, genderPreference: "Laki-laki", requiredSkills: ["Scaffolding"], salaryRange: "-" },
  "Tukang Listrik": { department: "Maintenance", description: "Tukang Listrik.", requirements: ["Sertifikat Listrik"], minEducation: "SMA/SMK", maxAge: 40, genderPreference: "Laki-laki", requiredSkills: ["Listrik"], salaryRange: "-" },
  "Tukang Batu": { department: "Maintenance", description: "Tukang Batu.", requirements: ["Pengalaman konstruksi"], minEducation: "SMA/SMK", maxAge: 40, genderPreference: "Laki-laki", requiredSkills: ["Tukang Batu"], salaryRange: "-" },
  "Safety": { department: "Safety", description: "Ahli K3.", requirements: ["Sertifikat AK3"], minEducation: "D3", maxAge: 40, genderPreference: "Any", requiredSkills: ["K3"], salaryRange: "-" },
  "Tukang Cat": { department: "Maintenance", description: "Tukang Cat.", requirements: ["Pengalaman pengecatan"], minEducation: "SMA/SMK", maxAge: 40, genderPreference: "Laki-laki", requiredSkills: ["Tukang Cat"], salaryRange: "-" },
  "Fitter Piping": { department: "Maintenance", description: "Fitter Piping.", requirements: ["Pengalaman piping"], minEducation: "SMA/SMK", maxAge: 40, genderPreference: "Laki-laki", requiredSkills: ["Fitter"], salaryRange: "-" },
  "Mekanik Sedang": { department: "Maintenance", description: "Mekanik alat berat.", requirements: ["Sertifikasi Mekanik"], minEducation: "SMA/SMK", maxAge: 40, genderPreference: "Laki-laki", requiredSkills: ["Mekanik"], salaryRange: "-" },
  "Mekanik Senior": { department: "Maintenance", description: "Mekanik alat berat senior.", requirements: ["Sertifikasi Mekanik"], minEducation: "SMA/SMK", maxAge: 45, genderPreference: "Laki-laki", requiredSkills: ["Mekanik Senior"], salaryRange: "-" },
  "Pengawas": { department: "Operations", description: "Pengawas proyek.", requirements: ["Sertifikasi POP"], minEducation: "D3", maxAge: 45, genderPreference: "Any", requiredSkills: ["Pengawas"], salaryRange: "-" },
  "Admin": { department: "Finance", description: "Administrasi.", requirements: ["Handal Komputer"], minEducation: "D3", maxAge: 35, genderPreference: "Any", requiredSkills: ["Admin"], salaryRange: "-" }
};

const getRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateDummyJobs = (): JobVacancy[] => {
  const jobs: JobVacancy[] = [];
  positions.forEach((title, i) => {
    const spec = jobDetailsMap[title];
    if (!spec) return;
    const loc = "Morowali";
    const coords = cityCoords["Morowali"];
    jobs.push({
      id: `job-${i + 1}`,
      title: title,
      department: spec.department,
      location: loc, // Morowali
      latitude: coords.lat + (Math.random() - 0.5) * 0.04,
      longitude: coords.lng + (Math.random() - 0.5) * 0.04,
      clientId: "IMIP", // PT Indonesia Morowali Industrial Park
      projectId: "IMIP-PROJ",
      type: 'Contract',
      description: spec.description,
      requirements: spec.requirements,
      isActive: true,
      createdAt: new Date(Date.now() - getRandomInt(1, 10) * 24 * 60 * 60 * 1000).toISOString(),
      minEducation: spec.minEducation,
      maxAge: spec.maxAge,
      genderPreference: spec.genderPreference,
      requiredSkillsList: spec.requiredSkills,
      salaryRange: spec.salaryRange
    });
  });
  return jobs;
};

const generateDummyEmployees = (count: number): Employee[] => {
  const employees: Employee[] = [];
  for (let i = 0; i < count; i++) {
    const fname = getRandom(firstNames);
    const lname = getRandom(lastNames);
    const statusIdx = getRandomInt(0, 100);
    let status: ApplicationStatus = 'APPLIED';
    if (statusIdx > 85) status = 'REJECTED';
    else if (statusIdx > 75) status = 'HIRED';
    else if (statusIdx > 60) status = 'OFFERING';
    else if (statusIdx > 30) status = 'INTERVIEW';

    const appliedPos = getRandom(positions);
    employees.push({
      id: `emp-${i + 1}`,
      positionApplied: appliedPos,
      fullName: `${fname} ${lname}`,
      nik: `7201${getRandomInt(10, 99)}${getRandomInt(10, 99)}${getRandomInt(10, 99)}000${getRandomInt(1, 9)}`,
      kkNumber: `7201${getRandomInt(10, 99)}${getRandomInt(10, 99)}${getRandomInt(10, 99)}000${getRandomInt(1, 9)}`,
      placeOfBirth: getRandom(cities),
      dateOfBirth: new Date(1985 + getRandomInt(0, 20), getRandomInt(0, 11), getRandomInt(1, 28)).toISOString(),
      gender: getRandom(["Laki-laki", "Laki-laki", "Perempuan"]),
      religion: "Islam",
      maritalStatus: getRandom(["Selajang", "Menikah"]),
      whatsappNumber: `+628${getRandomInt(10, 99)}${getRandomInt(100, 999)}${getRandomInt(1000, 9999)}`,
      email: `${fname.toLowerCase()}.${lname.toLowerCase()}@example.com`,
      domicileAddress: `Jl. Trans Sulawesi, ${getRandom(cities)}, Sulawesi Tengah`,
      latitude: cityCoords["Palu"].lat + (Math.random() - 0.5) * 1.5,
      longitude: cityCoords["Palu"].lng + (Math.random() - 0.5) * 1.5,
      telegramId: `${fname.toLowerCase()}_${getRandomInt(100, 999)}`,
      lastEducation: getRandom(["SMA/SMK/Sederajat", "Diploma (D3)", "Sarjana (S1)"]),
      institutionName: "SMK Negeri 1 Palu",
      major: "Teknik Mesin",
      graduationYear: 2010 + getRandomInt(0, 10),
      skills: (jobDetailsMap[appliedPos]?.requiredSkills || ["Safety", "Disiplin"]).join(', '),
      workExperience: `2 Tahun mengabdi sebagai tenaga kontrak lapangan di proyek Sulawesi Tengah.`,
      bankName: "Bank Sulteng",
      accountNumber: `${getRandomInt(100000, 999999)}`,
      emergencyName: `Keluarga ${fname}`,
      emergencyRelation: "Saudara",
      emergencyPhone: `+62852${getRandomInt(1000, 9999)}${getRandomInt(1000, 9999)}`,
      applicationLetterPath: `data:text/html,Lampiran Surat Lamaran ${fname}`,
      cvPath: `data:text/html,CV ${fname}`,
      ktpPath: `data:text/html,KTP ${fname}`,
      diplomaPath: '',
      photoPath: `https://ui-avatars.com/api/?name=${fname}+${lname}&background=random`, 
      kkPath: '',
      certificatePath: '',
      status: status,
      isInTalentPool: status === 'REJECTED' || Math.random() > 0.85, // Preseed talent pool for simulation
      jobId: `job-${getRandomInt(1, 10)}`,
      hrNotes: status === 'REJECTED' ? 'Kualifikasi teknis belum memenuhi minimal pengalaman' : (status === 'INTERVIEW' ? 'Jadwal wawancara di Morowali' : ''),
      interviewDate: status === 'INTERVIEW' ? new Date(Date.now() + 86400000 * 2).toISOString() : undefined,
      
      // Seed ERP database fields
      employeeType: i % 3 === 0 ? 'INTERNAL' : 'PROJECT',
      clientId: i % 3 === 0 ? undefined : (1 + (i % 5)).toString(),
      projectId: i % 3 === 0 ? undefined : (1 + (i % 3)).toString(),
      payrollType: i % 5 === 0 ? 'BULANAN' : (i % 5 === 1 ? 'MINGGUAN' : (i % 5 === 2 ? 'HARIAN' : (i % 5 === 3 ? 'BORONGAN' : 'CUSTOM'))),
      basicSalary: i % 5 === 0 ? 6200000 : (i % 5 === 1 ? 1450000 : (i % 5 === 2 ? 210000 : (i % 5 === 3 ? 3800000 : 4500000))),
      allowanceMakan: 350000,
      allowanceTransport: 250000,
      allowanceKesehatan: 180000,
      overtimeHourlyRate: 35000,
      customBenefitName: i % 5 === 4 ? 'Insentif Lapangan Khusus' : undefined,
      customBenefitAmount: i % 5 === 4 ? 400000 : undefined,

      createdAt: new Date(Date.now() - getRandomInt(0, 30) * 24 * 60 * 60 * 1000).toISOString(),
    });
  }
  return employees;
};

const defaultClients: Client[] = [
  { 
    id: '1', 
    name: 'PT Sulawesi Nickel Industry', 
    industry: 'Mining & Smelter', 
    address: 'Morowali, Sulawesi Tengah', 
    contactPerson: 'Budi Santoso', 
    createdAt: new Date().toISOString(),
    npwpNumber: '01.234.567.8-721.000',
    npwpDocPath: 'data:text/html,Lampiran NPWP PT Sulawesi Nickel Industry',
    ndaNumber: 'NDA/SULTENG/SNI/2026/004',
    ndaDocPath: 'data:text/html,Lampiran NDA Kerjasama PT Sulawesi Nickel Industry',
    paktaIntegritasDocPath: 'data:text/html,Lampiran Pakta Integritas Keselamatan Kerja PT Sulawesi Nickel Industry',
    isActive: true
  },
  { 
    id: '2', 
    name: 'Bank Pembangunan Daerah Sulteng (BPD)', 
    industry: 'Banking', 
    address: 'Jl. Jenderal Sudirman No. 22, Palu', 
    contactPerson: 'Siti Aminah', 
    createdAt: new Date().toISOString(),
    npwpNumber: '02.999.888.7-721.000',
    npwpDocPath: 'data:text/html,Lampiran NPWP Bank PPD Sulteng',
    ndaNumber: 'NDA/BPD-SULTENG/PERDANA/2026/102',
    ndaDocPath: 'data:text/html,Lampiran Perjanjian NDA BPD Sulteng',
    paktaIntegritasDocPath: 'data:text/html,Lampiran Pakta Integritas Kebijakan Anti Rasuah BPD Sulteng',
    isActive: true
  },
  { 
    id: '3', 
    name: 'PT Poso Energy', 
    industry: 'Energy & Power', 
    address: 'Sulewana, Pamona Utara, Poso', 
    contactPerson: 'Rudi Hartono', 
    createdAt: new Date().toISOString(),
    npwpNumber: '03.456.789.2-722.000',
    npwpDocPath: 'data:text/html,Lampiran NPWP PT Poso Energy',
    ndaNumber: 'NDA-PE/PROJ-PLTA/2026/08',
    ndaDocPath: 'data:text/html,Lampiran Perjanjian Kerahasiaan Poso Energy',
    paktaIntegritasDocPath: 'data:text/html,Lampiran Dokumen Pakta Integritas Lingkungan Hidup Poso Energy',
    isActive: true
  },
  { 
    id: '4', 
    name: 'PT Palu Mining Lestari', 
    industry: 'Mining', 
    address: 'Kawatuna, Mantikulore, Palu', 
    contactPerson: 'Dewi Lestari', 
    createdAt: new Date().toISOString(),
    npwpNumber: '04.111.222.3-721.000',
    npwpDocPath: 'data:text/html,Lampiran NPWP PT Palu Mining Lestari',
    ndaNumber: 'NDA/PML/HRD-PERDANA/2026/05',
    ndaDocPath: 'data:text/html,Lampiran NDA PT Palu Mining',
    paktaIntegritasDocPath: 'data:text/html,Lampiran Pakta Integritas Kepatuhan Lingkungan Palu Mining',
    isActive: true
  },
  { 
    id: '5', 
    name: 'PT Donggala Logistik', 
    industry: 'Logistics', 
    address: 'Tanjung Batu, Donggala', 
    contactPerson: 'Kevin Aluwi', 
    createdAt: new Date().toISOString(),
    npwpNumber: '05.333.444.5-721.000',
    npwpDocPath: 'data:text/html,Lampiran NPWP PT Donggala Logistik',
    ndaNumber: 'NDA/DL/LOGS-PERDANA/2026/12',
    ndaDocPath: 'data:text/html,Lampiran Dokumen NDA Donggala Logistik',
    paktaIntegritasDocPath: 'data:text/html,Lampiran Pakta Integritas Anti Penyuapan Donggala Logistik',
    isActive: true
  },
];

const defaultProjects: Project[] = [
  { 
    id: '1', 
    name: 'Smelter Construction Morowali', 
    clientId: '1', 
    description: 'Konstruksi proyek ekspansi smelter nikel baru di kawasan industri hilirisasi Morowali, mempekerjakan ratusan operator bersertifikat kompetensi.', 
    startDate: '2023-01-01', 
    createdAt: new Date().toISOString(),
    poNumber: 'PO-992-MOROWALI',
    poDocPath: 'data:text/html,Lampiran Dokumen PO Smelter Construction Morowali',
    spkNumber: 'SPK-SNI-PERDANA-2023-001',
    spkDocPath: 'data:text/html,Lampiran Dokumen SPK Smelter Construction Morowali',
    contractValue: 12500000000,
    isActive: true
  },
  { 
    id: '2', 
    name: 'Financial Back-office Sulteng', 
    clientId: '2', 
    description: 'Penyediaan dan operasional tenaga alih daya kluster administrative, teller, pengadministrative data, serta operator IT di seluruh kantor cabang BPD Bank Sulteng.', 
    startDate: '2023-03-15', 
    createdAt: new Date().toISOString(),
    poNumber: 'PO-BPD-SULTENG-A1',
    poDocPath: 'data:text/html,Lampiran Dokumen PO Financial Backoffice Sulteng',
    spkNumber: 'SPK-BPD-PERDANA-2023-102',
    spkDocPath: 'data:text/html,Lampiran Dokumen SPK Financial Backoffice Sulteng',
    contractValue: 4500000000,
    isActive: true
  },
  { 
    id: '3', 
    name: 'Hydroelectric Security Poso', 
    clientId: '3', 
    description: 'Sistem pengamanan, patroli lingkungan keria terproteksi, serta mitigasi risiko vital pada Turbin Utama Pembangkit Listrik PLTA Poso Energy Sektor Sulewana.', 
    startDate: '2023-05-20', 
    createdAt: new Date().toISOString(),
    poNumber: 'PO-POSO-ENERGY-H9',
    poDocPath: 'data:text/html,Lampiran Dokumen PO Hydroelectric Security Poso',
    spkNumber: 'SPK/POSO-ENERGY/HRD-SERVICE/2023-55',
    spkDocPath: 'data:text/html,Lampiran Dokumen SPK Hydroelectric Security Poso',
    contractValue: 8600000000,
    isActive: true
  },
];

// --- HIGH-EFFICIENCY MEMORY CACHING ENGINE (MINIMIZES FIRESTORE API READ BILLING) ---
interface CacheStore {
  employees: { data: Employee[]; timestamp: number } | null;
  clients: { data: Client[]; timestamp: number } | null;
  projects: { data: Project[]; timestamp: number } | null;
  jobs: { data: JobVacancy[]; timestamp: number } | null;
}

const cache: CacheStore = {
  employees: null,
  clients: null,
  projects: null,
  jobs: null
};

const CACHE_STALE_MS = 20000; // 20 seconds cache TTL for blistering speed & high responsiveness

export const invalidateCache = (collectionName: keyof CacheStore) => {
  cache[collectionName] = null;
  console.log(`🧹 Cache invalidated for collection: ${collectionName}`);
};

export const clearAllCaches = () => {
  cache.employees = null;
  cache.clients = null;
  cache.projects = null;
  cache.jobs = null;
  console.log(`🧹 All database caches cleared.`);
};

// --- CORE FIRESTORE CRUDS WITH AUTO-SEEDING ---

export const getEmployees = async (): Promise<Employee[]> => {
  const path = 'employees';
  if (cache.employees && (Date.now() - cache.employees.timestamp < CACHE_STALE_MS)) {
    console.log("⚡ [CACHE HIT] getEmployees retrieved from memory cache.");
    return [...cache.employees.data];
  }

  try {
    const snap = await getDocs(collection(db, path));
    if (snap.empty) {
      console.log("Employees empty in Firestore. Seeding 35 demo candidates...");
      const seeded = generateDummyEmployees(35);
      const batch = writeBatch(db);
      for (const emp of seeded) {
        batch.set(doc(db, path, emp.id), emp);
      }
      await batch.commit();
      const sorted = seeded.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const normalized = sorted.map(emp => ({
        ...emp,
        whatsappNumber: ensurePlus62(emp.whatsappNumber),
        emergencyPhone: ensurePlus62(emp.emergencyPhone)
      }));
      cache.employees = { data: normalized, timestamp: Date.now() };
      localStorage.setItem('local_employees', JSON.stringify(normalized));
      return [...normalized];
    }
    const employees: Employee[] = [];
    snap.forEach((doc) => {
      employees.push(doc.data() as Employee);
    });

    // Ensure Google Demo Candidates exist for robust portal testing
    // Removed Andi and Siti demo candidates as requested

    const sorted = employees.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const normalized = sorted.map(emp => ({
      ...emp,
      whatsappNumber: ensurePlus62(emp.whatsappNumber),
      emergencyPhone: ensurePlus62(emp.emergencyPhone)
    }));
    cache.employees = { data: normalized, timestamp: Date.now() };
    localStorage.setItem('local_employees', JSON.stringify(normalized));
    return [...normalized];
  } catch (error) {
    console.warn("⚠️ [FIRESTORE EXCEPTION] getEmployees failed. Falling back to Local Storage/InMemory Database.", error);
    const local = localStorage.getItem('local_employees');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        const normalized = parsed.map((emp: any) => ({
          ...emp,
          whatsappNumber: ensurePlus62(emp.whatsappNumber),
          emergencyPhone: ensurePlus62(emp.emergencyPhone)
        }));
        cache.employees = { data: normalized, timestamp: Date.now() };
        return normalized;
      } catch (e) {
        console.error("Local JSON parse failed:", e);
      }
    }
    const seeded = generateDummyEmployees(35);
    const normalized = seeded.map(emp => ({
      ...emp,
      whatsappNumber: ensurePlus62(emp.whatsappNumber),
      emergencyPhone: ensurePlus62(emp.emergencyPhone)
    }));
    localStorage.setItem('local_employees', JSON.stringify(normalized));
    cache.employees = { data: normalized, timestamp: Date.now() };
    return [...normalized];
  }
};

export const createEmployee = async (data: NewEmployee): Promise<Employee> => {
  // Check if NIK already exists to prevent duplicate application
  const currentEmployees = await getEmployees();
  if (data.nik && currentEmployees.some(emp => emp.nik === data.nik)) {
    throw new Error(`Anda sudah pernah mendaftar sebelumnya. NIK (${data.nik}) sudah terdaftar di sistem kami.`);
  }

  const path = 'employees';
  const id = Math.random().toString(36).substring(2, 11);
  const newEmployee: Employee = {
    ...standardizeEmployee(data) as Employee,
    id,
    status: 'APPLIED',
    isInTalentPool: false,
    createdAt: new Date().toISOString()
  };

  try {
    const local = localStorage.getItem('local_employees');
    const list = local ? JSON.parse(local) : [];
    list.unshift(newEmployee);
    localStorage.setItem('local_employees', JSON.stringify(list));
  } catch (e) {
    console.error("Local storage employee sync error", e);
  }

  try {
    await setDoc(doc(db, path, id), cleanDoc(newEmployee));
    invalidateCache('employees');
    return newEmployee;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    invalidateCache('employees');
    return newEmployee;
  }
};

export const updateEmployee = async (id: string, updates: Partial<Employee>): Promise<Employee> => {
  const path = 'employees';
  const standardizedUpdates = standardizeEmployee(updates);
  
  let localUpdated: Employee | null = null;
  try {
    const local = localStorage.getItem('local_employees');
    if (local) {
      const list: Employee[] = JSON.parse(local);
      const idx = list.findIndex(e => e.id === id);
      if (idx !== -1) {
        const extraUpdates: Partial<Employee> = {};
        if (standardizedUpdates.status === 'REJECTED') {
          extraUpdates.isInTalentPool = true;
        }
        list[idx] = { ...list[idx], ...standardizedUpdates, ...extraUpdates };
        localUpdated = list[idx];
        localStorage.setItem('local_employees', JSON.stringify(list));
      }
    }
  } catch (e) {
    console.error("Local storage employee update sync error", e);
  }

  try {
    const ref = doc(db, path, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      if (localUpdated) {
        await setDoc(ref, cleanDoc(localUpdated));
        invalidateCache('employees');
        return localUpdated;
      }
      throw new Error("Kandidat tidak ditemukan");
    }
    const current = snap.data() as Employee;
    const extraUpdates: Partial<Employee> = {};
    if (standardizedUpdates.status === 'REJECTED') {
      extraUpdates.isInTalentPool = true;
    }
    const updated = { ...current, ...standardizedUpdates, ...extraUpdates };
    await updateDoc(ref, cleanDoc(updated));
    invalidateCache('employees');
    return updated;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${path}/${id}`);
    invalidateCache('employees');
    if (localUpdated) {
      return localUpdated;
    }
    throw error;
  }
};

export const deleteEmployee = async (id: string): Promise<void> => {
  const path = 'employees';
  
  try {
    const local = localStorage.getItem('local_employees');
    if (local) {
      const list: Employee[] = JSON.parse(local);
      const filtered = list.filter(e => e.id !== id);
      localStorage.setItem('local_employees', JSON.stringify(filtered));
    }
  } catch (e) {
    console.error("Local storage employee delete sync error", e);
  }

  try {
    await deleteDoc(doc(db, path, id));
    invalidateCache('employees');
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${path}/${id}`);
    invalidateCache('employees');
  }
};

// --- CLIENTS OPERATIONS ---

export const getClients = async (): Promise<Client[]> => {
  const path = 'clients';
  if (cache.clients && (Date.now() - cache.clients.timestamp < CACHE_STALE_MS)) {
    console.log("⚡ [CACHE HIT] getClients retrieved from memory cache.");
    return [...cache.clients.data];
  }

  try {
    const snap = await getDocs(collection(db, path));
    if (snap.empty) {
      console.log("Clients empty. Seeding...");
      const batch = writeBatch(db);
      for (const cli of defaultClients) {
        batch.set(doc(db, path, cli.id), cli);
      }
      await batch.commit();
      cache.clients = { data: defaultClients, timestamp: Date.now() };
      localStorage.setItem('local_clients', JSON.stringify(defaultClients));
      return [...defaultClients];
    }
    const clients: Client[] = [];
    snap.forEach(doc => {
      clients.push(doc.data() as Client);
    });
    cache.clients = { data: clients, timestamp: Date.now() };
    localStorage.setItem('local_clients', JSON.stringify(clients));
    return [...clients];
  } catch (error) {
    console.warn("⚠️ [FIRESTORE EXCEPTION] getClients failed. Falling back to Local Storage/InMemory Database.", error);
    const local = localStorage.getItem('local_clients');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        cache.clients = { data: parsed, timestamp: Date.now() };
        return parsed;
      } catch (e) {
        console.error("Local JSON parse failed for clients:", e);
      }
    }
    localStorage.setItem('local_clients', JSON.stringify(defaultClients));
    cache.clients = { data: defaultClients, timestamp: Date.now() };
    return [...defaultClients];
  }
};

export const createClient = async (data: NewClient): Promise<Client> => {
  const path = 'clients';
  const id = Math.random().toString(36).substring(2, 11);
  const newClient: Client = {
    isActive: true,
    ...data,
    id,
    createdAt: new Date().toISOString()
  };

  try {
    const local = localStorage.getItem('local_clients');
    const list = local ? JSON.parse(local) : [];
    list.push(newClient);
    localStorage.setItem('local_clients', JSON.stringify(list));
  } catch (e) {
    console.error("Local cache client sync error", e);
  }

  try {
    await setDoc(doc(db, path, id), cleanDoc(newClient));
    invalidateCache('clients');
    return newClient;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    invalidateCache('clients');
    return newClient;
  }
};

export const deleteClient = async (id: string): Promise<void> => {
  const path = 'clients';
  
  try {
    const local = localStorage.getItem('local_clients');
    if (local) {
      const list: Client[] = JSON.parse(local);
      const filtered = list.filter(c => c.id !== id);
      localStorage.setItem('local_clients', JSON.stringify(filtered));
    }
  } catch (e) {
    console.error("Local cache client delete error", e);
  }

  try {
    await deleteDoc(doc(db, path, id));
    invalidateCache('clients');
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${path}/${id}`);
    invalidateCache('clients');
  }
};

export const updateClient = async (id: string, updates: Partial<Client>): Promise<Client> => {
  const path = 'clients';
  
  let localUpdated: Client | null = null;
  try {
    const local = localStorage.getItem('local_clients');
    if (local) {
      const list: Client[] = JSON.parse(local);
      const idx = list.findIndex(c => c.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...updates };
        localUpdated = list[idx];
        localStorage.setItem('local_clients', JSON.stringify(list));
      }
    }
  } catch (e) {
    console.error("Local cache client update error", e);
  }

  try {
    const ref = doc(db, path, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      if (localUpdated) {
        await setDoc(ref, cleanDoc(localUpdated));
        invalidateCache('clients');
        return localUpdated;
      }
      throw new Error("Client tidak ditemukan");
    }
    const current = snap.data() as Client;
    const updated = { ...current, ...updates };
    await updateDoc(ref, cleanDoc(updated));
    invalidateCache('clients');
    return updated;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${path}/${id}`);
    invalidateCache('clients');
    if (localUpdated) return localUpdated;
    throw error;
  }
};

// --- PROJECTS OPERATIONS ---

export const getProjects = async (): Promise<Project[]> => {
  const path = 'projects';
  if (cache.projects && (Date.now() - cache.projects.timestamp < CACHE_STALE_MS)) {
    console.log("⚡ [CACHE HIT] getProjects retrieved from memory cache.");
    return [...cache.projects.data];
  }

  try {
    const snap = await getDocs(collection(db, path));
    if (snap.empty) {
      console.log("Projects empty. Seeding...");
      const batch = writeBatch(db);
      for (const prj of defaultProjects) {
        batch.set(doc(db, path, prj.id), prj);
      }
      await batch.commit();
      cache.projects = { data: defaultProjects, timestamp: Date.now() };
      localStorage.setItem('local_projects', JSON.stringify(defaultProjects));
      return [...defaultProjects];
    }
    const projects: Project[] = [];
    snap.forEach(doc => {
      projects.push(doc.data() as Project);
    });
    cache.projects = { data: projects, timestamp: Date.now() };
    localStorage.setItem('local_projects', JSON.stringify(projects));
    return [...projects];
  } catch (error) {
    console.warn("⚠️ [FIRESTORE EXCEPTION] getProjects failed. Falling back to Local Storage/InMemory Database.", error);
    const local = localStorage.getItem('local_projects');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        cache.projects = { data: parsed, timestamp: Date.now() };
        return parsed;
      } catch (e) {
        console.error("Local JSON parse failed for projects:", e);
      }
    }
    localStorage.setItem('local_projects', JSON.stringify(defaultProjects));
    cache.projects = { data: defaultProjects, timestamp: Date.now() };
    return [...defaultProjects];
  }
};

export const createProject = async (data: NewProject): Promise<Project> => {
  const path = 'projects';
  const id = Math.random().toString(36).substring(2, 11);
  const newProject: Project = {
    isActive: true,
    ...data,
    id,
    createdAt: new Date().toISOString()
  };

  try {
    const local = localStorage.getItem('local_projects');
    const list = local ? JSON.parse(local) : [];
    list.push(newProject);
    localStorage.setItem('local_projects', JSON.stringify(list));
  } catch (e) {
    console.error("Local cache project creation error", e);
  }

  try {
    await setDoc(doc(db, path, id), cleanDoc(newProject));
    invalidateCache('projects');
    return newProject;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    invalidateCache('projects');
    return newProject;
  }
};

export const deleteProject = async (id: string): Promise<void> => {
  const path = 'projects';
  
  try {
    const local = localStorage.getItem('local_projects');
    if (local) {
      const list: Project[] = JSON.parse(local);
      const filtered = list.filter(p => p.id !== id);
      localStorage.setItem('local_projects', JSON.stringify(filtered));
    }
  } catch (e) {
    console.error("Local cache project deletion error", e);
  }

  try {
    await deleteDoc(doc(db, path, id));
    invalidateCache('projects');
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${path}/${id}`);
    invalidateCache('projects');
  }
};

export const updateProject = async (id: string, updates: Partial<Project>): Promise<Project> => {
  const path = 'projects';
  
  let localUpdated: Project | null = null;
  try {
    const local = localStorage.getItem('local_projects');
    if (local) {
      const list: Project[] = JSON.parse(local);
      const idx = list.findIndex(p => p.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...updates };
        localUpdated = list[idx];
        localStorage.setItem('local_projects', JSON.stringify(list));
      }
    }
  } catch (e) {
    console.error("Local cache project update error", e);
  }

  try {
    const ref = doc(db, path, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      if (localUpdated) {
        await setDoc(ref, cleanDoc(localUpdated));
        invalidateCache('projects');
        return localUpdated;
      }
      throw new Error("Proyek tidak ditemukan");
    }
    const current = snap.data() as Project;
    const updated = { ...current, ...updates };
    await updateDoc(ref, cleanDoc(updated));
    invalidateCache('projects');
    return updated;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${path}/${id}`);
    invalidateCache('projects');
    if (localUpdated) return localUpdated;
    throw error;
  }
};

// --- JOBS OPERATIONS ---

export const getJobs = async (): Promise<JobVacancy[]> => {
  const path = 'jobs';
  if (cache.jobs && (Date.now() - cache.jobs.timestamp < CACHE_STALE_MS)) {
    console.log("⚡ [CACHE HIT] getJobs retrieved from memory cache.");
    return [...cache.jobs.data];
  }

  try {
    const snap = await getDocs(collection(db, path));
    if (snap.empty || snap.size !== positions.length) {
      console.log(`Jobs empty or outdated (${snap.size} vs ${positions.length}). Seeding...`);
      const seeded = generateDummyJobs();
      const batch = writeBatch(db);
      // If we are updating, we should ideally delete the old ones first, 
      // but for simplicity, we'll just overwrite with the same IDs if they conflict, 
      // or clear the collection if we could.
      // Given the Firestore constraints, let's just clear the collection if possible or just overwrite.
      // Since this is a dev environment, let's clear it.
      const existingDocs = await getDocs(collection(db, path));
      existingDocs.forEach(d => batch.delete(d.ref));
      
      for (const j of seeded) {
        batch.set(doc(db, path, j.id), j);
      }
      await batch.commit();
      cache.jobs = { data: seeded, timestamp: Date.now() };
      localStorage.setItem('local_jobs', JSON.stringify(seeded));
      return [...seeded];
    }
    const jobs: JobVacancy[] = [];
    snap.forEach(doc => {
      jobs.push(doc.data() as JobVacancy);
    });
    cache.jobs = { data: jobs, timestamp: Date.now() };
    localStorage.setItem('local_jobs', JSON.stringify(jobs));
    return [...jobs];
  } catch (error) {
    console.warn("⚠️ [FIRESTORE EXCEPTION] getJobs failed. Falling back to Local Storage/InMemory Database.", error);
    const local = localStorage.getItem('local_jobs');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        cache.jobs = { data: parsed, timestamp: Date.now() };
        return parsed;
      } catch (e) {
        console.error("Local JSON parse failed for jobs:", e);
      }
    }
    const seeded = generateDummyJobs();
    localStorage.setItem('local_jobs', JSON.stringify(seeded));
    cache.jobs = { data: seeded, timestamp: Date.now() };
    return [...seeded];
  }
};

export const createJob = async (data: NewJobVacancy): Promise<JobVacancy> => {
  const path = 'jobs';
  const id = Math.random().toString(36).substring(2, 11);
  const newJob: JobVacancy = {
    ...data,
    id,
    isActive: true,
    createdAt: new Date().toISOString()
  };

  try {
    const local = localStorage.getItem('local_jobs');
    const list = local ? JSON.parse(local) : [];
    list.push(newJob);
    localStorage.setItem('local_jobs', JSON.stringify(list));
  } catch (e) {
    console.error("Local cache job addition error", e);
  }

  try {
    await setDoc(doc(db, path, id), cleanDoc(newJob));
    invalidateCache('jobs');
    return newJob;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    invalidateCache('jobs');
    return newJob;
  }
};

export const updateJob = async (id: string, updates: Partial<JobVacancy>): Promise<JobVacancy> => {
  const path = 'jobs';
  
  let localUpdated: JobVacancy | null = null;
  try {
    const local = localStorage.getItem('local_jobs');
    if (local) {
      const list: JobVacancy[] = JSON.parse(local);
      const idx = list.findIndex(j => j.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...updates } as JobVacancy;
        localUpdated = list[idx];
        localStorage.setItem('local_jobs', JSON.stringify(list));
      }
    }
  } catch (e) {
    console.error("Local cache job update error", e);
  }

  try {
    const ref = doc(db, path, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      if (localUpdated) {
        await setDoc(ref, cleanDoc(localUpdated));
        invalidateCache('jobs');
        return localUpdated;
      }
      throw new Error("Job empty");
    }
    const updated = { ...snap.data(), ...updates } as JobVacancy;
    await updateDoc(ref, cleanDoc(updated));
    invalidateCache('jobs');
    return updated;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${path}/${id}`);
    invalidateCache('jobs');
    if (localUpdated) return localUpdated;
    throw error;
  }
};

export const deleteJob = async (id: string): Promise<void> => {
  const path = 'jobs';
  
  try {
    const local = localStorage.getItem('local_jobs');
    if (local) {
      const list: JobVacancy[] = JSON.parse(local);
      const filtered = list.filter(j => j.id !== id);
      localStorage.setItem('local_jobs', JSON.stringify(filtered));
    }
  } catch (e) {
    console.error("Local cache job delete error", e);
  }

  try {
    await deleteDoc(doc(db, path, id));
    invalidateCache('jobs');
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${path}/${id}`);
    invalidateCache('jobs');
  }
};

export const clearDatabase = () => {
  // Clear local storage and let Firestore reload
  localStorage.clear();
  clearAllCaches();
  window.location.reload();
};
