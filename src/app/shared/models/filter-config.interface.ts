export interface User {
  id: number;
  name: string;
  surname: string;
  email: string;
  userType?: string;
  businessUnit: { id: number; name: string; code?: string };
}

export interface AssetType {
  id: number;
  name: string;
  code?: string;
  ram?: boolean | string | number | null;
  hardDisk?: boolean | string | number | null;
  storage?: boolean | string | number | null;
}

export interface BusinessUnit {
  id: number;
  name: string;
  code?: string;
}

export interface AssetStatusType {
  id: number;
  name: string;
  code?: string;
}

export interface FilterValues {
  assetType?: string;
  businessUnit?: string;
  status?: string;
  assignedUser?: string;
}
