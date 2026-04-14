export interface AssetCreateForm {
  brand: string;
  model: string;
  assetType: string;
  serialNumber: string;
  businessUnit: string;
  notes?: string;
  ramGb?: number | null;
  hardDiskGb?: number | null;
}

export interface Asset {
  id: string;
  assetCode: string;
  status: 'Assigned' | 'Available' | 'Dismissed' | 'Unavailable';
  statusLabel: string;
  brand: string;
  model: string;
  serialNumber: string;
  assignedUser: string;
  businessUnit: string;
  assignmentDate: string;
  assetType?: string;
  notes?: string;
}

export interface AssetMovement {
  id: string;
  date: string;
  user: string;
  userId: string;
  movementType: 'Assigned' | 'Returned' | 'Dismissed';
  movementLabel: string;
  note?: string;
  receiptAvailable?: boolean;
}

export interface AssetDetail {
  id: string;
  assetCode: string;
  businessUnit: string;
  businessUnitCode?: string;
  brand: string;
  model: string;
  serialNumber: string;
  hardDisk?: string | null;
  ram?: number | null;
  assignedUser: string | null;
  assignedUserId: string | null;
  assignmentDate: string | null;
  returnDate: string | null;
  notes: string;
  status: 'Assigned' | 'Available' | 'Dismissed' | 'Unavailable';
  statusLabel: string;
  assetType: string;
  assetTypeCode?: string;
  assetStatusTypeCode?: string;
  movements: AssetMovement[];
}

export interface AssignAssetForm {
  assignmentDate?: string;
  userId: string;
  userName: string;
  notes?: string;
}