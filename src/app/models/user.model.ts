export interface User {
  id: number;
  email: string;
  name: string,
  surname: string
  phoneNumber: string,
  userType: string,
  businessUnit: {
    id: number,
    name: string,
    active: boolean
  };
}
export interface Movement {
  id: number;
  dismesso: boolean;
  marca: string;
  modello: string;
  numeroSeriale: string;
  dataAssegnazione: string;
  dataRiconsegna: '-'|string;
}
export interface BusinessType {
  id: number,
  name: string
}