export interface AssetCreateForm {
  brand: string;
  model: string;
  assetType: string;
  serialNumber: string;
  businessUnit: string;
  notes?: string;
}

export interface Asset {
  id: string;
  status: 'Assigned' | 'Available' | 'Dismissed';
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
}

export interface AssetDetail {
  id: string;
  businessUnit: string;
  brand: string;
  model: string;
  serialNumber: string;
  assignedUser: string | null;
  assignedUserId: string | null;
  assignmentDate: string | null;
  returnDate: string | null;
  notes: string;
  status: 'Assigned' | 'Available' | 'Dismissed';
  statusLabel: string;
  assetType: string;
  movements: AssetMovement[];
}

export interface AssignAssetForm {
  assignmentDate: string;
  userId: string;
  userName: string;
  notes?: string;
}