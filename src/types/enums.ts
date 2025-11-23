export enum Role {
  ADMIN = "ADMIN",
  CUSTOMER = "CUSTOMER",
  RIDER = "RIDER",
}

export enum OrderStatus {
  PENDING = "PENDING",
  SHIPPED = "SHIPPED",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
}


export enum ConversationType {
  DIRECT = "DIRECT",
  GROUP = "GROUP",
}

export enum GroupRole {
  MEMBER = "MEMBER",
  GROUP_ADMIN = "GROUP_ADMIN",
}