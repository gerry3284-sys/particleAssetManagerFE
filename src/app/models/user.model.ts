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
    code: string,
    brand: string,
    model: string,
    serialNumber: string,
  },
  date: string,
  updateDate: string,
}