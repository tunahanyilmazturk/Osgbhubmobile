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

/** Katılımcının online eğitim portalı giriş hesabı */
export type ParticipantAccount = {
  email: string;
  /** Demo: düz metin. Gerçek sistemde sunucuda hash'lenmiş tutulur. */
  password: string;
  createdAt: string;
  lastLogin?: string;
  /** İlk girişte şifre değiştirmesi istensin mi */
  mustChangePassword?: boolean;
};

export type Participant = {
  id: string;
  name: string;
  firmId: string;
  title: string;
  department: string;
  tcMasked: string;
  startDate: string;
  account?: ParticipantAccount;
};

/* ---------------- Online eğitim içeriği ---------------- */

export type Slide = {
  id: string;
  title: string;
  /** Her satır bir madde */
  body: string;
  /** İsteğe bağlı görsel adresi */
  imageUrl?: string;
};

export type Lesson = {
  id: string;
  title: string;
  type: 'slides' | 'video';
  /** Tahmini süre (dakika) */
  minutes: number;
  slides?: Slide[];
  videoUrl?: string;
  /** Video dersin altında gösterilen açıklama */
  description?: string;
};

export type Question = {
  id: string;
  text: string;
  options: string[];
  /** Doğru seçeneğin sırası */
  answer: number;
};

export type ExamKind = 'pre' | 'final';

export type Exam = {
  questions: Question[];
  /** Dakika; 0 = süre sınırı yok */
  timeLimit: number;
};

export type TrainingContent = {
  lessons: Lesson[];
  preTest: Exam;
  finalExam: Exam;
  /** Final sınavı geçme notu (%) */
  passScore: number;
  /** Final sınavı en fazla deneme */
  maxAttempts: number;
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
  description?: string;
  content: TrainingContent;
};

export type AssignmentStatus = 'planned' | 'in_progress' | 'completed';

export type DeliveryMode = 'online' | 'classroom';

export type Assignment = {
  id: string;
  /** Online: katılımcı portalından tamamlanır. Yüz yüze: yoklama ile tamamlanır. */
  delivery: DeliveryMode;
  /** Online eğitimler için son tamamlama tarihi */
  dueDate?: string;
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
  /** Online eğitimden geldiyse ilgili kayıt */
  enrollmentId?: string;
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

/* ---------------- Online eğitim kaydı (katılımcı ilerlemesi) ---------------- */

export type ExamResult = {
  score: number;
  /** Her soru için seçilen seçenek (-1 = boş) */
  answers: number[];
  /** Sınav anındaki soru kimlikleri (içerik sonradan değişse de inceleme doğru kalsın) */
  questionIds: string[];
  at: string;
  passed?: boolean;
  seconds: number;
};

export type EnrollmentStatus = 'not_started' | 'in_progress' | 'completed' | 'failed';

export type Enrollment = {
  id: string;
  assignmentId: string;
  participantId: string;
  trainingId: string;
  status: EnrollmentStatus;
  startedAt?: string;
  completedAt?: string;
  preTest?: ExamResult;
  finalAttempts: ExamResult[];
  /** Tamamlanan ders kimlikleri */
  completedLessons: string[];
  /** Ders bazında kalınan yer: slayt sırası veya video yüzdesi */
  lessonProgress: Record<string, { slide?: number; watched?: number }>;
  /** Toplam çalışma süresi (saniye) */
  seconds: number;
  /** Yönetici tarafından tanınan ek final hakkı */
  extraAttempts: number;
};
