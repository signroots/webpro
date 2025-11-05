import jwt from "jsonwebtoken";

export interface IUserPayload {
  _id: string;
  email: string;
  role: string;
}

export const generateAccessToken = (user: IUserPayload): string => {
  return jwt.sign(user, process.env.JWT_SECRET as string, { expiresIn: "24h" });
};

export const generateRefreshToken = (user: IUserPayload): string => {
  return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET as string, { expiresIn: "7d" });
};
