export interface User {
  id: number,
  oid: string,
  email: string,
  name: string,
  surname: string
  phoneNumber: string,
  userType: 'ADMIN'|'USER',
  businessUnit: {
    id: number,
    code: string,
    name: string,
    active: boolean
  };
}
export interface MovementByuserID {
  code: string,
  movementType: 'ASSIGNED' | 'RETURNED' | 'DISMISSED',
  asset: {
    code: string,
    brand: string,
    model: string,
    serialNumber: string,
    statusCode: string,
  },
  date: string,
  // updateDate: string,
}