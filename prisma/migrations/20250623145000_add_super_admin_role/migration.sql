-- AlterEnum: add SUPER_ADMIN value (must be in its own migration so it can be
-- committed before any later migration tries to USE the new value).
ALTER TYPE "UserRole" ADD VALUE 'SUPER_ADMIN';
