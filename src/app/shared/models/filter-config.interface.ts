export interface User {
  id: number;
  name: string;
  surname: string;
  email: string;
  businessUnit: { id: number; name: string };
}

export interface AssetType {
  id: number;
  name: string;
  code?: string;
  ram?: boolean;
  hardDisk?: boolean;
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
