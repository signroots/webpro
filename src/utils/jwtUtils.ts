import jwt from 'jsonwebtoken';

export const generateToken = (userId: string, email: string, role: string): string => {
  const payload = { _id: userId, email, role };
  return jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '1h' });
};
