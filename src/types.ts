export interface Student {
  id: string;
  name: string;
  studentId: string;
  photoUrl: string;
  createdAt: any;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  name: string;
  date: string;
  timestamp: any;
  status: 'Present' | 'Late';
}

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
    userId?: string;
    email?: string;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}
