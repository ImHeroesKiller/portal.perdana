
export type ApplicationStatus = 'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'OFFERING' | 'CONTRACT' | 'HIRED' | 'REJECTED';

export interface OfferingDetails {
  salary: string;
  allowance: string;
  benefits: string; // BPJS, Insurance, etc.
  startDate: string;
  placementLocation: string;
  picPerdana: string;
  picClient: string;
  contractDuration: string;
  sentAt: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
}

export interface AIInterviewResult {
  completedAt: string;
  durationSeconds: number;
  starAnalysis: {
    situation: string;
    task: string;
    action: string;
    result: string;
  };
  overallScore: number;
  summary: string;
  videoUrl?: string; // Simulated path
}

export interface Employee {
  // Identity Section
  id: string; // Changed from number to string for UUID/Consistency
  positionApplied: string;
  fullName: string;
  nik: string;
  kkNumber: string;
  npwp?: string; // Optional
  placeOfBirth: string;
  dateOfBirth: string; // ISO Date string
  gender: string;
  religion: string;
  maritalStatus: string;

  // Contact Section
  whatsappNumber: string;
  email: string;
  domicileAddress: string;
  latitude?: number; // New for Map
  longitude?: number; // New for Map
  
  // Social Media (Optional) - New
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  
  // Telegram Integration
  telegramId: string;

  // Education Section
  lastEducation: string;
  institutionName: string;
  major: string;
  graduationYear: number;
  skills: string;

  // Experience Section
  workExperience: string;

  // Bank Section
  bankName: string;
  accountNumber: string;

  // Emergency Contact
  emergencyName: string;
  emergencyRelation: string;
  emergencyPhone: string;

  // File Paths (In this demo, these will be Data URIs or Object URLs)
  applicationLetterPath: string;
  cvPath: string;
  ktpPath: string;
  diplomaPath: string;
  photoPath: string;
  kkPath: string;
  certificatePath: string;
  
  // Contract Document
  contractDocPath?: string;

  // ATS Features (New)
  status: ApplicationStatus;
  employmentStatus?: 'ACTIVE' | 'RESIGNED' | 'TERMINATED' | 'CONTRACT_ENDED';
  contractStartDate?: string;
  contractEndDate?: string;
  terminationDate?: string;
  terminationReason?: string;
  interviewDate?: string; // ISO Date string
  interviewLocation?: string;
  interviewType?: 'online' | 'offline';
  interviewLink?: string;
  interviewLocName?: string;
  interviewAddress?: string;
  interviewPic?: string;
  hrNotes?: string;
  
  // Stage Data
  offeringData?: OfferingDetails;
  aiInterview?: AIInterviewResult;

  // Recycle Pool and Active Mapping
  isInTalentPool?: boolean;
  jobId?: string;

  // ERP Employee database properties
  employeeType?: 'INTERNAL' | 'PROJECT'; 
  clientId?: string; // If PROJECT, placed inside of this corporate client
  projectId?: string; // If PROJECT, placed inside of this active project
  
  // Payroll info schema
  payrollType?: 'BULANAN' | 'MINGGUAN' | 'HARIAN' | 'BORONGAN' | 'CUSTOM';
  basicSalary?: number; // Gaji Pokok
  allowanceMakan?: number; // Tunjangan Makan
  allowanceTransport?: number; // Tunjangan Transport
  allowanceKesehatan?: number; // Tunjangan Kesehatan / BPJS
  overtimeHourlyRate?: number; // Tarif lembur per jam
  customBenefitName?: string; // Nama Benefit Tambahan
  customBenefitAmount?: number; // Nilai Benefit Tambahan

  // Meta
  createdAt: string;
}

export type NewEmployee = Omit<Employee, 'id' | 'createdAt' | 'status'>;

export interface User {
  id: string;
  username: string; // usually email
  password?: string; // stored for demo purposes only
  role: 'admin' | 'user';
  permissions?: string[]; // permissions for modules (only if it is an admin user)
  profile?: Partial<NewEmployee>; // Store form data here
  preferences?: {
    emailNotifications: boolean;
    theme: 'light' | 'dark';
  };
}

export interface Client {
  id: string;
  name: string;
  industry: string;
  address: string;
  contactPerson: string;
  createdAt: string;
  npwpNumber?: string;
  npwpDocPath?: string; // Data URI / Simulated Path
  ndaNumber?: string;
  ndaDocPath?: string; // Data URI / Simulated Path
  paktaIntegritasDocPath?: string; // Data URI / Simulated Path
  partnershipStartDate?: string;
  partnershipEndDate?: string;
  isActive?: boolean;
}

export type NewClient = Omit<Client, 'id' | 'createdAt'>;

export interface Project {
  id: string;
  name: string;
  clientId: string;
  description: string;
  startDate: string;
  endDate?: string;
  createdAt: string;
  poNumber?: string;
  poDocPath?: string; // Data URI / Simulated Path
  spkNumber?: string;
  spkDocPath?: string; // Data URI / Simulated Path
  contractValue?: number;
  isActive?: boolean;
}

export type NewProject = Omit<Project, 'id' | 'createdAt'>;

export interface JobVacancy {
  id: string;
  title: string;
  location: string;
  latitude?: number; // For OpenStreetMap
  longitude?: number; // For OpenStreetMap
  clientId?: string;
  projectId?: string;
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
  department: string;
  description: string;
  requirements: string[]; // This acts as general text requirements
  salaryRange?: string;
  isActive: boolean;
  createdAt: string;

  // Detailed Screening Criteria
  minEducation?: string; // SMA/SMK, D3, S1
  maxAge?: number;
  genderPreference?: 'Laki-laki' | 'Perempuan' | 'Any';
  requiredSkillsList?: string[]; // Structured array for better matching
}

export type NewJobVacancy = Omit<JobVacancy, 'id' | 'createdAt' | 'isActive'>;

export interface FormErrors {
  [key: string]: string;
}
