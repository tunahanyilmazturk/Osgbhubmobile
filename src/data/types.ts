export type HazardClass = 'az' | 'tehlikeli' | 'cok';

export type KatipStatus = 'synced' | 'pending' | 'error';

export type Firm = {
  id: string;
  name: string;
  sector: string;
  hazard: HazardClass;
  city: string;
  employees: number;
  sgkNo: string;
  specialistId: string;
  physicianId: string;
  dspId?: string;
  contractStart: string;
  contractEnd: string;
  katip: {
    status: KatipStatus;
    contractNo: string;
    lastSync: string;
    message?: string;
  };
};

export type TeamRole = 'specialist' | 'physician' | 'dsp';

export type TeamMember = {
  id: string;
  name: string;
  role: TeamRole;
  /** İSG uzmanları için A/B/C sınıfı */
  certClass?: 'A' | 'B' | 'C';
  certNo: string;
  email: string;
  phone: string;
};

export type Participant = {
  id: string;
  name: string;
  firmId: string;
  title: string;
  department: string;
  tcMasked: string;
  startDate: string;
};

export type Training = {
  id: string;
  title: string;
  category: 'Zorunlu' | 'Mesleki' | 'Genel';
  hours: number;
  mode: 'Yüz yüze' | 'Online' | 'Karma';
  validityMonths: number;
  icon: string;
  topics: string[];
};

export type AssignmentStatus = 'planned' | 'in_progress' | 'completed';

export type Assignment = {
  id: string;
  trainingId: string;
  firmId: string;
  trainerId: string;
  date: string;
  time: string;
  location: string;
  participantIds: string[];
  status: AssignmentStatus;
};

export type CertificateStatus = 'pending' | 'approved' | 'signed' | 'rejected';

export type Certificate = {
  id: string;
  no: string;
  participantId: string;
  trainingId: string;
  firmId: string;
  assignmentId?: string;
  trainerId: string;
  issueDate: string;
  expiryDate: string;
  status: CertificateStatus;
  approvedBy?: string;
  approvedAt?: string;
  signedBy?: string;
  signedAt?: string;
  rejectReason?: string;
};

export type SignDocType = 'attendance' | 'risk_report' | 'annual_plan' | 'emergency_plan';

export type SignDocument = {
  id: string;
  type: SignDocType;
  title: string;
  firmId: string;
  createdAt: string;
  status: 'waiting' | 'signed';
  signedAt?: string;
  signedBy?: string;
};

export type KatipLog = {
  id: string;
  at: string;
  text: string;
  tone: 'success' | 'danger' | 'neutral';
};
