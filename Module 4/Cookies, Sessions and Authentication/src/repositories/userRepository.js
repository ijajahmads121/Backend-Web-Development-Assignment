const prisma = require('../db/prisma');

async function findCredentialsByEmail(email) {
  return prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, passwordHash: true },
  });
}

async function findPublicById(id) {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true },
  });
}

module.exports = { findCredentialsByEmail, findPublicById };
