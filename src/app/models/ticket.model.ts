export interface Ticket {
    ticketCode: string,
    userCode: string,
    operation: 'ASSIGNED' | 'DISMISSED' | 'RETURNED',
    assetTypeCode: string,
    assetCode: string,
    status: 'OPEN' | 'WORKING' | 'CLOSED',
    date: string,
    priority: 'HIGH' | 'MEDIUM' | 'LOW',
    userCheckReply: boolean,
    adminCheckReply: boolean
}
export interface Reply {
    TicketCode: string,
    user: string,
    message: string,
    status: 'OPEN' | 'WORKING' | 'CLOSED',
    date: string
}
export interface TicketByUser {
    ticketCode: string,
    user: string,
    operation: 'ASSIGNED' | 'DISMISSED' | 'RETURNED',
    assetTypeCode: string,
    assetCode: string,
    status: 'OPEN' | 'WORKING' | 'CLOSED',
    date: string,
    priority: 'HIGH' | 'MEDIUM' | 'LOW',
    userCheckReply: boolean
}