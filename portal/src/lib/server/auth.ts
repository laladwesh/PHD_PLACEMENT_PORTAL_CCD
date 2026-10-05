import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from './mongodb';
import Company from './models/Company';

export async function getUserFromToken() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (token) {
      try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret-fallback');
        if (decoded?.role === 'coordinator' || decoded?.role === 'student') {
          return {
            role: decoded.role,
            companyId: null,
            user: decoded.user || decoded,
          };
        }
        if (decoded?.companyId) {
          await connectToDatabase();
          const company = await Company.findById(decoded.companyId);
          if (company) {
            return {
              role: 'company',
              companyId: company._id,
              user: company,
            };
          }
        }
      } catch (err) {
        // Invalid or expired token
      }
    }

    return { role: 'guest', companyId: null, user: null };
  } catch (error) {
    console.error('Error in getUserFromToken:', error);
    return { role: 'guest', companyId: null, user: null };
  }
}
