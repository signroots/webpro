export interface AuthState {
  refreshToken: string | null;
  accessToken: string | null;
  userName: string | null;
  userRole: string | null;
  branchDetails: null | {};
}
