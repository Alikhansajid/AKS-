export interface User {
  publicId: string;
  name: string;
  role: "ADMIN" | "CUSTOMER" | "RIDER";
}
