import bcrypt from "bcryptjs";
// Number of salt rounds for hashing
const saltRounds = 10;

// Hash password
export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(saltRounds);
  return bcrypt.hash(password, salt);
}

// Compare passwords
export async function verifyPassword(enteredPassword, hashedPassword) {
  return bcrypt.compare(enteredPassword, hashedPassword);
}
