export interface AssetCreateForm {
  brand: string;
  model: string;
  typology: string;
  serialNumber: string;
  businessUnit: string;
  notes?: string;
}

export interface Asset {
  id: string;
  status: 'assigned' | 'available' | 'dismissed';
  statusLabel: string;
  brand: string;
  model: string;
  serialNumber: string;
  assignedUser: string;
  businessUnit: string;
  assignmentDate: string;
  typology?: string;
  notes?: string;
}

export interface AssetMovement {
  id: string;
  date: string;
  user: string;
  userId: string;
  movementType: 'assigned' | 'returned' | 'dismissed';
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
  status: 'assigned' | 'available' | 'dismissed';
  statusLabel: string;
  typology: string;
  movements: AssetMovement[];
}

export interface AssignAssetForm {
  assignmentDate: string;
  userId: string;
  userName: string;
  notes?: string;
}