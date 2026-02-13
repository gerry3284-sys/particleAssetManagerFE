export interface User {
  id: number,
  email: string,
  name: string,
  surname: string
  phoneNumber: string,
  userType: 'ADMIN'|'USER',
  businessUnit: {
    id: number,
    name: string,
    active: boolean
  };
}
export interface MovementByuserID {
  id: number,
  movementType: 'Assigned' | 'Returned' | 'Dismissed',
  asset: {
    id: number,
    brand: string,
    model: string,
    serialNumber: string,
  },
  date: string,
  updateDate: string,
}
export interface BusinessType {
  id: number,
  name: string
}